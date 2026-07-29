import React, { useMemo, useRef, useState } from 'react';
import type { MemoryActivity, ActivityResult, LetterEvents } from '../data/types';
import { addLetterEvent } from '../lib/mastery';
import { uniqueLetters } from '../data/letters';
import { withNikud } from '../data/nikud';
import { playCorrect, playTap, playWrong } from '../lib/sound';

// משחק זיכרון: קלף אחד בכתב יד, בן הזוג שלו בדפוס.

interface Card {
  id: number;
  pair: number;
  text: string;
  agol: boolean;
}

const BACKS = ['🌸', '⭐', '🎈', '🦋', '🍀', '💎'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Memory({
  activity,
  onFinish,
}: {
  activity: MemoryActivity;
  onFinish: (r: ActivityResult) => void;
}) {
  const cards = useMemo<Card[]>(() => {
    const list: Card[] = [];
    activity.pairs.forEach((p, i) => {
      list.push({ id: i * 2, pair: i, text: p.a, agol: true });
      list.push({ id: i * 2 + 1, pair: i, text: p.b, agol: false });
    });
    return shuffle(list);
  }, [activity]);

  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [popping, setPopping] = useState<Set<number>>(new Set());
  const [events] = useState<LetterEvents>({});
  const [lock, setLock] = useState(false);
  const finished = useRef(false);
  const movesRef = useRef(0);

  const flip = (card: Card) => {
    if (lock || open.includes(card.id) || matched.has(card.pair) || finished.current) return;
    playTap();
    const now = [...open, card.id];
    setOpen(now);
    if (now.length < 2) return;

    movesRef.current += 1;
    setMoves(movesRef.current);
    setLock(true);
    const [c1, c2] = now.map((id) => cards.find((c) => c.id === id)!);

    if (c1.pair === c2.pair) {
      window.setTimeout(() => {
        playCorrect();
        setPopping((p) => new Set(p).add(c1.pair));
        uniqueLetters(activity.pairs[c1.pair].a).forEach((l) => addLetterEvent(events, l, true));

        setMatched((prev) => {
          const nm = new Set(prev).add(c1.pair);
          if (nm.size === activity.pairs.length && !finished.current) {
            finished.current = true;
            const max = activity.pairs.length;
            const extra = Math.max(0, movesRef.current - max);
            const score = Math.max(1, max - Math.floor(extra / 2));
            window.setTimeout(() => onFinish({ score, max, letters: events }), 700);
          }
          return nm;
        });
        setOpen([]);
        setLock(false);
      }, 420);
    } else {
      window.setTimeout(() => {
        playWrong();
        setOpen([]);
        setLock(false);
      }, 750);
    }
  };

  const cols = activity.pairs.length <= 3 ? 3 : activity.pairs.length <= 4 ? 4 : 'auto-fill';
  const minW = activity.pairs.some((p) => p.a.length > 4) ? 110 : 88;

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            typeof cols === 'number' ? `repeat(${cols}, minmax(${minW}px, 1fr))` : `repeat(auto-fill, minmax(${minW}px, 1fr))`,
          gap: 12,
          maxWidth: activity.pairs.length <= 4 ? 420 : 640,
          margin: '0 auto',
        }}
      >
        {cards.map((card, idx) => {
          const isMatched = matched.has(card.pair);
          const isOpen = open.includes(card.id) || isMatched;
          const isPop = popping.has(card.pair);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(card)}
              disabled={isMatched}
              className={`${card.agol && isOpen ? 'agol-font ' : ''}${isOpen && !isMatched ? 'flip-in' : ''}${isPop ? ' memory-pop' : ''}`}
              aria-label={isOpen ? card.text : 'קלף סגור'}
              style={{
                minHeight: 96,
                borderRadius: 18,
                border: `3px solid ${isMatched ? '#86efac' : isOpen ? 'var(--teal)' : '#7dd3c0'}`,
                background: isMatched
                  ? 'linear-gradient(160deg,#dcfce7,#bbf7d0)'
                  : isOpen
                    ? card.agol
                      ? 'linear-gradient(160deg,#f0f9ff,#dbeafe)'
                      : 'linear-gradient(160deg,#fffbeb,#fef3c7)'
                    : 'linear-gradient(145deg,#14b8a6,#0f766e)',
                color: isOpen ? 'var(--ink)' : '#fff',
                fontSize: isOpen ? (card.text.length > 3 ? (card.agol ? 28 : 20) : card.agol ? 42 : 28) : 30,
                fontWeight: isOpen && !card.agol ? 800 : 400,
                padding: 8,
                lineHeight: 1.2,
                cursor: isMatched ? 'default' : 'pointer',
                boxShadow: isOpen ? '0 4px 14px rgba(15,118,110,0.18)' : '0 6px 0 #0d5c56, 0 8px 16px rgba(0,0,0,0.15)',
                transform: isMatched ? 'scale(0.92)' : undefined,
                opacity: isMatched ? 0.75 : 1,
                transition: 'transform 0.25s, opacity 0.35s, background 0.2s',
              }}
            >
              {isOpen ? withNikud(card.text) : BACKS[idx % BACKS.length]}
            </button>
          );
        })}
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginTop: 14 }}>
        זוגות: {matched.size} / {activity.pairs.length}
        {moves > 0 ? ` · ניסיונות: ${moves}` : ''}
      </p>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 4 }}>
        מצאו זוג: כתב יד + אותה מילה בדפוס
      </p>
    </div>
  );
}
