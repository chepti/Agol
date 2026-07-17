import React, { useEffect, useRef, useState } from 'react';
import type { TraceActivity, ActivityResult, LetterEvents } from '../data/types';
import { addLetterEvent } from '../lib/mastery';
import { playCorrect, playWrong } from '../lib/sound';
import { ProgressDots } from './ui';

// עקיבה על אות בכתב יד: מציירים עם אצבע/עכבר על תבנית האות.
// בודקים: התחלה למעלה (כיוון כתיבה נכון), כיסוי של כל האות, ודיוק (לא לצאת מהקווים).

const SIZE = 320;          // גודל הקנבס בפיקסלים
const FONT_PX = 230;       // גודל האות
const INK_W = 16;          // עובי קו הציור
const HIT_W = 40;          // עובי הקו לחישוב כיסוי (סלחני)
const COVER_PASS = 0.72;   // אחוז האות שצריך לכסות
const OUTSIDE_MAX = 0.42;  // כמה מהציור מותר שיהיה מחוץ לאות (עם שוליים)

interface Mask {
  glyph: Uint8Array;      // פיקסלים של האות עצמה
  tolerant: Uint8Array;   // האות + שוליים — לבדיקה "בתוך הקווים"
  glyphCount: number;
  bboxTop: number;
  bboxHeight: number;
  start: { x: number; y: number }; // הנקודה הירוקה — למעלה, בצד ימין של האות
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

  // מסכה סלחנית: אותה אות עם קו-מתאר עבה
  ctx.lineWidth = 30;
  ctx.strokeText(letter, SIZE / 2, SIZE / 2 + 8);
  const t = ctx.getImageData(0, 0, SIZE, SIZE).data;

  const glyph = new Uint8Array(SIZE * SIZE);
  const tolerant = new Uint8Array(SIZE * SIZE);
  let glyphCount = 0;
  let top = SIZE, bottom = 0;
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (g[i * 4 + 3] > 60) {
      glyph[i] = 1;
      glyphCount++;
      const y = Math.floor(i / SIZE);
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
    if (t[i * 4 + 3] > 30) tolerant[i] = 1;
  }

  // נקודת התחלה: בשליש העליון של האות, הפיקסל הימני ביותר (כותבים מימין ולמעלה)
  let start = { x: SIZE / 2, y: top + 8 };
  const bandEnd = top + Math.max(10, Math.round((bottom - top) * 0.18));
  let bestX = -1;
  for (let y = top; y <= bandEnd; y++) {
    for (let x = SIZE - 1; x >= 0; x--) {
      if (glyph[y * SIZE + x]) { if (x > bestX) { bestX = x; start = { x, y }; } break; }
    }
  }
  return { glyph, tolerant, glyphCount, bboxTop: top, bboxHeight: Math.max(1, bottom - top), start };
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
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'hint'; text: string } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [score, setScore] = useState(0);
  const [events] = useState<LetterEvents>({});

  const maskRef = useRef<Mask | null>(null);
  const firstTryRef = useRef(true);
  const firstPointRef = useRef<{ x: number; y: number } | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const tplRef = useRef<HTMLCanvasElement>(null);   // תבנית האות
  const inkRef = useRef<HTMLCanvasElement>(null);   // הציור של הילד
  const hitRef = useRef<HTMLCanvasElement | null>(null); // קו רחב לחישוב כיסוי

  const letter = activity.letters[idx];

  useEffect(() => {
    let alive = true;
    document.fonts.load(`600 ${FONT_PX}px Agol`).then(() => alive && setFontReady(true));
    return () => { alive = false; };
  }, []);

  // ציור התבנית + איפוס בכל אות
  useEffect(() => {
    if (!fontReady) return;
    maskRef.current = buildMask(letter);
    firstTryRef.current = true;
    firstPointRef.current = null;
    setFeedback(null);
    setHasInk(false);

    const tpl = tplRef.current!;
    const ctx = tpl.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    // האות — אפורה בהירה
    ctx.font = `600 ${FONT_PX}px Agol`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ddd5c2';
    ctx.fillText(letter, SIZE / 2, SIZE / 2 + 8);
    // הנקודה הירוקה — כאן מתחילים
    const s = maskRef.current.start;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#16a34a';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    const ink = inkRef.current!.getContext('2d')!;
    ink.clearRect(0, 0, SIZE, SIZE);
    if (!hitRef.current) {
      hitRef.current = document.createElement('canvas');
      hitRef.current.width = SIZE;
      hitRef.current.height = SIZE;
    }
    hitRef.current.getContext('2d')!.clearRect(0, 0, SIZE, SIZE);
  }, [letter, fontReady]);

  const toCanvas = (e: React.PointerEvent): { x: number; y: number } => {
    const r = inkRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * SIZE,
      y: ((e.clientY - r.top) / r.height) * SIZE,
    };
  };

  const strokeTo = (p: { x: number; y: number }, begin: boolean) => {
    const cfg = [
      { ctx: inkRef.current!.getContext('2d')!, w: INK_W, color: '#0d9488' },
      { ctx: hitRef.current!.getContext('2d')!, w: HIT_W, color: '#000' },
    ];
    for (const { ctx, w, color } of cfg) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = w;
      ctx.strokeStyle = color;
      ctx.beginPath();
      const from = begin || !lastRef.current ? p : lastRef.current;
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    lastRef.current = p;
  };

  const clearInk = () => {
    inkRef.current!.getContext('2d')!.clearRect(0, 0, SIZE, SIZE);
    hitRef.current!.getContext('2d')!.clearRect(0, 0, SIZE, SIZE);
    firstPointRef.current = null;
    setHasInk(false);
    setFeedback(null);
  };

  const check = () => {
    const mask = maskRef.current!;
    const hit = hitRef.current!.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data;
    const ink = inkRef.current!.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data;

    let covered = 0, inkTotal = 0, inkOutside = 0;
    for (let i = 0; i < SIZE * SIZE; i++) {
      if (mask.glyph[i] && hit[i * 4 + 3] > 0) covered++;
      if (ink[i * 4 + 3] > 0) {
        inkTotal++;
        if (!mask.tolerant[i]) inkOutside++;
      }
    }
    const coverage = covered / mask.glyphCount;
    const outside = inkTotal ? inkOutside / inkTotal : 1;
    const fp = firstPointRef.current;
    const startedTop = !!fp && fp.y <= mask.bboxTop + mask.bboxHeight * 0.5;

    if (!startedTop) {
      playWrong();
      addLetterEvent(events, letter, false);
      firstTryRef.current = false;
      setFeedback({ kind: 'hint', text: 'כותבים מלמעלה למטה — התחילו בנקודה הירוקה! נקו ונסו שוב.' });
      return;
    }
    if (coverage < COVER_PASS) {
      playWrong();
      addLetterEvent(events, letter, false);
      firstTryRef.current = false;
      setFeedback({ kind: 'hint', text: 'כמעט! עברו על כל חלקי האות, מההתחלה ועד הסוף.' });
      return;
    }
    if (outside > OUTSIDE_MAX) {
      playWrong();
      addLetterEvent(events, letter, false);
      firstTryRef.current = false;
      setFeedback({ kind: 'hint', text: 'נסו לדייק יותר על האות — נקו ונסו שוב.' });
      return;
    }

    playCorrect();
    addLetterEvent(events, letter, true);
    const gained = firstTryRef.current ? 1 : 0;
    setScore((s) => s + gained);
    setFeedback({ kind: 'ok', text: 'מצוין! ✍️' });
    setTimeout(() => {
      if (idx + 1 >= activity.letters.length) {
        onFinish({ score: score + gained, max: activity.letters.length, letters: events });
      } else {
        setIdx(idx + 1);
      }
    }, 900);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <ProgressDots total={activity.letters.length} done={idx} />
      <p style={{ fontSize: 17, fontWeight: 700, margin: '4px 0 10px' }}>
        עקבו על האות <span style={{ color: 'var(--teal)', fontSize: 24 }}>{letter}</span> — מתחילים בנקודה הירוקה
      </p>
      <div
        style={{
          position: 'relative',
          width: 'min(86vw, 320px)',
          aspectRatio: '1',
          margin: '0 auto',
          background: 'linear-gradient(160deg,#fffdf5,#fdf6e3)',
          border: '2px solid #e7d9b0',
          borderRadius: 20,
          boxShadow: 'var(--shadow)',
          touchAction: 'none',
          overflow: 'hidden',
        }}
      >
        {/* קווי מחברת עדינים */}
        <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '26%', borderTop: '1.5px dashed #d8cba4' }} />
        <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: '20%', borderTop: '1.5px dashed #d8cba4' }} />
        <canvas ref={tplRef} width={SIZE} height={SIZE} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <canvas
          ref={inkRef}
          width={SIZE}
          height={SIZE}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* דפדפנים ישנים */ }
            const p = toCanvas(e);
            drawingRef.current = true;
            if (!firstPointRef.current) firstPointRef.current = p;
            lastRef.current = null;
            strokeTo(p, true);
            setHasInk(true);
          }}
          onPointerMove={(e) => {
            if (!drawingRef.current) return;
            strokeTo(toCanvas(e), false);
          }}
          onPointerUp={() => { drawingRef.current = false; lastRef.current = null; }}
          onPointerCancel={() => { drawingRef.current = false; lastRef.current = null; }}
        />
      </div>

      <div style={{ minHeight: 30, marginTop: 10 }}>
        {feedback && (
          <p
            className={feedback.kind === 'ok' ? 'float-up' : 'shake'}
            style={{ margin: 0, fontWeight: 700, color: feedback.kind === 'ok' ? 'var(--green)' : 'var(--red)' }}
          >
            {feedback.text}
          </p>
        )}
        {!fontReady && <p style={{ margin: 0, color: 'var(--ink-soft)' }}>טוען את כתב היד...</p>}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6 }}>
        <button className="btn secondary" onClick={clearInk} disabled={!hasInk}>
          ↻ נקו
        </button>
        <button className="btn" onClick={check} disabled={!hasInk || feedback?.kind === 'ok'}>
          בדיקה ✓
        </button>
      </div>
    </div>
  );
}
