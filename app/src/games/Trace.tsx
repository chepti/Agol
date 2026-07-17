import React, { useEffect, useRef, useState } from 'react';
import type { TraceActivity, ActivityResult, LetterEvents } from '../data/types';
import { addLetterEvent } from '../lib/mastery';
import { playCorrect, playWin } from '../lib/sound';
import { ProgressDots } from './ui';
import { RotateCcw, Eraser } from '../ui/icons';

// ציור אותיות: מציירים על תבנית האות עם אצבע/עכבר.
// כלי עזר: הדגמה מונפשת של כיוון הכתיבה (מלמעלה למטה) לפני שמתחילים.
// קו הילד תכול כשהוא על האות, וכתום כשהוא חורג. אחוז מילוי מוצג בזמן אמת,
// והמעבר לאות הבאה אוטומטי כשהציור מדויק מספיק — בלי כפתור.

const SIZE = 340;
const FONT_PX = 250;
const INK_W = 17;
const HIT_W = 42;
const COVER_PASS = 0.7;    // כמה מהאות צריך לכסות
const STRAY_MAX = 0.4;     // כמה מהקו מותר שיחרוג

interface Pt { x: number; y: number }
interface Mask {
  glyph: Uint8Array;
  tolerant: Uint8Array;
  glyphCount: number;
  bboxTop: number;
  bboxHeight: number;
  skeleton: Pt[];   // קו מרכזי מלמעלה למטה — לנקודת ההתחלה ולהדגמה
}

function buildMask(letter: string): Mask {
  const off = document.createElement('canvas');
  off.width = SIZE; off.height = SIZE;
  const ctx = off.getContext('2d')!;
  ctx.font = `600 ${FONT_PX}px Agol`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, SIZE / 2, SIZE / 2 + 8);
  const g = ctx.getImageData(0, 0, SIZE, SIZE).data;

  ctx.lineWidth = 30;
  ctx.strokeText(letter, SIZE / 2, SIZE / 2 + 8);
  const t = ctx.getImageData(0, 0, SIZE, SIZE).data;

  const glyph = new Uint8Array(SIZE * SIZE);
  const tolerant = new Uint8Array(SIZE * SIZE);
  let glyphCount = 0, top = SIZE, bottom = 0;
  const rowXs: number[][] = Array.from({ length: SIZE }, () => []);
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (g[i * 4 + 3] > 60) {
      glyph[i] = 1; glyphCount++;
      const y = (i / SIZE) | 0, x = i % SIZE;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      rowXs[y].push(x);
    }
    if (t[i * 4 + 3] > 30) tolerant[i] = 1;
  }

  // שלד: לכל שורה ה-x החציוני, מדוגמם ל~36 נקודות מלמעלה למטה
  const raw: Pt[] = [];
  for (let y = top; y <= bottom; y++) {
    const xs = rowXs[y];
    if (xs.length) { xs.sort((a, b) => a - b); raw.push({ x: xs[(xs.length / 2) | 0], y }); }
  }
  const N = 36;
  const skeleton: Pt[] = [];
  for (let k = 0; k < N; k++) {
    const idx = Math.min(raw.length - 1, Math.round((k / (N - 1)) * (raw.length - 1)));
    skeleton.push(raw[idx] || { x: SIZE / 2, y: top });
  }
  return { glyph, tolerant, glyphCount, bboxTop: top, bboxHeight: Math.max(1, bottom - top), skeleton };
}

export default function Trace({
  activity,
  onFinish,
}: {
  activity: TraceActivity;
  onFinish: (r: ActivityResult) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [fontReady, setFontReady] = useState(false);
  const [fillPct, setFillPct] = useState(0);
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const maskRef = useRef<Mask | null>(null);
  const firstTryRef = useRef(true);
  const firstPointRef = useRef<Pt | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<Pt | null>(null);
  const scoreRef = useRef(0);
  const demoRaf = useRef<number | null>(null);

  const tplRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const demoRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLCanvasElement | null>(null);

  const letter = activity.letters[idx];

  useEffect(() => {
    let alive = true;
    document.fonts.load(`600 ${FONT_PX}px Agol`).then(() => alive && setFontReady(true));
    return () => { alive = false; };
  }, []);

  const drawTemplate = () => {
    const mask = maskRef.current!;
    const ctx = tplRef.current!.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.font = `600 ${FONT_PX}px Agol`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#cfe6f2';
    ctx.fillText(letter, SIZE / 2, SIZE / 2 + 8);
    // נקודת התחלה
    const s = mask.skeleton[0];
    ctx.beginPath();
    ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#16a34a';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  };

  const playDemo = () => {
    const mask = maskRef.current;
    const demo = demoRef.current;
    if (!mask || !demo) return;
    if (demoRaf.current) cancelAnimationFrame(demoRaf.current);
    const ctx = demo.getContext('2d')!;
    const pts = mask.skeleton;
    const DURATION = 1900;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min(1, (ts - t0) / DURATION);
      ctx.clearRect(0, 0, SIZE, SIZE);
      // עקבה מודגמת עד המיקום הנוכחי
      const upto = Math.max(1, Math.floor(p * pts.length));
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = INK_W;
      ctx.strokeStyle = 'rgba(13,148,136,0.35)';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < upto; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      // "עט" מודגם
      const head = pts[Math.min(pts.length - 1, upto)];
      ctx.beginPath();
      ctx.arc(head.x, head.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#0f766e';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      if (p < 1) { demoRaf.current = requestAnimationFrame(step); }
      else { setTimeout(() => ctx.clearRect(0, 0, SIZE, SIZE), 350); }
    };
    demoRaf.current = requestAnimationFrame(step);
  };

  // אות חדשה: בונים מסכה, מציירים תבנית, מנגנים הדגמה
  useEffect(() => {
    if (!fontReady) return;
    maskRef.current = buildMask(letter);
    firstTryRef.current = true;
    firstPointRef.current = null;
    setFillPct(0);
    setHint(null);
    setHasInk(false);
    drawTemplate();
    inkRef.current!.getContext('2d')!.clearRect(0, 0, SIZE, SIZE);
    if (!hitRef.current) {
      hitRef.current = document.createElement('canvas');
      hitRef.current.width = SIZE; hitRef.current.height = SIZE;
    }
    hitRef.current.getContext('2d')!.clearRect(0, 0, SIZE, SIZE);
    playDemo();
    return () => { if (demoRaf.current) cancelAnimationFrame(demoRaf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter, fontReady]);

  const toCanvas = (e: React.PointerEvent): Pt => {
    const r = inkRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
  };

  const inside = (p: Pt): boolean => {
    const xi = Math.round(p.x), yi = Math.round(p.y);
    if (xi < 0 || yi < 0 || xi >= SIZE || yi >= SIZE) return false;
    return maskRef.current!.tolerant[yi * SIZE + xi] === 1;
  };

  const strokeTo = (p: Pt, begin: boolean) => {
    const onPath = inside(p);
    const ink = inkRef.current!.getContext('2d')!;
    ink.lineCap = 'round'; ink.lineJoin = 'round';
    ink.lineWidth = INK_W;
    ink.strokeStyle = onPath ? '#0d9488' : '#f97316'; // תכול על האות, כתום בחריגה
    ink.beginPath();
    const from = begin || !lastRef.current ? p : lastRef.current;
    ink.moveTo(from.x, from.y);
    ink.lineTo(p.x, p.y);
    ink.stroke();

    const hit = hitRef.current!.getContext('2d')!;
    hit.lineCap = 'round'; hit.lineJoin = 'round';
    hit.lineWidth = HIT_W;
    hit.strokeStyle = '#000';
    hit.beginPath();
    hit.moveTo(from.x, from.y);
    hit.lineTo(p.x, p.y);
    hit.stroke();

    lastRef.current = p;
  };

  const measure = (): { coverage: number; stray: number } => {
    const mask = maskRef.current!;
    const hit = hitRef.current!.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data;
    const ink = inkRef.current!.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data;
    let covered = 0, inkTotal = 0, inkOutside = 0;
    for (let i = 0; i < SIZE * SIZE; i++) {
      if (mask.glyph[i] && hit[i * 4 + 3] > 0) covered++;
      if (ink[i * 4 + 3] > 0) { inkTotal++; if (!mask.tolerant[i]) inkOutside++; }
    }
    return { coverage: covered / mask.glyphCount, stray: inkTotal ? inkOutside / inkTotal : 0 };
  };

  const evaluate = () => {
    const { coverage, stray } = measure();
    setFillPct(Math.round(coverage * 100));
    const fp = firstPointRef.current;
    const startedTop = !!fp && fp.y <= maskRef.current!.bboxTop + maskRef.current!.bboxHeight * 0.5;

    if (coverage >= COVER_PASS && stray <= STRAY_MAX && startedTop) {
      setDone(true);
      playCorrect();
      addLetterEvent(events.current, letter, true);
      const gained = firstTryRef.current ? 1 : 0;
      scoreRef.current += gained;
      setHint(null);
      setTimeout(() => {
        setDone(false);
        if (idx + 1 >= activity.letters.length) {
          playWin();
          onFinish({ score: scoreRef.current, max: activity.letters.length, letters: events.current });
        } else {
          setIdx(idx + 1);
        }
      }, 850);
      return;
    }
    // לא הצליח עדיין — משוב עדין, בלי לחסום
    firstTryRef.current = false;
    if (coverage >= COVER_PASS && !startedTop) {
      addLetterEvent(events.current, letter, false);
      setHint('כותבים מלמעלה למטה — התחילו בנקודה הירוקה 👆');
      setTimeout(clearInk, 950);
    } else if (coverage >= COVER_PASS && stray > STRAY_MAX) {
      setHint('כמעט! נסו להישאר על האות (הקו הכתום יצא החוצה).');
    } else {
      setHint('המשיכו לצייר על כל האות...');
    }
  };

  const events = useRef<LetterEvents>({});

  const clearInk = () => {
    inkRef.current!.getContext('2d')!.clearRect(0, 0, SIZE, SIZE);
    hitRef.current!.getContext('2d')!.clearRect(0, 0, SIZE, SIZE);
    firstPointRef.current = null;
    lastRef.current = null;
    setHasInk(false);
    setFillPct(0);
    setHint(null);
  };

  const barColor = fillPct >= COVER_PASS * 100 ? 'var(--green)' : fillPct > 30 ? 'var(--teal)' : '#94a3b8';

  return (
    <div style={{ textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
      <ProgressDots total={activity.letters.length} done={idx} />
      <p style={{ fontSize: 18, fontWeight: 700, margin: '4px 0 12px' }}>
        ציירו את האות <span className="agol-font" style={{ color: 'var(--teal)', fontSize: 30 }}>{letter}</span>
      </p>

      <div
        className="pop-in"
        key={letter}
        style={{
          position: 'relative',
          width: 'min(88vw, 340px)',
          aspectRatio: '1',
          margin: '0 auto',
          background: 'linear-gradient(160deg,#f4fbff,#e2f2fb)',
          border: '2px solid #a9d8ee',
          borderRadius: 22,
          boxShadow: done ? '0 0 0 4px var(--green-soft), var(--shadow-lg)' : 'var(--shadow-lg)',
          transition: 'box-shadow 0.25s',
          touchAction: 'none',
          overflow: 'hidden',
        }}
      >
        <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '26%', borderTop: '1.5px dashed #bcdff0' }} />
        <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: '20%', borderTop: '1.5px dashed #bcdff0' }} />
        <canvas ref={tplRef} width={SIZE} height={SIZE} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <canvas
          ref={inkRef}
          width={SIZE}
          height={SIZE}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
          onPointerDown={(e) => {
            if (done) return;
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* דפדפנים ישנים */ }
            const p = toCanvas(e);
            drawingRef.current = true;
            if (!firstPointRef.current) firstPointRef.current = p;
            lastRef.current = null;
            strokeTo(p, true);
            setHasInk(true);
            setHint(null);
          }}
          onPointerMove={(e) => {
            if (!drawingRef.current) return;
            strokeTo(toCanvas(e), false);
            setFillPct(Math.round(measure().coverage * 100));
          }}
          onPointerUp={() => { drawingRef.current = false; lastRef.current = null; evaluate(); }}
          onPointerCancel={() => { drawingRef.current = false; lastRef.current = null; }}
        />
        <canvas ref={demoRef} width={SIZE} height={SIZE} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        {done && (
          <div className="pop-in" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
            ✓
          </div>
        )}
      </div>

      {/* אחוז מילוי */}
      <div style={{ maxWidth: 300, margin: '14px auto 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 4 }}>
          <span>דיוק המילוי</span>
          <span style={{ fontWeight: 800, color: barColor }}>{fillPct}%</span>
        </div>
        <div style={{ height: 12, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${fillPct}%`, height: '100%', background: barColor, borderRadius: 999, transition: 'width 0.15s, background 0.2s' }} />
        </div>
      </div>

      <div style={{ minHeight: 26, marginTop: 8 }}>
        {hint && <p className="float-up" style={{ margin: 0, fontWeight: 700, color: 'var(--ink-soft)' }}>{hint}</p>}
        {done && <p className="float-up" style={{ margin: 0, fontWeight: 800, color: 'var(--green)' }}>יפה מאוד! ✍️</p>}
        {!fontReady && <p style={{ margin: 0, color: 'var(--ink-soft)' }}>טוען את כתב היד...</p>}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6 }}>
        <button className="pill" onClick={playDemo} style={{ cursor: 'pointer', padding: '8px 16px', fontSize: 14 }}>
          <RotateCcw size={15} /> ראו איך כותבים
        </button>
        <button className="pill" onClick={clearInk} disabled={!hasInk} style={{ cursor: hasInk ? 'pointer' : 'default', padding: '8px 16px', fontSize: 14, opacity: hasInk ? 1 : 0.5 }}>
          <Eraser size={15} /> נקו
        </button>
      </div>
    </div>
  );
}
