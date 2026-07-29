import React, { useState } from 'react';
import type { PaintActivity, ActivityResult, LetterEvents } from '../data/types';
import { addTextEvents } from '../lib/mastery';
import { ProgressDots } from './ui';
import { playCorrect, playWrong } from '../lib/sound';
import { forHandwriting } from '../data/nikud';

// ציור לפי הוראות: כל הוראה כתובה בכתב יד. צובעים משבצות ובודקים.

export default function Paint({
  activity,
  onFinish,
}: {
  activity: PaintActivity;
  onFinish: (r: ActivityResult) => void;
}) {
  const n = activity.gridSize;
  const [painted, setPainted] = useState<Set<string>>(new Set()); // תאים שאושרו משלבים קודמים
  const [current, setCurrent] = useState<Set<string>>(new Set()); // הצביעה של השלב הנוכחי
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [events] = useState<LetterEvents>({});
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null);

  const key = (r: number, c: number) => `${r},${c}`;
  const done = step >= activity.steps.length;
  const s = activity.steps[step];

  const toggle = (r: number, c: number) => {
    if (done || painted.has(key(r, c))) return;
    const k = key(r, c);
    setCurrent((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
    setFeedback(null);
  };

  const check = () => {
    const target = new Set(s.cells.map(([r, c]) => key(r, c)));
    const ok = target.size === current.size && [...current].every((k) => target.has(k));
    addTextEvents(events, s.text, ok);
    if (ok) {
      playCorrect();
      setPainted((prev) => new Set([...prev, ...current]));
      setCurrent(new Set());
      setScore((sc) => sc + 1);
      setFeedback('ok');
      const nextStep = step + 1;
      setTimeout(() => {
        setFeedback(null);
        setStep(nextStep);
        if (nextStep >= activity.steps.length) {
          setTimeout(
            () => onFinish({ score: score + 1, max: activity.steps.length, letters: events }),
            1400
          );
        }
      }, 700);
    } else {
      playWrong();
      setFeedback('bad');
    }
  };

  const cellSize = Math.min(46, Math.floor(320 / (n + 1)));

  return (
    <div style={{ textAlign: 'center' }}>
      <ProgressDots total={activity.steps.length} done={step} />
      {!done ? (
        <div
          className="agol-font pop-in"
          key={step}
          style={{
            fontSize: 30,
            background: 'linear-gradient(160deg,#f4fbff,#d7eefb)',
            border: '2px solid #a9d8ee',
            borderRadius: 14,
            padding: '14px 22px',
            display: 'inline-block',
            marginBottom: 16,
          }}
        >
          {forHandwriting(s.text)}
        </div>
      ) : (
        <div className="pop-in" style={{ fontSize: 30, marginBottom: 10 }}>
          הציור הושלם! {activity.revealEmoji} כל הכבוד!
        </div>
      )}
      <div style={{ display: 'inline-block', direction: 'rtl' }}>
        {/* כותרות טורים */}
        <div style={{ display: 'grid', gridTemplateColumns: `${cellSize}px repeat(${n}, ${cellSize}px)`, gap: 3 }}>
          <div />
          {Array.from({ length: n }, (_, c) => (
            <div key={c} style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
              {c + 1}
            </div>
          ))}
          {Array.from({ length: n }, (_, r) => (
            <React.Fragment key={r}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {r + 1}
              </div>
              {Array.from({ length: n }, (_, c) => {
                const k = key(r, c);
                const isPainted = painted.has(k);
                const isCurrent = current.has(k);
                return (
                  <button
                    key={c}
                    onClick={() => toggle(r, c)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 6,
                      border: '2px solid #e2e8f0',
                      background: isPainted ? 'var(--violet)' : isCurrent ? '#a78bfa' : '#fff',
                      cursor: isPainted ? 'default' : 'pointer',
                      transition: 'background 0.15s',
                    }}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      {!done && (
        <div style={{ marginTop: 16 }}>
          {feedback === 'bad' && (
            <p className="shake" style={{ color: 'var(--red)', fontWeight: 700 }}>
              לא בדיוק... קראו שוב את ההוראה ונסו לתקן
            </p>
          )}
          {feedback === 'ok' && (
            <p className="float-up" style={{ color: 'var(--green)', fontWeight: 700 }}>מדויק! 🎨</p>
          )}
          <button className="btn" onClick={check} disabled={current.size === 0}>
            בדיקת השלב ✓
          </button>
        </div>
      )}
    </div>
  );
}
