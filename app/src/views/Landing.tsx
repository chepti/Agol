import React from 'react';
import { nav } from '../App';
import { HeroBg } from '../ui/PageShell';
import { SiteCredit } from '../ui/Feedback';

export default function Landing() {
  return (
    <HeroBg image="/agol/bg-landing.webp">
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          position: 'relative',
        }}
      >
        <div className="pop-in" style={{ textAlign: 'center', color: '#fff', marginBottom: 36 }}>
          <div className="agol-font" style={{ fontSize: 84, lineHeight: 1, marginBottom: 8, textShadow: '0 4px 22px rgba(0,0,0,0.45)' }}>
            שלום
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 900, textShadow: '0 2px 14px rgba(0,0,0,0.4)' }}>מסע כתב היד</h1>
          <p style={{ fontSize: 19, opacity: 0.95, maxWidth: 460, margin: '10px auto 0', lineHeight: 1.6, textShadow: '0 1px 8px rgba(0,0,0,0.35)' }}>
            לומדים לקרוא כתב יד (כתב עגול) צעד אחר צעד — מהקווים הפשוטים ועד קריאה שוטפת, במשחקים ובכיף
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340 }}>
          <button
            className="btn gold"
            style={{ fontSize: 18, padding: '14px 22px', whiteSpace: 'nowrap' }}
            onClick={() => nav('/join')}
          >
            יש לי קוד כיתה
          </button>
          <button
            className="btn"
            style={{ background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.65)', backdropFilter: 'blur(6px)' }}
            onClick={() => nav('/join/guest')}
          >
            תרגול חופשי בלי כיתה
          </button>
          <button
            className="btn"
            style={{ background: 'transparent', boxShadow: 'none', fontSize: 15, opacity: 0.9 }}
            onClick={() => nav('/teacher')}
          >
            👩‍🏫 כניסת מורים
          </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 40, textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}>
          מדפוס לכתב עגול — קריאת כתב יד בהנאה, שלב אחר שלב
        </p>
        <div style={{ position: 'absolute', bottom: 16, right: 16, left: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <SiteCredit light />
        </div>
      </div>
    </HeroBg>
  );
}
