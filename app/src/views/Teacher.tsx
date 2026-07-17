import React, { useEffect, useState } from 'react';
import {
  loadTeacher, saveTeacher, teacherLogin, teacherRegister,
  fetchClasses, createClass, fetchHeatmap, setClassFree,
  teacherPreviewSession,
  type TeacherSession, type ClassInfo, type HeatmapStudent,
} from '../lib/api';
import { LETTERS } from '../data/letters';
import { masteryFrom, masteryColor, masteryLabel } from '../lib/mastery';
import { totalActivities } from '../data/units';
import { nav } from '../App';
import { SoftPageShell, HeroBg } from '../ui/PageShell';
import { FeedbackButton, SiteCredit } from '../ui/Feedback';

function classJoinUrl(code: string): string {
  const base = `${window.location.origin}${window.location.pathname.replace(/\/?$/, '/')}`;
  return `${base}#/join/${encodeURIComponent(code)}`;
}

export default function Teacher() {
  const [teacher, setTeacher] = useState<TeacherSession | null>(loadTeacher());

  if (!teacher) return <TeacherAuth onAuth={setTeacher} />;
  return (
    <TeacherDashboard
      teacher={teacher}
      onLogout={() => {
        saveTeacher(null);
        setTeacher(null);
        nav('/');
      }}
    />
  );
}

// ─────────────────────────── התחברות / הרשמה ───────────────────────────

function TeacherAuth({ onAuth }: { onAuth: (t: TeacherSession) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const t = mode === 'login'
        ? await teacherLogin(email.trim(), password)
        : await teacherRegister(name.trim(), email.trim(), password);
      onAuth(t);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  return (
    <HeroBg image="/agol/bg-cottage.webp" overlay="linear-gradient(170deg, rgba(30,41,59,0.72) 0%, rgba(51,65,85,0.65) 100%)">
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form className="card pop-in" onSubmit={submit} style={{ width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.95)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>👩‍🏫</div>
          <h2>אזור המורים</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14.5, marginTop: 4 }}>
            יוצרים כיתה, מקבלים קוד, ורואים בזמן אמת באילו אותיות כל תלמיד שולט
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, margin: '14px 0', background: '#f1f5f9', borderRadius: 999, padding: 4 }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                flex: 1, border: 'none', borderRadius: 999, padding: '8px 0', fontWeight: 700, fontSize: 15,
                background: mode === m ? '#fff' : 'transparent',
                boxShadow: mode === m ? 'var(--shadow)' : 'none',
                color: mode === m ? 'var(--teal-dark)' : 'var(--ink-soft)',
              }}
            >
              {m === 'login' ? 'התחברות' : 'הרשמה'}
            </button>
          ))}
        </div>
        {mode === 'register' && (
          <input className="field" style={{ marginBottom: 10 }} placeholder="שם מלא" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input className="field" style={{ marginBottom: 10 }} type="email" placeholder="אימייל" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
        <input className="field" type="password" placeholder="סיסמה (6 תווים לפחות)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {err && <p className="err">{err}</p>}
        <button className="btn" style={{ width: '100%', marginTop: 14 }} disabled={busy}>
          {busy ? 'רגע...' : mode === 'login' ? 'התחברות' : 'יצירת חשבון'}
        </button>
        <button type="button" className="btn" style={{ width: '100%', background: 'transparent', boxShadow: 'none', color: 'var(--ink-soft)', fontSize: 14 }} onClick={() => nav('/')}>
          → חזרה למסך הראשי
        </button>
      </form>
    </div>
    </HeroBg>
  );
}

// ─────────────────────────── לוח המורה ───────────────────────────

function TeacherDashboard({ teacher, onLogout }: { teacher: TeacherSession; onLogout: () => void }) {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selected, setSelected] = useState<ClassInfo | null>(null);
  const [newName, setNewName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const refresh = async () => {
    try {
      const list = await fetchClasses(teacher);
      setClasses(list);
      if (selected) {
        const cur = list.find((c) => c.id === selected.id) || null;
        setSelected(cur);
      }
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'שגיאה');
      if (ex instanceof Error && /התחבר/.test(ex.message)) onLogout();
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await createClass(teacher, newName.trim());
      setNewName('');
      await refresh();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  const copyJoinLink = async (c: ClassInfo) => {
    const url = classJoinUrl(c.code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(c.id);
      setTimeout(() => setCopiedId((id) => (id === c.id ? null : id)), 2000);
    } catch {
      window.prompt('העתיקו את הקישור:', url);
    }
  };

  const openPreview = () => {
    teacherPreviewSession();
    window.dispatchEvent(new Event('agol-session'));
    nav('/map');
  };

  return (
    <SoftPageShell seed="teacher">
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 16px 60px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>👩‍🏫 שלום, {teacher.name}</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '2px 0 0' }}>לוח מעקב — מסע כתב היד</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <FeedbackButton compact />
          <button
            className="btn secondary small"
            onClick={openPreview}
            title="פותח את מפת המסע עם כל השלבים פתוחים — בלי נעילה"
          >
            🗺️ צפייה בשלבי המשחק
          </button>
          <button
            className="btn secondary small"
            onClick={() => nav('/path-edit')}
            title="גרירת תחנות על השביל להתאמה ידנית"
          >
            ✏️ התאמת מסלול
          </button>
          <button className="btn small" style={{ background: 'transparent', boxShadow: 'none', color: 'var(--ink-soft)' }} onClick={onLogout}>
            יציאה
          </button>
        </div>
      </header>

      {err && <p className="err">{err}</p>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'stretch' }}>
        {classes.map((c) => (
          <div
            key={c.id}
            className="card"
            onClick={() => setSelected(c)}
            style={{
              minWidth: 220,
              textAlign: 'right',
              border: selected?.id === c.id ? '2px solid var(--teal)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            <h3 style={{ fontSize: 17 }}>{c.name}</h3>
            <p style={{ margin: '4px 0', color: 'var(--ink-soft)', fontSize: 14 }}>{c.students} תלמידים</p>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 6, color: 'var(--teal-dark)', direction: 'ltr', textAlign: 'center', background: 'var(--teal-soft)', borderRadius: 8, padding: '6px 0' }}>
              {c.code}
            </div>
            <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center' }}>קוד מספרי להצטרפות</p>
            <button
              type="button"
              className="btn small"
              style={{ width: '100%', marginBottom: 8, fontSize: 13 }}
              onClick={(e) => {
                e.stopPropagation();
                copyJoinLink(c);
              }}
              title={classJoinUrl(c.code)}
            >
              {copiedId === c.id ? '✓ הקישור הועתק' : '🔗 העתקת קישור לתלמידים'}
            </button>
            <p style={{ margin: '0 0 8px', fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.35, wordBreak: 'break-all', direction: 'ltr', textAlign: 'left' }}>
              {classJoinUrl(c.code)}
            </p>
            <label
              onClick={(e) => e.stopPropagation()}
              title="כשמופעל — התלמידים חופשיים לבחור כל פעילות, בלי נעילה לפי סדר"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={c.freeNav}
                onChange={async (e) => {
                  const free = e.target.checked;
                  try {
                    await setClassFree(teacher, c.id, free);
                    await refresh();
                  } catch (ex) {
                    setErr(ex instanceof Error ? ex.message : 'שגיאה');
                  }
                }}
              />
              מסלול חופשי (ללא נעילת שלבים)
            </label>
          </div>
        ))}
        <form className="card" onSubmit={addClass} style={{ minWidth: 190, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
          <input className="field" placeholder="שם כיתה חדשה" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn small" disabled={busy || !newName.trim()}>+ יצירת כיתה</button>
        </form>
      </div>

      {selected ? (
        <Heatmap teacher={teacher} cls={selected} />
      ) : (
        <p style={{ color: 'var(--ink-soft)', textAlign: 'center', marginTop: 40 }}>
          {classes.length
            ? 'בחרו כיתה כדי לראות את מפת החום'
            : 'צרו כיתה ראשונה, שלחו לתלמידים את הקישור או את הקוד המספרי — והמפה תתמלא מעצמה'}
        </p>
      )}
      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end' }}>
        <SiteCredit />
      </div>
    </div>
    </SoftPageShell>
  );
}

// ─────────────────────────── מפת החום ───────────────────────────

function Heatmap({ teacher, cls }: { teacher: TeacherSession; cls: ClassInfo }) {
  const [students, setStudents] = useState<HeatmapStudent[] | null>(null);
  const [err, setErr] = useState('');
  const [drill, setDrill] = useState<HeatmapStudent | null>(null);

  useEffect(() => {
    setStudents(null);
    setDrill(null);
    fetchHeatmap(teacher, cls.id)
      .then(setStudents)
      .catch((ex) => setErr(ex instanceof Error ? ex.message : 'שגיאה'));
  }, [teacher, cls.id]);

  if (err) return <p className="err">{err}</p>;
  if (!students) return <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>טוען...</p>;
  if (students.length === 0) {
    const url = classJoinUrl(cls.code);
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 17 }}>עדיין אין תלמידים בכיתה זו.</p>
        <p style={{ color: 'var(--ink-soft)' }}>
          שלחו לתלמידים את הקישור (מומלץ) או את הקוד <b style={{ letterSpacing: 3 }}>{cls.code}</b>
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', direction: 'ltr', wordBreak: 'break-all', marginTop: 8 }}>
          {url}
        </p>
      </div>
    );
  }

  const classAvg: Record<string, { c: number; w: number }> = {};
  for (const s of students) {
    for (const [l, e] of Object.entries(s.letters)) {
      if (!classAvg[l]) classAvg[l] = { c: 0, w: 0 };
      classAvg[l].c += e.c;
      classAvg[l].w += e.w;
    }
  }

  const cell = (st: { c: number; w: number } | undefined, key: string) => {
    const m = masteryFrom(st?.c ?? 0, st?.w ?? 0);
    return (
      <td
        key={key}
        title={st ? `${masteryLabel(m)} · ${st.c} נכונות, ${st.w} שגויות` : 'טרם תורגל'}
        style={{
          background: masteryColor(m),
          width: 30,
          minWidth: 26,
          height: 32,
          borderRadius: 6,
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: m >= 0 ? 'rgba(0,0,0,0.55)' : '#94a3b8',
          cursor: 'default',
        }}
      >
        {m >= 0 ? m : ''}
      </td>
    );
  };

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <h2 style={{ fontSize: 19 }}>מפת שליטה — {cls.name}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)' }}>
          <span>מתקשה</span>
          {[0, 25, 50, 75, 100].map((v) => (
            <span key={v} style={{ width: 20, height: 14, borderRadius: 4, background: masteryColor(v) }} />
          ))}
          <span>שולט</span>
          <span style={{ width: 20, height: 14, borderRadius: 4, background: masteryColor(-1), marginRight: 8 }} />
          <span>טרם תורגל</span>
        </div>
      </div>
      <table style={{ borderCollapse: 'separate', borderSpacing: 3, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'right', fontSize: 13, color: 'var(--ink-soft)', minWidth: 110 }}>תלמיד/ה</th>
            {LETTERS.map((l) => (
              <th key={l.ch} style={{ fontSize: 15, fontWeight: 400, padding: '0 1px' }}>
                <div>{l.ch}</div>
                <div className="agol-font" style={{ fontSize: 17, color: 'var(--ink-soft)' }}>{l.ch}</div>
              </th>
            ))}
            <th style={{ fontSize: 12, color: 'var(--ink-soft)' }}>פעילויות</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ fontWeight: 900, fontSize: 13.5, color: 'var(--teal-dark)' }}>כל הכיתה</td>
            {LETTERS.map((l) => cell(classAvg[l.ch], `avg-${l.ch}`))}
            <td />
          </tr>
          {students.map((s) => (
            <tr key={s.id} onClick={() => setDrill(drill?.id === s.id ? null : s)} style={{ cursor: 'pointer' }}>
              <td style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
                {s.emoji} {s.nickname}
              </td>
              {LETTERS.map((l) => cell(s.letters[l.ch], `${s.id}-${l.ch}`))}
              <td style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)' }}>
                {s.activitiesDone}/{totalActivities()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {drill && (
        <div className="card float-up" style={{ marginTop: 14, background: '#f8fafc' }}>
          <h3 style={{ fontSize: 16 }}>{drill.nickname}</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '4px 0 10px' }}>
            {drill.activitiesDone} פעילויות הושלמו · נראה לאחרונה: {drill.lastSeen ? new Date(drill.lastSeen + 'Z').toLocaleString('he-IL') : '—'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {LETTERS.filter((l) => {
              const st = drill.letters[l.ch];
              return st && masteryFrom(st.c, st.w) < 55;
            }).map((l) => (
              <span key={l.ch} style={{ background: 'var(--red-soft)', color: 'var(--red)', borderRadius: 999, padding: '3px 12px', fontSize: 14, fontWeight: 700 }}>
                {l.ch} — {l.name}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '8px 0 0' }}>
            האותיות המסומנות באדום דורשות תרגול נוסף אצל תלמיד/ה זו.
          </p>
        </div>
      )}
      <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 10 }}>
        לחיצה על שורת תלמיד/ה מציגה פירוט. המספר בכל תא = רמת שליטה (0–100), משוקלל לפי תשובות נכונות ושגויות.
      </p>
    </div>
  );
}
