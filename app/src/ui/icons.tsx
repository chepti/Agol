import React from 'react';

// אייקוני SVG בסגנון Lucide: stroke בלבד, קצוות מעוגלים, 24x24.

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

function make(children: React.ReactNode) {
  return function Icon({ size = 20, color = 'currentColor', strokeWidth = 2, style }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, ...style }}
        aria-hidden
      >
        {children}
      </svg>
    );
  };
}

export const SkipForward = make(<><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></>);
export const Lock = make(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>);
export const Unlock = make(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>);
export const Check = make(<polyline points="20 6 9 17 4 12" />);
export const Eye = make(<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>);
export const Pencil = make(<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />);
export const Search = make(<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>);
export const LinkIcon = make(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>);
export const Copy = make(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>);
export const BookOpen = make(<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>);
export const ListOrdered = make(<><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></>);
export const Palette = make(<><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.28-.44-.65-.44-1.12a1.64 1.64 0 0 1 1.67-1.67h1.97c3.05 0 5.55-2.5 5.55-5.55C21.96 6.01 17.46 2 12 2Z" /><circle cx="13.5" cy="6.5" r="1" fill="currentColor" stroke="none" /><circle cx="17.5" cy="10.5" r="1" fill="currentColor" stroke="none" /><circle cx="8.5" cy="7.5" r="1" fill="currentColor" stroke="none" /><circle cx="6.5" cy="12.5" r="1" fill="currentColor" stroke="none" /></>);
export const HelpCircle = make(<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>);
export const Volume2 = make(<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>);
export const VolumeX = make(<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>);
export const Users = make(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>);
export const ListIcon = make(<><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>);
export const TypeIcon = make(<><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></>);
export const School = make(<><path d="M14 22v-4a2 2 0 1 0-4 0v4" /><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" /><path d="M18 5v17" /><path d="m4 6 8-4 8 4" /><path d="M6 5v17" /><circle cx="12" cy="9" r="2" /></>);
export const StarIcon = make(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />);
export const Trophy = make(<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>);

/** כוכב מלא/ריק לציוני פעילות */
export function Star({ filled, size = 13 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={filled ? '#f6b31b' : 'rgba(255,255,255,0.55)'}
        stroke={filled ? '#b8860b' : '#8f8f7a'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** כוכב תלת־ממדי בולט לקשת מעל תחנה במפה — עם מסגרת לבנה דקה */
export function Star3D({ filled, size = 22 }: { filled: boolean; size?: number }) {
  const uid = React.useId().replace(/:/g, '');
  const gid = `star3d-${uid}`;
  const pts = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: 'block', filter: filled ? 'drop-shadow(0 2px 4px rgba(120,70,0,0.55))' : 'none' }}>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={filled ? '#fff6c8' : '#f1f5f9'} />
          <stop offset="45%" stopColor={filled ? '#f6c53d' : '#e2e8f0'} />
          <stop offset="100%" stopColor={filled ? '#d97706' : '#94a3b8'} />
        </radialGradient>
      </defs>
      <polygon points={pts} fill="none" stroke="#fff" strokeWidth="3.4" strokeLinejoin="round" />
      <polygon
        points={pts}
        fill={`url(#${gid})`}
        stroke={filled ? '#a16207' : '#64748b'}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** אייקון לכל סוג פעילות */
export const ACTIVITY_ICONS: Record<string, ReturnType<typeof make>> = {
  intro: Eye,
  flashcards: Pencil,
  wordsearch: Search,
  match: LinkIcon,
  memory: Copy,
  story: BookOpen,
  order: ListOrdered,
  paint: Palette,
  quiz: HelpCircle,
};
