import React from 'react';

export function ProgressDots({ total, done }: { total: number; done: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '10px 0' }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: i < done ? 'var(--teal)' : '#e2e8f0',
            transition: 'background 0.3s',
          }}
        />
      ))}
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <div style={{ fontSize: 46, letterSpacing: 6 }}>
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ opacity: i <= n ? 1 : 0.22, filter: i <= n ? 'none' : 'grayscale(1)' }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

export function starsFor(score: number, max: number): number {
  if (max <= 0) return 3;
  const r = score / max;
  if (r >= 0.9) return 3;
  if (r >= 0.65) return 2;
  return 1;
}

/** טקסט גדול בכתב רש"י על "קלף" */
export function AgolCard({ text, size = 54 }: { text: string; size?: number }) {
  return (
    <div
      className="agol-font pop-in"
      style={{
        background: 'linear-gradient(160deg, #fffdf5, #fdf6e3)',
        border: '2px solid #e7d9b0',
        borderRadius: 18,
        padding: '30px 34px',
        fontSize: size,
        textAlign: 'center',
        minWidth: 200,
        maxWidth: '100%',
        lineHeight: 1.4,
        boxShadow: 'var(--shadow)',
        direction: 'rtl',
      }}
    >
      {text}
    </div>
  );
}
