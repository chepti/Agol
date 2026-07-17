import React from 'react';

// איורי טבע מצוירים ב-SVG — סגנון משחק: צבעים שטוחים, קו מתאר כהה, הדגשות אור.

interface P { size?: number; style?: React.CSSProperties }

const wrap = (w: number, h: number, children: React.ReactNode) =>
  function Scenery({ size = 80, style }: P) {
    return (
      <svg
        width={size}
        height={(size * h) / w}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block', ...style }}
        aria-hidden
      >
        {children}
      </svg>
    );
  };

/** עץ עגול פורח — כמו במשחקי הרפתקאות */
export const Tree = wrap(100, 118, (
  <>
    <ellipse cx="50" cy="112" rx="26" ry="6" fill="rgba(30,80,20,0.25)" />
    <path d="M44 76 q0 22 -6 36 h24 q-6 -14 -6 -36 z" fill="#8a5a33" stroke="#5d3b18" strokeWidth="3" strokeLinejoin="round" />
    <path
      d="M50 6 C66 6 78 16 80 30 C92 34 95 48 87 56 C86 68 74 76 62 72 C56 80 42 80 36 72 C22 76 10 66 12 54 C4 44 12 28 26 28 C30 14 40 6 50 6 Z"
      fill="#57b043" stroke="#2c661c" strokeWidth="3.5" strokeLinejoin="round"
    />
    <ellipse cx="38" cy="30" rx="15" ry="11" fill="#7ecb62" />
    <ellipse cx="63" cy="44" rx="12" ry="9" fill="#7ecb62" opacity="0.85" />
    <ellipse cx="52" cy="62" rx="18" ry="9" fill="#469636" />
    <g stroke="#2c661c" strokeWidth="1">
      <circle cx="28" cy="46" r="4" fill="#fff" />
      <circle cx="28" cy="46" r="1.6" fill="#f7c948" stroke="none" />
      <circle cx="70" cy="28" r="4" fill="#fff" />
      <circle cx="70" cy="28" r="1.6" fill="#f7c948" stroke="none" />
      <circle cx="55" cy="18" r="3.4" fill="#ffd9e8" />
      <circle cx="55" cy="18" r="1.4" fill="#e75480" stroke="none" />
    </g>
  </>
));

/** אשוח */
export const Pine = wrap(100, 122, (
  <>
    <ellipse cx="50" cy="116" rx="22" ry="5" fill="rgba(30,80,20,0.25)" />
    <rect x="44" y="96" width="12" height="18" rx="3" fill="#8a5a33" stroke="#5d3b18" strokeWidth="3" />
    <path d="M50 4 L74 42 H61 L82 74 H64 L88 102 H12 L36 74 H18 L39 42 H26 Z"
      fill="#3f9440" stroke="#1f5c22" strokeWidth="3.5" strokeLinejoin="round" />
    <path d="M50 12 L38 32 H46 L34 52 h10 L30 74 h16 z" fill="#5cb35b" opacity="0.7" />
  </>
));

/** שיח נמוך */
export const Bush = wrap(110, 60, (
  <>
    <ellipse cx="55" cy="55" rx="40" ry="5" fill="rgba(30,80,20,0.2)" />
    <path d="M18 52 C6 50 4 36 14 30 C12 18 26 10 36 16 C42 4 62 4 68 14 C82 8 96 18 92 30 C102 36 98 50 88 52 Z"
      fill="#4ea23c" stroke="#2c661c" strokeWidth="3.5" strokeLinejoin="round" />
    <ellipse cx="36" cy="26" rx="12" ry="7" fill="#72c25a" />
    <circle cx="70" cy="30" r="3.6" fill="#fff" stroke="#2c661c" strokeWidth="1" />
    <circle cx="70" cy="30" r="1.4" fill="#f7c948" />
  </>
));

/** פטרייה אדומה */
export const Mushroom = wrap(80, 82, (
  <>
    <ellipse cx="40" cy="77" rx="20" ry="4" fill="rgba(30,80,20,0.25)" />
    <path d="M30 46 q-4 20 -2 30 q12 5 24 0 q2 -10 -2 -30 z" fill="#f6ead2" stroke="#8a5a33" strokeWidth="3" strokeLinejoin="round" />
    <path d="M8 44 Q40 -8 72 44 Q40 56 8 44 Z" fill="#e0433c" stroke="#8c1f1f" strokeWidth="3.5" strokeLinejoin="round" />
    <circle cx="28" cy="30" r="5" fill="#fff" />
    <circle cx="48" cy="22" r="4" fill="#fff" />
    <circle cx="56" cy="36" r="3.4" fill="#fff" />
  </>
));

/** סלע */
export const Rock = wrap(90, 56, (
  <>
    <ellipse cx="45" cy="51" rx="34" ry="5" fill="rgba(30,80,20,0.2)" />
    <path d="M12 46 C6 34 16 20 30 18 C36 8 58 8 66 16 C80 18 86 32 78 42 C74 50 20 52 12 46 Z"
      fill="#b9b4a6" stroke="#6e685a" strokeWidth="3.5" strokeLinejoin="round" />
    <path d="M26 22 C34 14 52 14 60 20 C54 26 32 28 26 22 Z" fill="#d8d3c6" />
  </>
));

/** פרח מרגנית גדול */
export const Daisy = wrap(70, 96, (
  <>
    <path d="M35 50 q-2 26 0 42" stroke="#3d8b2f" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M35 70 q-14 -4 -18 -14 q14 0 18 8 z" fill="#4ea23c" stroke="#2c661c" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M35 80 q14 -4 18 -14 q-14 0 -18 8 z" fill="#4ea23c" stroke="#2c661c" strokeWidth="2.5" strokeLinejoin="round" />
    <g stroke="#8f8a76" strokeWidth="2">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <ellipse key={i} cx={35 + Math.cos(a) * 15} cy={28 + Math.sin(a) * 15} rx="8.5" ry="5.5" fill="#fff" transform={`rotate(${(a * 180) / Math.PI} ${35 + Math.cos(a) * 15} ${28 + Math.sin(a) * 15})`} />;
      })}
    </g>
    <circle cx="35" cy="28" r="8" fill="#f79b1b" stroke="#c26d0a" strokeWidth="2.5" />
  </>
));

/** צבעוני ורוד */
export const Tulip = wrap(60, 90, (
  <>
    <path d="M30 40 q-2 30 0 46" stroke="#3d8b2f" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M30 62 q-13 -2 -17 -13 q13 0 17 7 z" fill="#4ea23c" stroke="#2c661c" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M15 22 q0 -14 8 -16 q4 6 7 6 q3 0 7 -6 q8 2 8 16 q0 14 -15 20 q-15 -6 -15 -20 z"
      fill="#ef6aa2" stroke="#a82860" strokeWidth="3" strokeLinejoin="round" />
    <path d="M23 12 q6 8 7 26" stroke="#a82860" strokeWidth="2" fill="none" opacity="0.6" />
  </>
));

/** פרפר */
export const Butterfly = wrap(80, 62, (
  <>
    <ellipse cx="26" cy="24" rx="16" ry="12" fill="#9b6ff0" stroke="#5b3aa8" strokeWidth="3" transform="rotate(-20 26 24)" />
    <ellipse cx="54" cy="24" rx="16" ry="12" fill="#b98cf5" stroke="#5b3aa8" strokeWidth="3" transform="rotate(20 54 24)" />
    <ellipse cx="30" cy="42" rx="10" ry="8" fill="#b98cf5" stroke="#5b3aa8" strokeWidth="3" transform="rotate(-16 30 42)" />
    <ellipse cx="50" cy="42" rx="10" ry="8" fill="#9b6ff0" stroke="#5b3aa8" strokeWidth="3" transform="rotate(16 50 42)" />
    <rect x="37" y="16" width="6" height="34" rx="3" fill="#4a3416" />
    <path d="M38 16 q-4 -8 -9 -10 M42 16 q4 -8 9 -10" stroke="#4a3416" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <circle cx="26" cy="22" r="3.4" fill="#fff" opacity="0.85" />
    <circle cx="54" cy="22" r="3.4" fill="#fff" opacity="0.85" />
  </>
));

/** גדם עץ */
export const Stump = wrap(84, 62, (
  <>
    <ellipse cx="42" cy="57" rx="30" ry="5" fill="rgba(30,80,20,0.25)" />
    <path d="M14 22 q0 26 4 32 q24 8 48 0 q4 -6 4 -32" fill="#9c6b3d" stroke="#5d3b18" strokeWidth="3.5" strokeLinejoin="round" />
    <ellipse cx="42" cy="22" rx="28" ry="12" fill="#e5c496" stroke="#5d3b18" strokeWidth="3.5" />
    <ellipse cx="42" cy="22" rx="17" ry="7" fill="none" stroke="#b98c58" strokeWidth="2.5" />
    <ellipse cx="42" cy="22" rx="7" ry="3" fill="none" stroke="#b98c58" strokeWidth="2" />
  </>
));

/** גשר עץ מקושת מעל הנהר */
export const Bridge = wrap(110, 96, (
  <>
    <path d="M8 30 q47 -22 94 0 l0 10 q-47 -22 -94 0 z" fill="#c68e4c" stroke="#7d5226" strokeWidth="3.5" strokeLinejoin="round" />
    <g stroke="#7d5226" strokeWidth="3">
      <line x1="16" y1="34" x2="16" y2="58" /><line x1="34" y1="27" x2="34" y2="62" />
      <line x1="55" y1="25" x2="55" y2="64" /><line x1="76" y1="27" x2="76" y2="62" />
      <line x1="94" y1="34" x2="94" y2="58" />
    </g>
    <path d="M6 58 q49 -24 98 0 l0 26 q-8 4 -14 4 l0 -18 q-35 -16 -70 0 l0 18 q-6 0 -14 -4 z"
      fill="#a9713a" stroke="#7d5226" strokeWidth="3.5" strokeLinejoin="round" />
    <g stroke="#7d5226" strokeWidth="2" opacity="0.6">
      <path d="M20 62 q30 -13 70 -1" fill="none" /><path d="M20 70 q30 -13 70 -1" fill="none" />
    </g>
  </>
));

/** ציפורת דשא — קווים קטנים */
export const Grass = wrap(50, 34, (
  <g stroke="#3d8b2f" strokeWidth="3.5" strokeLinecap="round" fill="none">
    <path d="M10 32 q-2 -14 -6 -20" /><path d="M20 32 q0 -18 -2 -26" />
    <path d="M30 32 q2 -16 8 -22" /><path d="M40 32 q4 -10 8 -13" />
  </g>
));
