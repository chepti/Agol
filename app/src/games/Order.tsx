import React, { useMemo, useState } from 'react';
import type { OrderActivity, ActivityResult, LetterEvents } from '../data/types';
import { addLetterEvent } from '../lib/mastery';
import { playCorrect, playWrong } from '../lib/sound';

// סידור האלף-בית: לוחצים על האותיות (בכתב רש"י) לפי הסדר הנכון.

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Order({
  activity,
  onFinish,
}: {
  activity: OrderActivity;
  onFinish: (r: ActivityResult) => void;
}) {
  const pool = useMemo(() => shuffle(activity.items), [activity]);
  const [nextIdx, setNextIdx] = useState(0); // כמה כבר סודרו
  const [firstTry, setFirstTry] = useState(0);
  const [erredThis, setErredThis] = useState(false);
  const [wrongCh, setWrongCh] = useState<string | null>(null);
  const [events] = useState<LetterEvents>({});

  const clickLetter = (ch: string) => {
    const expected = activity.items[nextIdx];
    if (ch === expected) {
      playCorrect();
      addLetterEvent(events, ch, !erredThis ? true : false);
      if (!erredThis) setFirstTry((f) => f + 1);
      setErredThis(false);
      const n = nextIdx + 1;
      setNextIdx(n);
      if (n >= activity.items.length) {
        setTimeout(
          () => onFinish({ score: firstTry + (!erredThis ? 1 : 0), max: activity.items.length, letters: events }),
          600
        );
      }
    } else {
      playWrong();
      addLetterEvent(events, ch, false);
      setErredThis(true);
      setWrongCh(ch);
      setTimeout(() => setWrongCh(null), 400);
    }
  };

  const placed = activity.items.slice(0, nextIdx);
  const remaining = pool.filter((ch) => !placed.includes(ch));

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontWeight: 700, fontSize: 17 }}>
        האות הבאה בתור: <span style={{ color: 'var(--teal)', fontSize: 26 }}>{nextIdx < activity.items.length ? activity.items[nextIdx] : '🎉'}</span>
      </p>
      {/* השורה המסודרת */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 5,
          justifyContent: 'center',
          minHeight: 52,
          background: 'var(--green-soft)',
          borderRadius: 14,
          padding: 8,
          margin: '10px auto 22px',
          maxWidth: 620,
          direction: 'rtl',
        }}
      >
        {placed.map((ch) => (
          <span
            key={ch}
            className="agol-font pop-in"
            style={{
              width: 40,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 27,
              background: '#fff',
              borderRadius: 8,
              border: '2px solid var(--green)',
            }}
          >
            {ch}
          </span>
        ))}
        {placed.length === 0 && <span style={{ color: 'var(--ink-soft)', alignSelf: 'center' }}>כאן ייבנה האלף-בית שלכם...</span>}
      </div>
      {/* המאגר המעורבב */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 620, margin: '0 auto', direction: 'rtl' }}>
        {remaining.map((ch) => (
          <button
            key={ch}
            onClick={() => clickLetter(ch)}
            className={`agol-font ${wrongCh === ch ? 'shake' : ''}`}
            style={{
              width: 52,
              height: 56,
              fontSize: 32,
              borderRadius: 10,
              background: wrongCh === ch ? 'var(--red-soft)' : 'linear-gradient(160deg,#fffdf5,#fdf6e3)',
              border: `2px solid ${wrongCh === ch ? 'var(--red)' : '#e7d9b0'}`,
              transition: 'all 0.15s',
            }}
          >
            {ch}
          </button>
        ))}
      </div>
    </div>
  );
}
