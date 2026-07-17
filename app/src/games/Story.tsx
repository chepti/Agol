import React, { useRef, useState } from 'react';
import type { StoryActivity, ActivityResult, LetterEvents } from '../data/types';
import { addLetterEvent } from '../lib/mastery';
import { uniqueLetters, LETTERS } from '../data/letters';
import { ProgressDots } from './ui';
import { playCorrect, playWrong } from '../lib/sound';

// סיפור עם קו מפריד נגרר: מימין לקו — כתב רגיל, משמאלו — כתב רש"י.
// (שחזור של רכיב ה"השוואה" מהאתר המקורי, בלי תמונות — טקסט חי)

const HARD = new Set(LETTERS.filter((l) => l.hard).map((l) => l.ch));

export default function Story({
  activity,
  onFinish,
}: {
  activity: StoryActivity;
  onFinish: (r: ActivityResult) => void;
}) {
  // ברירת מחדל: הקו קרוב לימין — רוב הטקסט מוצג בכתב רש"י, מציצים בכתב רגיל רק בקצה
  const [pos, setPos] = useState(0.82); // מיקום הקו, 0=שמאל 1=ימין (יחסי לרוחב)
  const [phase, setPhase] = useState<'read' | 'quiz'>('read');
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [events] = useState<LetterEvents>({});
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePos = (clientX: number) => {
    const rect = boxRef.current!.getBoundingClientRect();
    setPos(Math.max(0.03, Math.min(0.97, (clientX - rect.left) / rect.width)));
  };

  const storyHardLetters = uniqueLetters(activity.paragraphs.join(' ')).filter((l) => HARD.has(l));

  // כל פסקה מרונדרת פעמיים באותה משבצת (grid stacking) — כך הפסקאות
  // מיושרות זו מול זו והחשיפה של הכתב הרגיל נעשית בחיתוך לכל פסקה בנפרד.
  const LINE_H = 2.1;
  const paragraphRow = (text: string, i: number) => (
    <div key={i} style={{ display: 'grid', marginBottom: 14 }}>
      <p
        className="agol-font"
        style={{ gridArea: '1 / 1', margin: 0, padding: '0 28px', fontSize: 25, lineHeight: LINE_H }}
      >
        {text}
      </p>
      <p
        style={{
          gridArea: '1 / 1',
          margin: 0,
          padding: '0 28px',
          fontSize: 20,
          fontWeight: 500,
          lineHeight: (25 * LINE_H) / 20, // אותו גובה שורה בפיקסלים כמו שכבת הרש"י
          background: '#fff',
          clipPath: `inset(0 0 0 ${pos * 100}%)`,
        }}
      >
        {text}
      </p>
    </div>
  );

  if (phase === 'quiz') {
    const q = activity.questions[qIdx];
    const choose = (i: number) => {
      if (chosen !== null) return;
      const ok = i === q.correct;
      setChosen(i);
      if (ok) playCorrect();
      else playWrong();
      if (ok) {
        setScore((s) => s + 1);
        // קריאה מוצלחת = חיזוק לאותיות הקשות שמופיעות בסיפור
        storyHardLetters.forEach((l) => addLetterEvent(events, l, true));
      }
      setTimeout(() => {
        setChosen(null);
        if (qIdx + 1 >= activity.questions.length) {
          onFinish({ score: score + (ok ? 1 : 0), max: activity.questions.length, letters: events });
        } else {
          setQIdx(qIdx + 1);
        }
      }, ok ? 800 : 1600);
    };
    return (
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ marginBottom: 6 }}>שאלות על מה שקראתם</h3>
        <ProgressDots total={activity.questions.length} done={qIdx} />
        <p style={{ fontSize: 19, fontWeight: 700 }}>{q.prompt}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 460, margin: '0 auto' }}>
          {q.options.map((opt, i) => {
            let bg = '#fff';
            let border = '#e2e8f0';
            if (chosen !== null) {
              if (i === q.correct) { bg = 'var(--green-soft)'; border = 'var(--green)'; }
              else if (i === chosen) { bg = 'var(--red-soft)'; border = 'var(--red)'; }
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                className={chosen === i && i !== q.correct ? 'shake' : ''}
                style={{
                  background: bg,
                  border: `2px solid ${border}`,
                  borderRadius: 12,
                  padding: '12px 18px',
                  fontSize: 17,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={boxRef}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          updatePos(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && updatePos(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        style={{
          position: 'relative',
          background: 'linear-gradient(160deg,#fffdf5,#fdf6e3)',
          border: '2px solid #e7d9b0',
          borderRadius: 18,
          overflow: 'hidden',
          touchAction: 'none',
          cursor: 'col-resize',
          userSelect: 'none',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ padding: '24px 0' }}>
          {activity.paragraphs.map((p, i) => paragraphRow(p, i))}
        </div>
        {/* הקו המפריד */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pos * 100}%`,
            width: 4,
            marginLeft: -2,
            background: 'var(--teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--teal)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              flexShrink: 0,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            ⇄
          </div>
        </div>
      </div>
      <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14 }}>
        גררו את הקו: שמאלה — יותר כתב יד, ימינה — יותר דפוס
      </p>
      <div style={{ textAlign: 'center' }}>
        <button className="btn" onClick={() => setPhase('quiz')}>
          קראתי! לשאלות ←
        </button>
      </div>
    </div>
  );
}
