import React, { useState } from 'react';
import type { QuizActivity, ActivityResult, LetterEvents } from '../data/types';
import { addTextEvents, addLetterEvent } from '../lib/mastery';
import { uniqueLetters } from '../data/letters';
import { ProgressDots, AgolCard } from './ui';
import { playCorrect, playWrong } from '../lib/sound';

export default function Quiz({
  activity,
  onFinish,
}: {
  activity: QuizActivity;
  onFinish: (r: ActivityResult) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [events] = useState<LetterEvents>({});
  const [shakeKey, setShakeKey] = useState(0);

  const q = activity.questions[idx];
  const done = idx >= activity.questions.length;

  const choose = (i: number) => {
    if (chosen !== null) return;
    const ok = i === q.correct;
    setChosen(i);
    if (ok) playCorrect();
    else playWrong();
    if (!ok) setShakeKey((k) => k + 1);
    const targets = q.targetLetters ?? (q.agolText ? uniqueLetters(q.agolText) : []);
    for (const l of targets) addLetterEvent(events, l, ok);
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setChosen(null);
      if (idx + 1 >= activity.questions.length) {
        onFinish({ score: score + (ok ? 1 : 0), max: activity.questions.length, letters: events });
      } else {
        setIdx(idx + 1);
      }
    }, ok ? 800 : 1600);
  };

  if (done) return null;

  return (
    <div style={{ textAlign: 'center' }}>
      <ProgressDots total={activity.questions.length} done={idx} />
      <p style={{ fontSize: 18, fontWeight: 500 }}>{q.prompt}</p>
      {q.agolText && (
        <div key={idx} style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 22px' }}>
          <AgolCard text={q.agolText} size={q.agolText.length > 6 ? 40 : 58} />
        </div>
      )}
      <div
        key={shakeKey ? `s${shakeKey}` : `q${idx}`}
        className={chosen !== null && chosen !== q.correct ? 'shake' : ''}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}
      >
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
              style={{
                background: bg,
                border: `2px solid ${border}`,
                borderRadius: 14,
                padding: '14px 26px',
                fontSize: 22,
                fontWeight: 700,
                minWidth: 110,
                transition: 'all 0.15s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {chosen !== null && chosen !== q.correct && (
        <p className="float-up" style={{ color: 'var(--red)', fontWeight: 700 }}>
          התשובה הנכונה: {q.options[q.correct]}
        </p>
      )}
      {chosen !== null && chosen === q.correct && (
        <p className="float-up" style={{ color: 'var(--green)', fontWeight: 700 }}>יפה מאוד! 🎉</p>
      )}
    </div>
  );
}
