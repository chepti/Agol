import React, { useState } from 'react';
import type { IntroActivity, ActivityResult } from '../data/types';
import { LETTERS } from '../data/letters';
import { playTap } from '../lib/sound';

// כרטיסי היכרות: אות בכתב רש"י, לחיצה הופכת לכתב רגיל + שם האות + רמז

export default function Intro({
  activity,
  onFinish,
}: {
  activity: IntroActivity;
  onFinish: (r: ActivityResult) => void;
}) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  const flip = (ch: string) => {
    playTap();
    setFlipped((prev) => new Set(prev).add(ch));
  };

  const allSeen = flipped.size >= activity.letters.length;

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 42vw), 1fr))',
          gap: 16,
        }}
      >
        {activity.letters.map((ch) => {
          const info = LETTERS.find((l) => l.ch === ch);
          const isFlipped = flipped.has(ch);
          return (
            <button
              key={ch}
              onClick={() => flip(ch)}
              style={{
                border: isFlipped ? '2px solid var(--teal)' : '2px solid #a9d8ee',
                borderRadius: 16,
                padding: '16px 8px',
                background: isFlipped ? 'var(--teal-soft)' : 'linear-gradient(160deg,#f4fbff,#d7eefb)',
                minHeight: 170,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.25s',
              }}
            >
              {isFlipped ? (
                <>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span className="agol-font" style={{ fontSize: 44 }}>{ch}</span>
                    <span style={{ fontSize: 20, color: 'var(--ink-soft)' }}>=</span>
                    <span style={{ fontSize: 40, fontWeight: 700 }}>{ch}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal-dark)' }}>{info?.name}</div>
                  {info?.hint && (
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.35 }}>{info.hint}</div>
                  )}
                </>
              ) : (
                <span className="agol-font" style={{ fontSize: 62 }}>{ch}</span>
              )}
            </button>
          );
        })}
      </div>
      <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 15 }}>
        {allSeen ? 'מצוין! הכרתם את כל האותיות.' : `הפכתם ${flipped.size} מתוך ${activity.letters.length} כרטיסים`}
      </p>
      <div style={{ textAlign: 'center' }}>
        <button
          className="btn"
          disabled={!allSeen}
          onClick={() => onFinish({ score: activity.letters.length, max: activity.letters.length, letters: {} })}
        >
          סיימתי להכיר — הלאה!
        </button>
      </div>
    </div>
  );
}
