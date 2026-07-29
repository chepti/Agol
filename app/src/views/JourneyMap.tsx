import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { UNITS } from '../data/units';
import { setGuestFreeNav, type StudentSession, type ProgressData } from '../lib/api';
import { unitDoneCount, unitUnlocked, unitCompleted, overallPercent, allCompleted } from '../lib/progressUtil';
import { soundEnabled, toggleSound } from '../lib/sound';
import { TypeIcon, Volume2, VolumeX, ListIcon, Users, School, Unlock } from '../ui/icons';
import JourneyTrail from './JourneyTrail';
import { SoftPageShell } from '../ui/PageShell';
import { FeedbackButton } from '../ui/Feedback';
import { nav } from '../App';
import { useNikud } from '../lib/NikudContext';

type MapView = 'trail' | 'list';
const LS_VIEW = 'agol_map_view';

export default function JourneyMap({
  session,
  progress,
  onLogout,
  onSessionChange,
}: {
  session: StudentSession;
  progress: ProgressData;
  onLogout: (to?: string) => void;
  onSessionChange: (s: StudentSession) => void;
}) {
  const pct = overallPercent(progress);
  const finished = allCompleted(progress);
  const celebrated = useRef(false);
  const { enabled: nikudOn, setEnabled: setNikudOn, text } = useNikud();
  const [view, setView] = useState<MapView>(() =>
    localStorage.getItem(LS_VIEW) === 'list' ? 'list' : 'trail'
  );
  const [sound, setSound] = useState(soundEnabled());

  const switchView = (v: MapView) => {
    setView(v);
    localStorage.setItem(LS_VIEW, v);
  };

  useEffect(() => {
    if (finished && !celebrated.current) {
      celebrated.current = true;
      const end = Date.now() + 1800;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [finished]);

  // במפת המסע הגלילה מתחילה מלמטה (JourneyTrail); ברשימה — לראש העמוד
  useEffect(() => {
    if (view === 'list') window.scrollTo(0, 0);
  }, [view]);

  const isTeacherPreview = session.token === 'teacher-preview';

  // ─── כפתור עגול מרחף ───
  const fab = (icon: React.ReactNode, title: string, onClick: () => void) => (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 46,
        height: 46,
        borderRadius: '50%',
        border: '2.5px solid rgba(125, 82, 38, 0.7)',
        background: 'rgba(255, 254, 247, 0.95)',
        color: '#6b4f26',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(30, 70, 20, 0.35)',
        flexShrink: 0,
      }}
    >
      {icon}
    </button>
  );

  if (view === 'trail') {
    return (
      <div style={{ position: 'relative' }}>
        <JourneyTrail progress={progress} />

        {/* פס התקדמות דק צמוד לראש המסך */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 8, background: 'rgba(255,255,255,0.4)', zIndex: 10 }}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--gold), #f3c53d)',
              transition: 'width 0.6s ease',
              borderRadius: '0 999px 999px 0',
            }}
          />
        </div>

        {/* שלום + אחוז — מוצמד לפינה הימנית העליונה */}
        <div
          style={{
            position: 'fixed',
            top: 16,
            right: 12,
            zIndex: 10,
            background: 'rgba(255, 254, 247, 0.94)',
            border: '3px solid rgba(125, 82, 38, 0.85)',
            borderRadius: 999,
            padding: '7px 18px',
            boxShadow: '0 4px 10px rgba(30, 70, 20, 0.35)',
            maxWidth: '58vw',
          }}
        >
          <div style={{ fontSize: 16.5, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session.emoji} {session.nickname}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 700 }}>
            {isTeacherPreview ? 'תצוגת מורה' : session.className ? `כיתת ${session.className}` : 'תרגול חופשי'}
            {' '}· {pct}%
          </div>
        </div>

        {/* כפתורי פעולה — מוצמדים לפינה השמאלית העליונה */}
        <div style={{ position: 'fixed', top: 16, left: 12, zIndex: 10, display: 'flex', gap: 8 }}>
          {fab(<TypeIcon size={21} />, 'האותיות שלי', () => nav('/progress'))}
          {fab(sound ? <Volume2 size={21} /> : <VolumeX size={21} />, sound ? 'השתקת צלילים' : 'הפעלת צלילים', () => setSound(toggleSound()))}
          {fab(<ListIcon size={21} />, 'תצוגת רשימה', () => switchView('list'))}
          {isTeacherPreview
            ? fab(<School size={21} />, 'חזרה ללוח המורה', () => onLogout('/teacher'))
            : fab(<Users size={21} />, 'החלפת משתמש — במחשב משותף כל תלמיד נכנס עם השם והאימוג\'י שלו', () => onLogout())}
        </div>

        {/* מסלול חופשי + ניקוד — לאורח / תצוגת מורה */}
        {(session.token === 'guest' || isTeacherPreview) && (
          <div
            style={{
              position: 'fixed',
              bottom: 14,
              left: 12,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {session.token === 'guest' && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#4a3416',
                  background: 'rgba(255, 254, 247, 0.94)',
                  border: '3px solid rgba(125, 82, 38, 0.85)',
                  borderRadius: 999,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(30, 70, 20, 0.35)',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!session.freeNav}
                  onChange={(e) => onSessionChange(setGuestFreeNav(session, e.target.checked))}
                />
                <Unlock size={16} />
                מסלול חופשי
              </label>
            )}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 13.5,
                fontWeight: 700,
                color: '#4a3416',
                background: 'rgba(255, 254, 247, 0.94)',
                border: '3px solid rgba(125, 82, 38, 0.85)',
                borderRadius: 999,
                padding: '7px 14px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(30, 70, 20, 0.35)',
              }}
              title="כשכבוי — כל הטקסט בלי ניקוד"
            >
              <input
                type="checkbox"
                checked={nikudOn}
                onChange={(e) => setNikudOn(e.target.checked)}
              />
              {text('הצגת ניקוד')}
            </label>
          </div>
        )}

        {/* משוב — רק למורה / תרגול חופשי */}
        {(isTeacherPreview || session.token === 'guest') && (
          <div style={{ position: 'fixed', bottom: finished ? 96 : 14, right: 12, zIndex: 10 }}>
            <FeedbackButton compact />
          </div>
        )}

        {/* חגיגת סיום */}
        {finished && (
          <div
            className="pop-in"
            style={{
              position: 'fixed',
              bottom: 14,
              right: 12,
              zIndex: 10,
              background: 'rgba(255, 254, 247, 0.96)',
              border: '3px solid var(--gold)',
              borderRadius: 16,
              padding: '10px 18px',
              boxShadow: '0 4px 14px rgba(30, 70, 20, 0.4)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 26 }}>🏆</div>
            <div style={{ fontSize: 14.5, fontWeight: 900 }}>סיימתם את כל המסע!</div>
          </div>
        )}
      </div>
    );
  }

  // ─── תצוגת רשימה ───
  return (
    <SoftPageShell seed="map-list">
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px 60px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 26 }}>
            שלום, {session.nickname} {session.emoji}! <span className="agol-font" style={{ fontSize: 24, color: 'var(--teal)' }}>שלום</span>
          </h1>
          <p style={{ color: 'var(--ink-soft)', margin: '2px 0 0', fontSize: 14 }}>
            {isTeacherPreview
              ? 'תצוגת מורה · כל השלבים פתוחים'
              : session.className
                ? `כיתת ${session.className}`
                : 'תרגול חופשי'}
            {' '}· הושלמו {pct}% מהמסע
            {progress.freeNav && !isTeacherPreview ? ' · 🔓 מסלול חופשי' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {isTeacherPreview && (
            <button className="btn secondary small" onClick={() => onLogout('/teacher')}>
              ← חזרה ללוח המורה
            </button>
          )}
          {session.token === 'guest' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--ink-soft)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!session.freeNav}
                onChange={(e) => onSessionChange(setGuestFreeNav(session, e.target.checked))}
              />
              מסלול חופשי
            </label>
          )}
          {(isTeacherPreview || session.token === 'guest') && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--ink-soft)', cursor: 'pointer' }} title="כשכבוי — כל הטקסט בלי ניקוד">
              <input
                type="checkbox"
                checked={nikudOn}
                onChange={(e) => setNikudOn(e.target.checked)}
              />
              {text('הצגת ניקוד')}
            </label>
          )}
          {(isTeacherPreview || session.token === 'guest') && <FeedbackButton compact />}
          <button className="btn secondary small" onClick={() => switchView('trail')}>
            🗺️ מפת מסע
          </button>
          <button className="btn secondary small" onClick={() => nav('/progress')}>
            🔤 האותיות שלי
          </button>
          {!isTeacherPreview && (
            <button className="btn small" style={{ background: 'transparent', boxShadow: 'none', color: 'var(--ink-soft)' }} onClick={() => onLogout()} title="במחשב משותף — כל תלמיד נכנס עם השם והאימוג'י שלו">
              👥 החלפת משתמש
            </button>
          )}
        </div>
      </header>

      {/* פס התקדמות כללי */}
      <div style={{ background: '#e2e8f0', borderRadius: 999, height: 14, overflow: 'hidden', marginBottom: 26 }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            background: 'linear-gradient(90deg, var(--teal), #14b8a6)',
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      {finished && (
        <div className="card pop-in" style={{ textAlign: 'center', marginBottom: 22, border: '3px solid var(--gold)' }}>
          <div style={{ fontSize: 46 }}>🏆</div>
          <h2>סיימתם את כל המסע!</h2>
          <p style={{ color: 'var(--ink-soft)' }}>
            אתם קוראים כתב יד! אפשר לחזור לכל פעילות ולשפר את הכוכבים.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {UNITS.map((unit, i) => {
          const unlocked = unitUnlocked(progress, i);
          const done = unitDoneCount(progress, unit);
          const completed = unitCompleted(progress, unit);
          return (
            <button
              key={unit.id}
              onClick={() => unlocked && nav(`/unit/${unit.id}`)}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                textAlign: 'right',
                border: completed ? '2px solid var(--green)' : '2px solid transparent',
                opacity: unlocked ? 1 : 0.55,
                cursor: unlocked ? 'pointer' : 'default',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => unlocked && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
            >
              <div
                style={{
                  fontSize: 34,
                  width: 62,
                  height: 62,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: completed ? 'var(--green-soft)' : unlocked ? 'var(--teal-soft)' : '#e2e8f0',
                  flexShrink: 0,
                }}
              >
                {unlocked ? unit.icon : '🔒'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 19 }}>{i + 1}. {unit.title}</h3>
                  {unit.newLetters.length > 0 && unit.newLetters.length <= 4 && (
                    <span className="agol-font" style={{ color: 'var(--teal)', fontSize: 22 }}>
                      {unit.newLetters.join(' ')}
                    </span>
                  )}
                </div>
                <p style={{ margin: '2px 0 8px', color: 'var(--ink-soft)', fontSize: 14 }}>{unit.subtitle}</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {unit.activities.map((a) => (
                    <span
                      key={a.id}
                      style={{
                        height: 7,
                        flex: 1,
                        maxWidth: 46,
                        borderRadius: 4,
                        background: progress.completed[a.id] ? 'var(--green)' : '#e2e8f0',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: completed ? 'var(--green)' : 'var(--ink-soft)', flexShrink: 0 }}>
                {completed ? '✓ הושלם' : unlocked ? `${done}/${unit.activities.length}` : ''}
              </div>
            </button>
          );
        })}
      </div>
    </div>
    </SoftPageShell>
  );
}
