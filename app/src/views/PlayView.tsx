import React from 'react';
import { UNITS } from '../data/units';
import GameHost from '../games/GameHost';
import { reportAttempt, type StudentSession } from '../lib/api';
import type { ActivityResult } from '../data/types';
import { nav } from '../App';
import { SoftPageShell } from '../ui/PageShell';
import { FeedbackButton } from '../ui/Feedback';

export default function PlayView({
  unitId,
  activityId,
  session,
  onReported,
}: {
  unitId: string;
  activityId: string;
  session: StudentSession;
  onReported: () => void;
}) {
  const showFeedback = session.token === 'guest' || session.token === 'teacher-preview';
  const unit = UNITS.find((u) => u.id === unitId);
  const activity = unit?.activities.find((a) => a.id === activityId);
  if (!unit || !activity) {
    nav('/map');
    return null;
  }

  const done = async (r: ActivityResult) => {
    try {
      await reportAttempt(session, activity.id, unit.id, r.score, r.max, r.letters);
    } catch {
      // גם אם הדיווח נכשל — לא חוסמים את הילד
    }
    onReported();
    sessionStorage.setItem('agol_focus_act', activity.id);
    nav('/map');
  };

  const wide =
    activity.type === 'bubbles' ||
    activity.type === 'memory' ||
    activity.type === 'match' ||
    activity.type === 'intro' ||
    activity.type === 'wordsearch' ||
    activity.type === 'order' ||
    activity.type === 'paint';

  return (
    <SoftPageShell seed={activity.id}>
      <div style={{ maxWidth: wide ? 1120 : 820, margin: '0 auto', padding: '16px 20px 60px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <button
            className="btn small"
            style={{ background: 'transparent', boxShadow: 'none', color: 'var(--teal-dark)', fontWeight: 700 }}
            onClick={() => {
              sessionStorage.setItem('agol_focus_act', activity.id);
              nav('/map');
            }}
          >
            → חזרה למפת המסע
          </button>
          {showFeedback && <FeedbackButton compact />}
        </div>
        <GameHost key={activity.id} activity={activity} onDone={done} />
      </div>
    </SoftPageShell>
  );
}
