import React, { useMemo, useState } from 'react';
import type { MemoryActivity, ActivityResult, LetterEvents } from '../data/types';
import { addLetterEvent } from '../lib/mastery';
import { uniqueLetters } from '../data/letters';
import { playCorrect, playTap } from '../lib/sound';

// משחק זיכרון: קלף אחד בכתב רש"י, בן הזוג שלו בכתב רגיל.

interface Card {
  id: number;
  pair: number;
  text: string;
  agol: boolean;
}

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

  const [open, setOpen] = useState<number[]>([]); // card ids currently flipped
  const [matched, setMatched] = useState<Set<number>>(new Set()); // pair indexes
  const [moves, setMoves] = useState(0);
  const [events] = useState<LetterEvents>({});
  const [lock, setLock] = useState(false);

  const flip = (card: Card) => {
    if (lock || open.includes(card.id) || matched.has(card.pair)) return;
    playTap();
    const now = [...open, card.id];
    setOpen(now);
    if (now.length === 2) {
      setMoves((m) => m + 1);
      setLock(true);
      const [c1, c2] = now.map((id) => cards.find((c) => c.id === id)!);
      if (c1.pair === c2.pair) {
        setTimeout(() => {
          playCorrect();
          const nm = new Set(matched).add(c1.pair);
          setMatched(nm);
          uniqueLetters(activity.pairs[c1.pair].a).forEach((l) => addLetterEvent(events, l, true));
          setOpen([]);
          setLock(false);
          if (nm.size === activity.pairs.length) {
            const max = activity.pairs.length;
            const extra = moves + 1 - max;
            const score = Math.max(1, Math.round(max - extra / 2));
            setTimeout(() => onFinish({ score, max, letters: events }), 600);
          }
        }, 550);
      } else {
        setTimeout(() => {
          setOpen([]);
          setLock(false);
        }, 950);
      }
    }
  };

  const long = activity.pairs.some((p) => p.a.length > 8);

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${long ? 150 : 110}px, 1fr))`,
          gap: 10,
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        {cards.map((card) => {
          const isOpen = open.includes(card.id) || matched.has(card.pair);
          const isMatched = matched.has(card.pair);
          return (
            <button
              key={card.id}
              onClick={() => flip(card)}
              className={card.agol && isOpen ? 'agol-font' : ''}
              style={{
                minHeight: 84,
                borderRadius: 12,
                border: `2px solid ${isMatched ? 'var(--green)' : isOpen ? 'var(--teal)' : '#0f766e'}`,
                background: isMatched
                  ? 'var(--green-soft)'
                  : isOpen
                    ? card.agol ? 'linear-gradient(160deg,#f4fbff,#d7eefb)' : '#fff'
                    : 'linear-gradient(150deg, var(--teal), var(--teal-dark))',
                color: isOpen ? 'var(--ink)' : '#fff',
                fontSize: isOpen ? (card.text.length > 10 ? 15 : card.agol ? 26 : 18) : 30,
                fontWeight: isOpen && !card.agol ? 700 : 400,
                padding: 8,
                lineHeight: 1.3,
                transition: 'all 0.25s',
              }}
            >
              {isOpen ? card.text : '❓'}
            </button>
          );
        })}
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>
        זוגות שנמצאו: {matched.size} / {activity.pairs.length} · מהלכים: {moves}
      </p>
    </div>
  );
}
