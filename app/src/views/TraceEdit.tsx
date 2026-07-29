import React, { useEffect, useRef, useState } from 'react';
import { LETTERS } from '../data/letters';
import { getLetterStrokes, saveLetterStrokes, hasStrokes, exportStrokesTs, type LetterStrokes, type StrokePt } from '../data/strokes';
import { SoftPageShell } from '../ui/PageShell';
import { RotateCcw, Eraser, Check } from '../ui/icons';
import { nav } from '../App';

// עורך מסלולי כתיבה: בוחרים אות, מציירים עליה את סדר וכיוון המשיכות,
// שומרים (מקומית, נכנס מיד לפעילות) ומעתיקים קוד להטמעה קבועה.

const SIZE = 340;
const FONT_PX = 220;
const BASELINE_Y = SIZE * 0.58;

export default function TraceEdit() {
  const [letter, setLetter] = useState('א');
  const [strokes, setStrokes] = useState<LetterStrokes>([]);
  const [fontReady, setFontReady] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, force] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const cur = useRef<StrokePt[]>([]);

  useEffect(() => {
    document.fonts.load(`700 ${FONT_PX}px Agol`).then(() => setFontReady(true));
  }, []);

  // טעינת מסלול קיים בבחירת אות
  useEffect(() => {
    setStrokes(getLetterStrokes(letter) ? getLetterStrokes(letter)!.map((s) => s.map((p) => [...p] as StrokePt)) : []);
    setMsg(null);
  }, [letter]);

  const redraw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    // קווי מחברת
    const lines = [
      { y: 0.20, dash: true, w: 1.5, c: '#b7d7e8' },
      { y: 0.365, dash: false, w: 2, c: '#8ec5dc' },
      { y: 0.58, dash: false, w: 2.5, c: '#5a9fb8' },
      { y: 0.74, dash: true, w: 1.5, c: '#b7d7e8' },
    ];
    lines.forEach((ln) => {
      ctx.beginPath();
      ctx.setLineDash(ln.dash ? [6, 6] : []);
      ctx.strokeStyle = ln.c;
      ctx.lineWidth = ln.w;
      ctx.moveTo(SIZE * 0.05, SIZE * ln.y);
      ctx.lineTo(SIZE * 0.95, SIZE * ln.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    // האות ברקע — יושבת על קו הבסיס
    ctx.font = `700 ${FONT_PX}px Agol`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#cfe6f2';
    ctx.fillText(letter, SIZE / 2, BASELINE_Y);
    // המשיכות שנשמרו + הנוכחית
    const all = [...strokes, cur.current.length ? cur.current : []].filter((s) => s.length);
    all.forEach((st, si) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 14;
      ctx.strokeStyle = ['#0d9488', '#f59e0b', '#8b5cf6', '#e05252', '#3b82f6'][si % 5];
      ctx.beginPath();
      st.forEach((p, i) => {
        const x = p[0] * SIZE, y = p[1] * SIZE;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      const s0 = st[0];
      ctx.beginPath();
      ctx.arc(s0[0] * SIZE, s0[1] * SIZE, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#16a34a';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      ctx.font = '700 15px "Varela Round"';
      ctx.fillText(String(si + 1), s0[0] * SIZE, s0[1] * SIZE + 1);
      ctx.font = `700 ${FONT_PX}px Agol`;
      ctx.textBaseline = 'alphabetic';
    });
  };

  useEffect(redraw, [strokes, letter, fontReady]);

  const toNorm = (e: React.PointerEvent): StrokePt => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };

  const play = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !strokes.length) return;
    const flat: StrokePt[] = [];
    strokes.forEach((s) => flat.push(...s));
    let i = 0;
    const timer = setInterval(() => {
      redraw();
      const p = flat[Math.min(i, flat.length - 1)];
      ctx.beginPath();
      ctx.arc(p[0] * SIZE, p[1] * SIZE, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#0f766e';
      ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
      i++;
      if (i > flat.length) { clearInterval(timer); redraw(); }
    }, 900 / Math.max(12, flat.length));
  };

  const save = () => {
    saveLetterStrokes(letter, strokes);
    setMsg('נשמר! המסלול כבר פעיל בפעילות הציור.');
    force((n) => n + 1);
    const idx = LETTERS.findIndex((l) => l.ch === letter);
    if (idx >= 0 && idx + 1 < LETTERS.length) {
      setTimeout(() => setLetter(LETTERS[idx + 1].ch), 350);
    }
  };

  const copyCode = async () => {
    const code = exportStrokesTs();
    try {
      await navigator.clipboard.writeText(code);
      setMsg('הקוד הועתק! אפשר להדביק בקובץ strokes.ts להטמעה קבועה.');
    } catch {
      setMsg('העתקה נכשלה — הקוד מופיע בקונסול.');
      // eslint-disable-next-line no-console
      console.log(code);
    }
  };

  return (
    <SoftPageShell seed="edit">
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 60px' }}>
        <button className="btn small" style={{ background: 'transparent', boxShadow: 'none', color: 'var(--teal-dark)', fontWeight: 700 }} onClick={() => nav('/map')}>
          → חזרה למפה
        </button>
        <h1 style={{ fontSize: 24, textAlign: 'center' }}>עורך מסלולי כתיבה ✍️</h1>
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.6 }}>
          בחרו אות, ציירו עליה את המשיכות לפי הסדר והכיוון הנכונים (כל גרירה = משיכה חדשה, ממוספרת).
          לחצו <b>שמור</b> וזה נכנס מיד לפעילות הציור. <b>העתקת קוד</b> — להטמעה קבועה.
        </p>

        {/* בחירת אות */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', margin: '14px 0' }}>
          {LETTERS.map((l) => (
            <button
              key={l.ch}
              onClick={() => setLetter(l.ch)}
              className={l.ch === letter ? '' : 'agol-font'}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                fontSize: 22,
                border: l.ch === letter ? '3px solid var(--teal)' : '2px solid #cbd5e1',
                background: l.ch === letter ? 'var(--teal-soft)' : '#fff',
                position: 'relative',
              }}
            >
              <span className="agol-font">{l.ch}</span>
              {hasStrokes(l.ch) && (
                <span style={{ position: 'absolute', top: -5, right: -5, width: 15, height: 15, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={9} color="#fff" strokeWidth={3.5} />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* קנבס ציור */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{
              width: 'min(88vw, 340px)',
              aspectRatio: '1',
              background: 'linear-gradient(160deg,#f4fbff,#e2f2fb)',
              border: '2px solid #a9d8ee',
              borderRadius: 20,
              boxShadow: 'var(--shadow)',
              touchAction: 'none',
              cursor: 'crosshair',
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
              drawing.current = true;
              cur.current = [toNorm(e)];
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return;
              cur.current.push(toNorm(e));
              redraw();
            }}
            onPointerUp={() => {
              if (!drawing.current) return;
              drawing.current = false;
              const finished = cur.current;   // ללכוד לפני האיפוס — ה-updater רץ מאוחר
              cur.current = [];
              if (finished.length > 1) setStrokes((s) => [...s, finished]);
            }}
          />
        </div>

        {msg && <p className="float-up" style={{ textAlign: 'center', color: 'var(--teal-dark)', fontWeight: 700, minHeight: 20 }}>{msg}</p>}
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
          {strokes.length} משיכות · אות {letter}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 6 }}>
          <button className="pill" style={{ cursor: 'pointer', padding: '8px 14px' }} onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length}>
            <RotateCcw size={15} /> בטלו משיכה
          </button>
          <button className="pill" style={{ cursor: 'pointer', padding: '8px 14px' }} onClick={() => { setStrokes([]); }} disabled={!strokes.length}>
            <Eraser size={15} /> נקו הכול
          </button>
          <button className="pill" style={{ cursor: 'pointer', padding: '8px 14px' }} onClick={play} disabled={!strokes.length}>
            ▶ נגנו
          </button>
          <button className="btn small" onClick={save} disabled={!strokes.length}>שמור ✓</button>
          <button className="btn small secondary" onClick={copyCode}>העתקת קוד</button>
        </div>
      </div>
    </SoftPageShell>
  );
}
