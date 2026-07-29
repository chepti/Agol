import type { LetterEvents } from '../data/types';

// שכבת תקשורת: מול השרת (PHP) כשהתלמיד מחובר לכיתה,
// ומצב "אורח" (localStorage בלבד) כשמתרגלים בלי קוד כיתה.

const API = '/agol/api';

export interface StudentSession {
  token: string;       // 'guest' במצב אורח
  nickname: string;
  emoji: string;       // "הסיסמה הקטנה" — מזהה את התלמיד יחד עם השם
  classId?: number;
  className?: string;
  freeNav?: boolean;   // מסלול חופשי (ללא נעילת פעילויות)
}

export interface ProgressData {
  letters: Record<string, { c: number; w: number }>;
  completed: Record<string, { score: number; max: number }>; // לפי activity id
  freeNav?: boolean;
}

const LS_SESSION = 'agol_session';

/** התקדמות אורח נשמרת לפי שם+אימוג'י — כמה תלמידים יכולים לחלוק מחשב */
function guestKey(s: StudentSession): string {
  return `agol_guest_${s.nickname}_${s.emoji}`;
}

export function loadSession(): StudentSession | null {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: StudentSession | null): void {
  if (s) localStorage.setItem(LS_SESSION, JSON.stringify(s));
  else localStorage.removeItem(LS_SESSION);
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'שגיאת שרת');
  return data as T;
}

async function get<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'שגיאת שרת');
  return data as T;
}

// ─── תלמיד ───

export async function joinClass(code: string, nickname: string, emoji: string): Promise<StudentSession> {
  const r = await post<{ token: string; classId: number; className: string; freeNav: boolean }>(
    'student.php?a=join',
    { code, nickname, emoji }
  );
  const s: StudentSession = {
    token: r.token, nickname, emoji,
    classId: r.classId, className: r.className, freeNav: r.freeNav,
  };
  saveSession(s);
  return s;
}

export function guestSession(nickname: string, emoji: string): StudentSession {
  const s: StudentSession = { token: 'guest', nickname, emoji };
  saveSession(s);
  return s;
}

/** תצוגת מורה — כל השלבים פתוחים, בלי נעילה, נשמר מקומית בלבד */
export function teacherPreviewSession(): StudentSession {
  const s: StudentSession = {
    token: 'teacher-preview',
    nickname: 'מורה',
    emoji: '👩‍🏫',
    freeNav: true,
  };
  saveSession(s);
  return s;
}

export function isLocalSession(s: StudentSession): boolean {
  return s.token === 'guest' || s.token === 'teacher-preview';
}

/** אורח: הפעלת/כיבוי מסלול חופשי — נשמר בסשן */
export function setGuestFreeNav(s: StudentSession, free: boolean): StudentSession {
  const next = { ...s, freeNav: free };
  saveSession(next);
  return next;
}

function loadGuestProgress(s: StudentSession): ProgressData {
  try {
    const raw = localStorage.getItem(guestKey(s));
    const p = raw ? JSON.parse(raw) : { letters: {}, completed: {} };
    // מסלול חופשי — לפי בחירת אורח/מורה בסשן
    p.freeNav = !!s.freeNav;
    return p;
  } catch {
    return {
      letters: {},
      completed: {},
      freeNav: !!s.freeNav,
    };
  }
}

export async function fetchProgress(s: StudentSession): Promise<ProgressData> {
  if (isLocalSession(s)) return loadGuestProgress(s);
  return get<ProgressData>('student.php?a=progress', s.token);
}

export async function reportAttempt(
  s: StudentSession,
  activityId: string,
  unitId: string,
  score: number,
  max: number,
  letters: LetterEvents
): Promise<void> {
  if (isLocalSession(s)) {
    const p = loadGuestProgress(s);
    for (const [l, e] of Object.entries(letters)) {
      if (!p.letters[l]) p.letters[l] = { c: 0, w: 0 };
      p.letters[l].c += e.c;
      p.letters[l].w += e.w;
    }
    const prev = p.completed[activityId];
    if (!prev || score / max > prev.score / prev.max) {
      p.completed[activityId] = { score, max };
    }
    delete p.freeNav; // לא שומרים את הדגל בתוך ההתקדמות
    localStorage.setItem(guestKey(s), JSON.stringify(p));
    return;
  }
  await post('student.php?a=attempt', { activityId, unitId, score, max, letters }, s.token);
}

// ─── מורה ───

export interface TeacherSession {
  token: string;
  name: string;
  email: string;
}

const LS_TEACHER = 'agol_teacher';

export function loadTeacher(): TeacherSession | null {
  try {
    const raw = localStorage.getItem(LS_TEACHER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTeacher(t: TeacherSession | null): void {
  if (t) localStorage.setItem(LS_TEACHER, JSON.stringify(t));
  else localStorage.removeItem(LS_TEACHER);
}

export async function teacherRegister(name: string, email: string, password: string): Promise<TeacherSession> {
  const r = await post<{ token: string; name: string; email: string }>('teacher.php?a=register', {
    name,
    email,
    password,
  });
  saveTeacher(r);
  return r;
}

export async function teacherLogin(email: string, password: string): Promise<TeacherSession> {
  const r = await post<{ token: string; name: string; email: string }>('teacher.php?a=login', {
    email,
    password,
  });
  saveTeacher(r);
  return r;
}

export interface ClassInfo {
  id: number;
  name: string;
  code: string;
  freeNav: boolean;
  students: number;
}

export async function setClassFree(t: TeacherSession, classId: number, free: boolean): Promise<void> {
  await post('teacher.php?a=set_free', { classId, free }, t.token);
}

export async function fetchClasses(t: TeacherSession): Promise<ClassInfo[]> {
  const r = await get<{ classes: ClassInfo[] }>('teacher.php?a=classes', t.token);
  return r.classes;
}

export async function createClass(t: TeacherSession, name: string): Promise<ClassInfo> {
  return post<ClassInfo>('teacher.php?a=create_class', { name }, t.token);
}

export interface HeatmapStudent {
  id: number;
  nickname: string;
  emoji: string;
  lastSeen: string | null;
  activitiesDone: number;
  letters: Record<string, { c: number; w: number }>;
}

export async function fetchHeatmap(t: TeacherSession, classId: number): Promise<HeatmapStudent[]> {
  const r = await get<{ students: HeatmapStudent[] }>(`teacher.php?a=heatmap&class=${classId}`, t.token);
  return r.students;
}
