import React, { useMemo, useRef, useState } from 'react';
import type { WordSearchActivity, ActivityResult, LetterEvents } from '../data/types';
import { addLetterEvent } from '../lib/mastery';
import { uniqueLetters } from '../data/letters';
import { playCorrect, playWrong } from '../lib/sound';

// תפזורת בכתב רש"י.
// מצב רגיל: מילים אופקיות נקראות מימין לשמאל, אנכיות מלמעלה למטה.
// מצב "הפוך" (תפזורת הערים): אופקיות משמאל לימין.

interface Placement {
  word: string;
  cells: [number, number][];
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateGrid(activity: WordSearchActivity, seed: number): { grid: string[][]; placements: Placement[] } | null {
  const n = activity.size;
  const rnd = mulberry32(seed);
  const grid: (string | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));
  const placements: Placement[] = [];

  const words = [...activity.words].sort((a, b) => b.length - a.length);
  for (const word of words) {
    const chars = [...word.replace(/\s+/g, '')];
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const horizontal = rnd() < 0.55;
      let cells: [number, number][] = [];
      if (horizontal) {
        const row = Math.floor(rnd() * n);
        const start = Math.floor(rnd() * (n - chars.length + 1));
        // רגיל: מימין לשמאל => עמודה יורדת מ-ימין; ב-RTL רינדור, עמודה 0 היא הימנית ממילא
        // נשמור: index עמודה 0 = הכי ימני (נרנדר עם direction rtl), אז "מימין לשמאל" = עמודות עולות
        cells = chars.map((_, i) => [row, activity.reversed ? start + chars.length - 1 - i : start + i]);
      } else {
        const col = Math.floor(rnd() * n);
        const start = Math.floor(rnd() * (n - chars.length + 1));
        cells = chars.map((_, i) => [start + i, col]);
      }
      if (cells.every(([r, c], i) => grid[r][c] === null || grid[r][c] === chars[i])) {
        cells.forEach(([r, c], i) => (grid[r][c] = chars[i]));
        placements.push({ word, cells });
        placed = true;
      }
    }
    if (!placed) return null;
  }

  const pool = [...activity.fillPool];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === null) grid[r][c] = pool[Math.floor(rnd() * pool.length)];
    }
  }
  return { grid: grid as string[][], placements };
}

export default function WordSearch({
  activity,
  onFinish,
}: {
  activity: WordSearchActivity;
  onFinish: (r: ActivityResult) => void;
}) {
  const { grid, placements } = useMemo(() => {
    for (let s = 1; s < 60; s++) {
      const g = generateGrid(activity, s * 7919);
      if (g) return g;
    }
    throw new Error('לא הצלחנו לבנות תפזורת');
  }, [activity]);

  const n = activity.size;
  const [found, setFound] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [events] = useState<LetterEvents>({});
  const [anchor, setAnchor] = useState<[number, number] | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const key = (r: number, c: number) => `${r},${c}`;

  const pathCells = (): [number, number][] => {
    if (!anchor || !hover) return anchor ? [anchor] : [];
    const [r1, c1] = anchor;
    const [r2, c2] = hover;
    const cells: [number, number][] = [];
    if (r1 === r2) {
      const [lo, hi] = [Math.min(c1, c2), Math.max(c1, c2)];
      for (let c = lo; c <= hi; c++) cells.push([r1, c]);
      if (c2 < c1) cells.reverse();
    } else if (c1 === c2) {
      const [lo, hi] = [Math.min(r1, r2), Math.max(r1, r2)];
      for (let r = lo; r <= hi; r++) cells.push([r, c1]);
      if (r2 < r1) cells.reverse();
    } else {
      return [anchor];
    }
    return cells;
  };

  const cellFromEvent = (e: React.PointerEvent): [number, number] | null => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const d = el?.closest('[data-cell]') as HTMLElement | null;
    if (!d) return null;
    const [r, c] = d.dataset.cell!.split(',').map(Number);
    return [r, c];
  };

  const finishSelection = () => {
    const path = pathCells();
    setAnchor(null);
    setHover(null);
    if (path.length < 2) return;
    const pathKey = path.map(([r, c]) => key(r, c)).join('|');
    const revKey = [...path].reverse().map(([r, c]) => key(r, c)).join('|');
    const hit = placements.find((p) => {
      const pk = p.cells.map(([r, c]) => key(r, c)).join('|');
      return (pk === pathKey || pk === revKey) && !found.has(p.word);
    });
    if (hit) {
      playCorrect();
      const nf = new Set(found).add(hit.word);
      setFound(nf);
      const cellsNew = new Set(foundCells);
      hit.cells.forEach(([r, c]) => cellsNew.add(key(r, c)));
      setFoundCells(cellsNew);
      uniqueLetters(hit.word).forEach((l) => addLetterEvent(events, l, true));
      setFlash('good');
      setTimeout(() => setFlash(null), 500);
      if (nf.size === placements.length) {
        setTimeout(() => onFinish({ score: placements.length, max: placements.length, letters: events }), 700);
      }
    } else {
      playWrong();
      setFlash('bad');
      setTimeout(() => setFlash(null), 400);
    }
  };

  const activePath = new Set(pathCells().map(([r, c]) => key(r, c)));
  const cellSize = Math.min(44, Math.floor(340 / n));

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
        {activity.words.map((w) => (
          <span
            key={w}
            style={{
              padding: '4px 14px',
              borderRadius: 999,
              fontSize: 16,
              fontWeight: 700,
              background: found.has(w) ? 'var(--green-soft)' : '#fff',
              color: found.has(w) ? 'var(--green)' : 'var(--ink)',
              border: `2px solid ${found.has(w) ? 'var(--green)' : '#e2e8f0'}`,
              textDecoration: found.has(w) ? 'line-through' : 'none',
              transition: 'all 0.3s',
            }}
          >
            {w}
          </span>
        ))}
      </div>
      <div
        ref={gridRef}
        onPointerDown={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          const c = cellFromEvent(e);
          if (c) { setAnchor(c); setHover(c); }
        }}
        onPointerMove={(e) => {
          if (!anchor) return;
          const c = cellFromEvent(e);
          if (c) setHover(c);
        }}
        onPointerUp={finishSelection}
        style={{
          display: 'inline-grid',
          direction: 'rtl',
          gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
          gap: 3,
          background: '#a9d8ee',
          padding: 8,
          borderRadius: 14,
          touchAction: 'none',
          userSelect: 'none',
          boxShadow: flash === 'bad' ? '0 0 0 3px var(--red)' : flash === 'good' ? '0 0 0 3px var(--green)' : 'var(--shadow)',
          transition: 'box-shadow 0.2s',
        }}
      >
        {grid.map((row, r) =>
          row.map((ch, c) => {
            const k = key(r, c);
            const isFound = foundCells.has(k);
            const isActive = activePath.has(k);
            return (
              <div
                key={k}
                data-cell={k}
                className="agol-font"
                style={{
                  width: cellSize,
                  height: cellSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: cellSize * 0.62,
                  borderRadius: 7,
                  background: isActive ? 'var(--gold-soft)' : isFound ? 'var(--green-soft)' : '#f4fbff',
                  color: isFound ? 'var(--green)' : 'var(--ink)',
                  border: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                {ch}
              </div>
            );
          })
        )}
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>
        נמצאו {found.size} מתוך {placements.length} מילים
      </p>
    </div>
  );
}
