import React, { useCallback, useEffect, useRef, useState } from 'react';
import { loadSession, saveSession, fetchProgress, type StudentSession, type ProgressData } from './lib/api';
import Landing from './views/Landing';
import Join from './views/Join';
import JourneyMap from './views/JourneyMap';
import UnitView from './views/UnitView';
import PlayView from './views/PlayView';
import ProgressView from './views/ProgressView';
import Teacher from './views/Teacher';
import PathEdit from './views/PathEdit';
import TraceEdit from './views/TraceEdit';
import { trackPage } from './lib/analytics';
import { NikudProvider } from './lib/NikudContext';

// ניתוב מבוסס hash — עובד בכל אחסון סטטי בלי הגדרות שרת.

function useHash(): string {
  const [hash, setHash] = useState(window.location.hash || '#/');
  useEffect(() => {
    const fn = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return hash;
}

export function nav(to: string) {
  window.location.hash = to;
}

export default function App() {
  const hash = useHash();

  // צפיית עמוד וירטואלית בכל מעבר מסך.
  // מדלגים על הריצה הראשונה — gtag config כבר שלח את צפיית הכניסה.
  const firstView = useRef(true);
  useEffect(() => {
    if (firstView.current) { firstView.current = false; return; }
    trackPage(hash);
  }, [hash]);

  const [session, setSession] = useState<StudentSession | null>(loadSession());
  const [progress, setProgress] = useState<ProgressData>({ letters: {}, completed: {} });

  const refreshProgress = useCallback(async () => {
    if (!session) return;
    try {
      setProgress(await fetchProgress(session));
    } catch {
      // שרת לא זמין — ממשיכים עם מה שיש
    }
  }, [session]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  // סנכרון סשן מ-localStorage (למשל תצוגת מורה שנפתחת מלוח המורה)
  useEffect(() => {
    const sync = () => setSession(loadSession());
    window.addEventListener('agol-session', sync);
    return () => window.removeEventListener('agol-session', sync);
  }, []);

  const logout = (to = '/') => {
    saveSession(null);
    setSession(null);
    nav(to);
  };

  const parts = hash.replace(/^#\//, '').split('/').filter(Boolean);
  const route = parts[0] || '';

  let view: React.ReactNode;
  if (route === 'path-edit') {
    view = <PathEdit />;
  } else if (route === 'trace-edit') {
    view = <TraceEdit />;
  } else if (route === 'teacher') {
    view = <Teacher />;
  } else if (route === 'join') {
    const joinCode = parts[1] || '';
    view = (
      <Join
        initialCode={joinCode}
        onJoined={(s) => { setSession(s); nav('/map'); }}
      />
    );
  } else if (!session) {
    view = <Landing />;
  } else if (route === 'map' || route === '') {
    view = (
      <JourneyMap
        session={session}
        progress={progress}
        onLogout={logout}
        onSessionChange={(s) => { setSession(s); }}
      />
    );
  } else if (route === 'unit' && parts[1]) {
    view = <UnitView unitId={parts[1]} progress={progress} session={session} onReported={refreshProgress} />;
  } else if (route === 'play' && parts[1] && parts[2]) {
    view = (
      <PlayView
        unitId={parts[1]}
        activityId={parts[2]}
        session={session}
        onReported={refreshProgress}
      />
    );
  } else if (route === 'progress') {
    view = <ProgressView session={session} progress={progress} />;
  } else {
    view = <Landing />;
  }

  return (
    <NikudProvider>
      <div style={{ minHeight: '100vh' }}>{view}</div>
    </NikudProvider>
  );
}
