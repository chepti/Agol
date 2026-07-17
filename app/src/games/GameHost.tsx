import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import type { Activity, ActivityResult } from '../data/types';
import Intro from './Intro';
import Quiz from './Quiz';
import Flashcards from './Flashcards';
import WordSearch from './WordSearch';
import Match from './Match';
import Memory from './Memory';
import Story from './Story';
import Order from './Order';
import Paint from './Paint';
import { Stars, starsFor } from './ui';
import { playWin } from '../lib/sound';

export default function GameHost({
  activity,
  onDone,
}: {
  activity: Activity;
  onDone: (r: ActivityResult) => void;
}) {
  const [result, setResult] = useState<ActivityResult | null>(null);

  const finish = (r: ActivityResult) => {
    setResult(r);
    playWin();
    const stars = starsFor(r.score, r.max);
    confetti({
      particleCount: stars === 3 ? 160 : stars === 2 ? 90 : 40,
      spread: stars === 3 ? 100 : 70,
      origin: { y: 0.6 },
      colors: ['#0f766e', '#d97706', '#7c3aed', '#dc2626', '#16a34a'],
    });
  };

  if (result) {
    const stars = starsFor(result.score, result.max);
    return (
      <div className="card pop-in" style={{ textAlign: 'center', maxWidth: 460, margin: '40px auto' }}>
        <h2 style={{ fontSize: 26 }}>
          {stars === 3 ? 'מושלם! 🏅' : stars === 2 ? 'יפה מאוד!' : 'כל הכבוד שסיימתם!'}
        </h2>
        <Stars n={stars} />
        <p style={{ fontSize: 18, color: 'var(--ink-soft)' }}>
          {result.score} מתוך {result.max}
        </p>
        {stars < 3 && (
          <p style={{ fontSize: 15, color: 'var(--ink-soft)' }}>אפשר לחזור על הפעילות בכל שלב כדי להשתפר ⭐</p>
        )}
        <button className="btn" onClick={() => onDone(result)}>
          המשך במסע ←
        </button>
      </div>
    );
  }

  const game = () => {
    switch (activity.type) {
      case 'intro': return <Intro activity={activity} onFinish={finish} />;
      case 'quiz': return <Quiz activity={activity} onFinish={finish} />;
      case 'flashcards': return <Flashcards activity={activity} onFinish={finish} />;
      case 'wordsearch': return <WordSearch activity={activity} onFinish={finish} />;
      case 'match': return <Match activity={activity} onFinish={finish} />;
      case 'memory': return <Memory activity={activity} onFinish={finish} />;
      case 'story': return <Story activity={activity} onFinish={finish} />;
      case 'order': return <Order activity={activity} onFinish={finish} />;
      case 'paint': return <Paint activity={activity} onFinish={finish} />;
    }
  };

  return (
    <div className="float-up">
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 24 }}>{activity.title}</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 16, maxWidth: 560, margin: '8px auto 0', lineHeight: 1.6 }}>
          {activity.instructions}
        </p>
      </div>
      {game()}
    </div>
  );
}
