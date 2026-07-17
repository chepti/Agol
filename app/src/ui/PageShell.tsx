import React from 'react';

/** רקעים רכים לעמודי תוכן — מתחלפים לפי מפתח */
export const SOFT_BGS = [
  '/agol/bg-pages.webp',
  '/agol/bg-soft-circle.webp',
  '/agol/bg-soft-meadow.webp',
  '/agol/bg-soft-blossom.webp',
  '/agol/bg-soft-sunset.webp',
  '/agol/bg-cottage.webp',
  '/agol/bg-join.webp',
] as const;

export function pickSoftBg(seed = ''): string {
  if (!seed) return SOFT_BGS[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SOFT_BGS[h % SOFT_BGS.length];
}

/** מעטפת עמוד עם רקע מאויר בשקיפות — נראה אבל לא מפריע לקריאה */
export function SoftPageShell({
  children,
  image,
  seed,
  opacity = 0.38,
  overlay = 'rgba(248, 245, 238, 0.55)',
}: {
  children: React.ReactNode;
  image?: string;
  /** בחירת רקע יציבה לפי מפתח (מזהה פעילות / נתיב) */
  seed?: string;
  opacity?: number;
  /** שכבת נייר מעל הרקע לקריאות */
  overlay?: string;
}) {
  const bg = image || pickSoftBg(seed || '');
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background: overlay,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

/** רקע מלא לדפי כניסה — עם הצללה לקריאות טקסט */
export function HeroBg({
  children,
  image,
  overlay = 'linear-gradient(170deg, rgba(15,40,30,0.55) 0%, rgba(20,70,55,0.45) 45%, rgba(30,90,70,0.55) 100%)',
}: {
  children: React.ReactNode;
  image: string;
  overlay?: string;
}) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background: overlay,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>{children}</div>
    </div>
  );
}
