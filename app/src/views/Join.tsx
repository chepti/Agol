import React, { useState } from 'react';
import { joinClass, guestSession, type StudentSession } from '../lib/api';
import { nav } from '../App';
import { HeroBg } from '../ui/PageShell';

// הזהות של תלמיד = שם + אימוג'י. האימוג'י הוא "סיסמה קטנה":
// בכניסה הבאה חייבים לבחור את אותו אימוג'י — כך כמה תלמידים חולקים מחשב בבטחה.

export const EMOJIS = ['🦁', '🐬', '🦄', '🚀', '⚽', '🎨', '🌈', '🍉', '🐱', '🦋', '🌟', '🤖', '🎸', '🐢', '👑', '🍕'];

export default function Join({
  onJoined,
  initialCode = '',
}: {
  onJoined: (s: StudentSession) => void;
  initialCode?: string;
}) {
  const isGuest = window.location.hash.includes('guest');
  const linkCode = initialCode.replace(/\s+/g, '').toUpperCase();
  const [code, setCode] = useState(linkCode);
  const [nick, setNick] = useState('');
  const [emoji, setEmoji] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const codeFromLink = linkCode.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!nick.trim()) { setErr('כתבו שם או כינוי'); return; }
    if (!emoji) { setErr('בחרו אימוג\'י — הוא הסימן הסודי שלכם לכניסה הבאה'); return; }
    if (isGuest) {
      onJoined(guestSession(nick.trim(), emoji));
      return;
    }
    const joinCode = (codeFromLink ? linkCode : code.trim()).toUpperCase();
    if (!joinCode) { setErr('כתבו את קוד הכיתה שקיבלתם מהמורה'); return; }
    setBusy(true);
    try {
      onJoined(await joinClass(joinCode, nick.trim(), emoji));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'שגיאה — נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  return (
    <HeroBg image="/agol/bg-join.webp" overlay="linear-gradient(170deg, rgba(19,60,50,0.55) 0%, rgba(15,80,70,0.5) 100%)">
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <form className="card pop-in" onSubmit={submit} style={{ width: '100%', maxWidth: 430, textAlign: 'center', background: 'rgba(255,255,255,0.94)' }}>
        <div style={{ fontSize: 44 }}>{isGuest ? '🧭' : '🎒'}</div>
        <h2 style={{ margin: '6px 0 4px' }}>{isGuest ? 'תרגול חופשי' : 'הצטרפות לכיתה'}</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginTop: 0 }}>
          {isGuest
            ? 'ההתקדמות נשמרת על המכשיר הזה, לפי השם והאימוג\'י שתבחרו'
            : codeFromLink
              ? 'בחרו שם ואימוג\'י — והמסע מתחיל (הקוד כבר מולא מהקישור)'
              : 'הכניסו את קוד הכיתה שקיבלתם מהמורה, ובחרו שם ואימוג\'י'}
        </p>
        {!isGuest && codeFromLink && (
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: 8,
              color: 'var(--teal-dark)',
              direction: 'ltr',
              background: 'var(--teal-soft)',
              borderRadius: 12,
              padding: '10px 0',
              marginBottom: 12,
            }}
          >
            {linkCode}
          </div>
        )}
        {!isGuest && !codeFromLink && (
          <input
            className="field"
            style={{ textAlign: 'center', fontSize: 28, letterSpacing: 8, fontWeight: 700, marginBottom: 12 }}
            placeholder="קוד כיתה (מספרים)"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\dA-Za-z]/g, ''))}
            maxLength={8}
            inputMode="numeric"
            pattern="[0-9]*"
            dir="ltr"
            autoComplete="one-time-code"
          />
        )}
        <input
          className="field"
          style={{ textAlign: 'center', fontSize: 20 }}
          placeholder="השם או הכינוי שלי"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          maxLength={30}
        />
        <p style={{ fontSize: 14.5, fontWeight: 700, margin: '14px 0 8px' }}>
          בחרו אימוג'י — זה הסימן הסודי שלכם 🤫
          <br />
          <span style={{ fontWeight: 400, color: 'var(--ink-soft)', fontSize: 13 }}>
            בכניסה הבאה תצטרכו לבחור את אותו אימוג'י בדיוק, אז תזכרו אותו!
          </span>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
          {EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setEmoji(em)}
              style={{
                fontSize: 24,
                padding: '6px 0',
                borderRadius: 10,
                border: emoji === em ? '3px solid var(--teal)' : '2px solid #e2e8f0',
                background: emoji === em ? 'var(--teal-soft)' : '#fff',
                transform: emoji === em ? 'scale(1.12)' : 'none',
                transition: 'all 0.12s',
              }}
            >
              {em}
            </button>
          ))}
        </div>
        {err && <p className="err">{err}</p>}
        <button className="btn" style={{ width: '100%', marginTop: 16 }} disabled={busy}>
          {busy ? 'רגע...' : 'יוצאים למסע! 🚀'}
        </button>
        <button type="button" className="btn" style={{ background: 'transparent', boxShadow: 'none', color: 'var(--ink-soft)', fontSize: 14, marginTop: 6 }} onClick={() => nav('/')}>
          → חזרה
        </button>
      </form>
    </div>
    </HeroBg>
  );
}
