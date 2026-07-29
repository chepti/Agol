import React, { useMemo, useState } from 'react';
import type { MatchActivity, ActivityResult, LetterEvents } from '../data/types';
import { addLetterEvent } from '../lib/mastery';
import { uniqueLetters } from '../data/letters';
import { withNikud, forHandwriting } from '../data/nikud';
import { playCorrect, playWrong } from '../lib/sound';

// התאמה: בוחרים מילה בכתב רגיל ומניחים אותה על המילה המתאימה בכתב רש"י.
// עובד בלחיצה-לחיצה (נוח גם למגע וגם לעכבר).

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Match({
  activity,
  onFinish,
}: {
  activity: MatchActivity;
  onFinish: (r: ActivityResult) => void;
}) {
  const shuffled = useMemo(() => shuffle(activity.pairs.map((p, i) => ({ ...p, i }))), [activity]);
  const [selected, setSelected] = useState<number | null>(null); // index of source word
  const [placed, setPlaced] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [events] = useState<LetterEvents>({});
  const [wrongTarget, setWrongTarget] = useState<number | null>(null);

  const tryPlace = (targetIdx: number) => {
    if (selected === null || placed.has(targetIdx)) return;
    if (selected === targetIdx) {
      playCorrect();
      const np = new Set(placed).add(targetIdx);
      setPlaced(np);
      uniqueLetters(activity.pairs[targetIdx].agol).forEach((l) => addLetterEvent(events, l, true));
      setSelected(null);
      if (np.size === activity.pairs.length) {
        const max = activity.pairs.length;
        const score = Math.max(1, max - mistakes);
        setTimeout(() => onFinish({ score, max, letters: events }), 600);
      }
    } else {
      playWrong();
      setMistakes((m) => m + 1);
      uniqueLetters(activity.pairs[targetIdx].agol).forEach((l) => addLetterEvent(events, l, false));
      setWrongTarget(targetIdx);
      setTimeout(() => setWrongTarget(null), 450);
    }
  };

  return (
    <div>
      <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 15 }}>
        לחצו על מילה בדפוס, ואז על המילה המתאימה בכתב יד
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
        {shuffled.map((p) =>
          placed.has(p.i) ? null : (
            <button
              key={p.i}
              onClick={() => setSelected(selected === p.i ? null : p.i)}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                fontSize: 19,
                fontWeight: 700,
                background: selected === p.i ? 'var(--teal)' : '#fff',
                color: selected === p.i ? '#fff' : 'var(--ink)',
                border: `2px solid ${selected === p.i ? 'var(--teal)' : '#e2e8f0'}`,
                transition: 'all 0.15s',
                transform: selected === p.i ? 'scale(1.07)' : 'none',
              }}
            >
              {p.label ?? withNikud(p.agol)}
            </button>
          )
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480, margin: '0 auto' }}>
        {activity.pairs.map((p, i) => {
          const isDone = placed.has(i);
          return (
            <button
              key={i}
              onClick={() => tryPlace(i)}
              className={`agol-font ${wrongTarget === i ? 'shake' : ''}`}
              disabled={isDone}
              style={{
                padding: '12px 18px',
                borderRadius: 14,
                fontSize: 28,
                textAlign: 'center',
                background: isDone ? 'var(--green-soft)' : wrongTarget === i ? 'var(--red-soft)' : 'linear-gradient(160deg,#f4fbff,#d7eefb)',
                border: `2px solid ${isDone ? 'var(--green)' : '#a9d8ee'}`,
                cursor: isDone ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                transition: 'all 0.2s',
              }}
            >
              <span>{forHandwriting(p.agol)}</span>
              {isDone && (
                <span style={{ fontFamily: 'Heebo', fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>
                  = {p.label ?? withNikud(p.agol)} ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
