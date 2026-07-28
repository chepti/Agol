import React, { useMemo, useRef, useState } from 'react';
import type { BubblesActivity, ActivityResult, LetterEvents } from '../data/types';
import { addLetterEvent } from '../lib/mastery';
import { uniqueLetters } from '../data/letters';
import { playCorrect, playTap, playWrong } from '../lib/sound';

interface Bubble {
  id: number;
  pair: number;
  text: string;
  agol: boolean;
  x: number; // %
  y: number; // %
  size: number;
  hue: number;
  delay: number;
  dur: number;
}

const HUES = [190, 320, 45, 145, 265, 15, 200, 330];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** פיזור בועות בלי חפיפה חזקה */
function layout(n: number): { x: number; y: number }[] {
  const spots: { x: number; y: number }[] = [];
  const cols = Math.ceil(Math.sqrt(n * 1.2));
  const rows = Math.ceil(n / cols);
  let i = 0;
  for (let r = 0; r < rows && i < n; r++) {
    for (let c = 0; c < cols && i < n; c++) {
      const jitterX = (Math.random() - 0.5) * 10;
      const jitterY = (Math.random() - 0.5) * 8;
      spots.push({
        x: 12 + (c + 0.5) * (76 / cols) + jitterX,
        y: 14 + (r + 0.5) * (72 / rows) + jitterY,
      });
      i++;
    }
  }
  return shuffle(spots);
}

export default function Bubbles({
  activity,
  onFinish,
}: {
  activity: BubblesActivity;
  onFinish: (r: ActivityResult) => void;
}) {
  const bubbles = useMemo<Bubble[]>(() => {
    const list: Omit<Bubble, 'x' | 'y'>[] = [];
    activity.pairs.forEach((p, i) => {
      const text = p.agol;
      const label = p.label ?? p.agol;
      list.push({
        id: i * 2,
        pair: i,
        text,
        agol: true,
        size: text.length > 3 ? 78 : 88,
        hue: HUES[i % HUES.length],
        delay: Math.random() * 2,
        dur: 3.2 + Math.random() * 2.2,
      });
      list.push({
        id: i * 2 + 1,
        pair: i,
        text: label,
        agol: false,
        size: label.length > 3 ? 78 : 88,
        hue: HUES[i % HUES.length],
        delay: Math.random() * 2,
        dur: 3.2 + Math.random() * 2.2,
      });
    });
    const spots = layout(list.length);
    return shuffle(list).map((b, i) => ({ ...b, x: spots[i].x, y: spots[i].y }));
  }, [activity]);

  const [selected, setSelected] = useState<number | null>(null);
  const [gone, setGone] = useState<Set<number>>(new Set());
  const [popping, setPopping] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [shakeId, setShakeId] = useState<number | null>(null);
  const [events] = useState<LetterEvents>({});
  const finished = useRef(false);
  const mistakesRef = useRef(0);

  const onBubble = (b: Bubble) => {
    if (gone.has(b.pair) || popping.has(b.id) || finished.current) return;

    if (selected === null) {
      playTap();
      setSelected(b.id);
      return;
    }

    if (selected === b.id) {
      setSelected(null);
      return;
    }

    const other = bubbles.find((x) => x.id === selected)!;
    if (other.pair === b.pair) {
      playCorrect();
      setPopping((p) => new Set(p).add(other.id).add(b.id));
      uniqueLetters(activity.pairs[b.pair].agol).forEach((l) => addLetterEvent(events, l, true));
      setSelected(null);
      window.setTimeout(() => {
        setGone((g) => {
          const ng = new Set(g).add(b.pair);
          if (ng.size === activity.pairs.length && !finished.current) {
            finished.current = true;
            const max = activity.pairs.length;
            const score = Math.max(1, max - mistakesRef.current);
            window.setTimeout(() => onFinish({ score, max, letters: events }), 400);
          }
          return ng;
        });
        setPopping((p) => {
          const np = new Set(p);
          np.delete(other.id);
          np.delete(b.id);
          return np;
        });
      }, 480);
    } else {
      playWrong();
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
      uniqueLetters(activity.pairs[b.pair].agol).forEach((l) => addLetterEvent(events, l, false));
      setShakeId(b.id);
      window.setTimeout(() => {
        setShakeId(null);
        setSelected(null);
      }, 420);
    }
  };

  const remaining = activity.pairs.length - gone.size;

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginBottom: 8 }}>
        לחצו על בועה, ואז על הבועה התואמת — כתב יד + דפוס. בום! 💥
      </p>
      <div
        className="bubbles-pond"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          height: Math.min(420, 160 + activity.pairs.length * 52),
          margin: '0 auto',
          borderRadius: 28,
          overflow: 'hidden',
          background:
            'radial-gradient(ellipse at 30% 20%, #e0f2fe 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #fce7f3 0%, transparent 45%), linear-gradient(165deg, #ecfeff 0%, #f0f9ff 40%, #fdf4ff 100%)',
          border: '3px solid rgba(14,165,233,0.25)',
          boxShadow: 'inset 0 0 40px rgba(56,189,248,0.12)',
        }}
      >
        {bubbles.map((b) => {
          if (gone.has(b.pair) && !popping.has(b.id)) return null;
          const isSel = selected === b.id;
          const isPop = popping.has(b.id);
          const isShake = shakeId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onBubble(b)}
              className={`bubble-float${isPop ? ' bubble-pop' : ''}${isShake ? ' shake' : ''}${b.agol ? ' agol-font' : ''}`}
              style={{
                position: 'absolute',
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: b.size,
                height: b.size,
                marginLeft: -b.size / 2,
                marginTop: -b.size / 2,
                borderRadius: '50%',
                border: isSel ? '3px solid #0f766e' : '2.5px solid rgba(255,255,255,0.85)',
                background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95), hsl(${b.hue} 85% 72%) 45%, hsl(${b.hue} 70% 55%))`,
                color: '#134e4a',
                fontSize: b.agol ? (b.text.length > 3 ? 22 : 30) : b.text.length > 3 ? 16 : 20,
                fontWeight: b.agol ? 400 : 800,
                cursor: 'pointer',
                boxShadow: isSel
                  ? '0 0 0 4px rgba(15,118,110,0.25), 0 8px 20px rgba(0,0,0,0.15)'
                  : '0 6px 16px rgba(0,0,0,0.12), inset 0 -6px 12px rgba(0,0,0,0.08)',
                transform: isSel ? 'scale(1.12)' : undefined,
                zIndex: isSel ? 5 : 1,
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.delay}s`,
                ['--bubble-shift' as string]: `${4 + (b.id % 5)}px`,
              }}
            >
              {b.text}
            </button>
          );
        })}
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginTop: 12 }}>
        נשארו {remaining} זוגות
        {mistakes > 0 ? ` · טעויות: ${mistakes}` : ''}
      </p>
    </div>
  );
}
