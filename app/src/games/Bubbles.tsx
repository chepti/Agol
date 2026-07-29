import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BubblesActivity, ActivityResult, LetterEvents } from '../data/types';
import { addLetterEvent } from '../lib/mastery';
import { uniqueLetters } from '../data/letters';
import { withNikud, forHandwriting } from '../data/nikud';
import { playCorrect, playTap, playWrong } from '../lib/sound';

interface Bubble {
  id: number;
  pair: number;
  text: string;
  agol: boolean;
  size: number;
  hue: number;
  delay: number;
  dur: number;
}

interface Pos { x: number; y: number }

const HUES = [195, 330, 48, 155, 270, 18, 210, 300]; // פסטל רך
const NEAR = 1.08;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function layout(n: number): Pos[] {
  const spots: Pos[] = [];
  const cols = Math.max(3, Math.ceil(Math.sqrt(n * 1.6)));
  const rows = Math.ceil(n / cols);
  let i = 0;
  for (let r = 0; r < rows && i < n; r++) {
    for (let c = 0; c < cols && i < n; c++) {
      spots.push({
        x: 8 + (c + 0.5) * (84 / cols) + (Math.random() - 0.5) * 8,
        y: 10 + (r + 0.5) * (80 / rows) + (Math.random() - 0.5) * 7,
      });
      i++;
    }
  }
  return shuffle(spots);
}

function vibrate(pattern: number | number[] = 40) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

export default function Bubbles({
  activity,
  onFinish,
}: {
  activity: BubblesActivity;
  onFinish: (r: ActivityResult) => void;
}) {
  const pondRef = useRef<HTMLDivElement>(null);
  const bubbles = useMemo<Bubble[]>(() => {
    const list: Bubble[] = [];
    activity.pairs.forEach((p, i) => {
      const text = p.agol;
      const label = p.label ?? p.agol;
      list.push({
        id: i * 2,
        pair: i,
        text,
        agol: true,
        size: text.length > 3 ? 104 : 118,
        hue: HUES[i % HUES.length],
        delay: Math.random() * 2,
        dur: 3.5 + Math.random() * 2.5,
      });
      list.push({
        id: i * 2 + 1,
        pair: i,
        text: label,
        agol: false,
        size: label.length > 3 ? 104 : 118,
        hue: HUES[i % HUES.length],
        delay: Math.random() * 2,
        dur: 3.5 + Math.random() * 2.5,
      });
    });
    return shuffle(list);
  }, [activity]);

  const [pos, setPos] = useState<Record<number, Pos>>(() => {
    const spots = layout(bubbles.length);
    const map: Record<number, Pos> = {};
    bubbles.forEach((b, i) => {
      map[b.id] = spots[i];
    });
    return map;
  });

  const [gone, setGone] = useState<Set<number>>(new Set());
  const [popping, setPopping] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [shakeId, setShakeId] = useState<number | null>(null);
  const [nearId, setNearId] = useState<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [pondH, setPondH] = useState(580);
  const [events] = useState<LetterEvents>({});
  const finished = useRef(false);
  const mistakesRef = useRef(0);
  const drag = useRef<{ id: number; pointerId: number; home: Pos } | null>(null);
  const posRef = useRef(pos);
  const goneRef = useRef(gone);
  const lastWrongTarget = useRef<number | null>(null);
  posRef.current = pos;
  goneRef.current = gone;

  useEffect(() => {
    const sync = () => setPondH(Math.max(500, Math.min(window.innerHeight * 0.7, 720)));
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    const prevent = (ev: TouchEvent) => {
      if (drag.current) ev.preventDefault();
    };
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, []);

  const finishIfDone = useCallback(
    (nextGone: Set<number>) => {
      if (nextGone.size === activity.pairs.length && !finished.current) {
        finished.current = true;
        const max = activity.pairs.length;
        const score = Math.max(1, max - mistakesRef.current);
        window.setTimeout(() => onFinish({ score, max, letters: events }), 450);
      }
    },
    [activity.pairs.length, events, onFinish],
  );

  const popPair = useCallback(
    (pair: number, aId: number, bId: number) => {
      playCorrect();
      vibrate(18);
      uniqueLetters(activity.pairs[pair].agol).forEach((l) => addLetterEvent(events, l, true));
      setPopping((p) => new Set(p).add(aId).add(bId));
      setNearId(null);
      drag.current = null;
      setDragId(null);
      window.setTimeout(() => {
        setGone((g) => {
          const ng = new Set(g).add(pair);
          finishIfDone(ng);
          return ng;
        });
        setPopping((p) => {
          const np = new Set(p);
          np.delete(aId);
          np.delete(bId);
          return np;
        });
      }, 480);
    },
    [activity.pairs, events, finishIfDone],
  );

  const wrongNear = useCallback(
    (dragged: Bubble, target: Bubble, home: Pos) => {
      if (lastWrongTarget.current === target.id) return;
      lastWrongTarget.current = target.id;
      playWrong();
      vibrate([28, 35, 28]);
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
      uniqueLetters(activity.pairs[target.pair].agol).forEach((l) => addLetterEvent(events, l, false));
      setShakeId(target.id);
      setNearId(null);
      setPos((p) => ({ ...p, [dragged.id]: { ...home } }));
      drag.current = null;
      setDragId(null);
      window.setTimeout(() => {
        setShakeId(null);
        lastWrongTarget.current = null;
      }, 480);
    },
    [activity.pairs, events],
  );

  const findNear = useCallback(
    (draggedId: number, at: Pos): Bubble | null => {
      const pond = pondRef.current;
      if (!pond) return null;
      const rect = pond.getBoundingClientRect();
      const dragged = bubbles.find((b) => b.id === draggedId);
      if (!dragged || goneRef.current.has(dragged.pair)) return null;

      const ax = (at.x / 100) * rect.width;
      const ay = (at.y / 100) * rect.height;

      let best: Bubble | null = null;
      let bestDist = Infinity;
      for (const b of bubbles) {
        if (b.id === draggedId) continue;
        if (goneRef.current.has(b.pair)) continue;
        const p = posRef.current[b.id];
        if (!p) continue;
        const bx = (p.x / 100) * rect.width;
        const by = (p.y / 100) * rect.height;
        const dist = Math.hypot(ax - bx, ay - by);
        const limit = ((dragged.size + b.size) / 2) * NEAR;
        if (dist < limit && dist < bestDist) {
          bestDist = dist;
          best = b;
        }
      }
      return best;
    },
    [bubbles],
  );

  const clientToPercent = (clientX: number, clientY: number): Pos | null => {
    const pond = pondRef.current;
    if (!pond) return null;
    const rect = pond.getBoundingClientRect();
    return {
      x: Math.min(94, Math.max(6, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(94, Math.max(6, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const resolveNear = (draggedId: number, at: Pos, home: Pos) => {
    const near = findNear(draggedId, at);
    setNearId(near ? near.id : null);
    if (!near) {
      lastWrongTarget.current = null;
      return;
    }
    const dragged = bubbles.find((b) => b.id === draggedId)!;
    if (near.pair === dragged.pair) {
      popPair(dragged.pair, dragged.id, near.id);
    } else {
      wrongNear(dragged, near, home);
    }
  };

  const onPointerDown = (e: React.PointerEvent, b: Bubble) => {
    if (gone.has(b.pair) || popping.has(b.id) || finished.current || drag.current) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    playTap();
    lastWrongTarget.current = null;
    drag.current = { id: b.id, pointerId: e.pointerId, home: { ...pos[b.id] } };
    setDragId(b.id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const pct = clientToPercent(e.clientX, e.clientY);
    if (!pct) return;
    setPos((p) => ({ ...p, [d.id]: pct }));
    resolveNear(d.id, pct, d.home);
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const pct = posRef.current[d.id] ?? d.home;
    // אם עדיין גוררים — בדיקה אחרונה (למקרה שלא תפסנו בזמן התנועה)
    if (drag.current) {
      const near = findNear(d.id, pct);
      if (near) {
        const dragged = bubbles.find((b) => b.id === d.id)!;
        if (near.pair === dragged.pair) popPair(dragged.pair, dragged.id, near.id);
        else wrongNear(dragged, near, d.home);
      } else {
        drag.current = null;
        setDragId(null);
        setNearId(null);
      }
    }
  };

  const remaining = activity.pairs.length - gone.size;

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <div
        ref={pondRef}
        className="bubbles-pond"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1080,
          height: pondH,
          margin: '0 auto',
          borderRadius: 28,
          overflow: 'hidden',
          touchAction: 'none',
          background:
            'radial-gradient(ellipse at 25% 15%, #e0f2fe 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, #fce7f3 0%, transparent 50%), linear-gradient(165deg, #ecfeff 0%, #f0f9ff 40%, #fdf4ff 100%)',
          border: '3px solid rgba(14,165,233,0.28)',
          boxShadow: 'inset 0 0 50px rgba(56,189,248,0.12)',
        }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {bubbles.map((b) => {
          if (gone.has(b.pair) && !popping.has(b.id)) return null;
          const p = pos[b.id];
          if (!p) return null;
          const isDrag = dragId === b.id;
          const isPop = popping.has(b.id);
          const isShake = shakeId === b.id;
          const isNear = nearId === b.id;
          const dragBubble = dragId !== null ? bubbles.find((x) => x.id === dragId) : null;
          const isNearOk = isNear && !!dragBubble && dragBubble.pair === b.pair;

          return (
            <button
              key={b.id}
              type="button"
              onPointerDown={(e) => onPointerDown(e, b)}
              className={`${!isDrag ? 'bubble-float' : ''}${isPop ? ' bubble-pop' : ''}${isShake ? ' shake' : ''}${b.agol ? ' agol-font' : ''}`}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: b.size,
                height: b.size,
                marginLeft: -b.size / 2,
                marginTop: -b.size / 2,
                borderRadius: '50%',
                border: isDrag || isNearOk
                  ? '2.5px solid rgba(15,118,110,0.55)'
                  : isNear
                    ? '2.5px solid rgba(220,38,38,0.45)'
                    : '2px solid rgba(255,255,255,0.65)',
                background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.88), hsla(${b.hue}, 70%, 82%, 0.55) 42%, hsla(${b.hue}, 55%, 72%, 0.42))`,
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                color: 'rgba(30, 58, 70, 0.92)',
                fontSize: b.agol ? (b.text.length > 3 ? 24 : 32) : b.text.length > 3 ? 17 : 22,
                fontWeight: b.agol ? 700 : 800,
                cursor: isDrag ? 'grabbing' : 'grab',
                userSelect: 'none',
                touchAction: 'none',
                boxShadow: isDrag
                  ? '0 10px 24px rgba(0,0,0,0.14), 0 0 0 4px rgba(15,118,110,0.15)'
                  : isNearOk
                    ? '0 0 0 4px rgba(34,197,94,0.28), 0 6px 14px rgba(0,0,0,0.08)'
                    : '0 4px 14px rgba(0,0,0,0.08), inset 0 -4px 10px rgba(255,255,255,0.35)',
                transform: isDrag ? 'scale(1.14)' : isNearOk ? 'scale(1.08)' : undefined,
                zIndex: isDrag ? 20 : isNear ? 8 : 1,
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.delay}s`,
                ['--bubble-shift' as string]: `${5 + (b.id % 5)}px`,
                transition: isDrag ? 'none' : 'box-shadow 0.15s, border-color 0.15s, transform 0.15s',
              }}
            >
              {b.agol ? forHandwriting(b.text) : withNikud(b.text)}
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
