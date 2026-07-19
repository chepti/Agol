// צלילי משוב קטנים — מסונתזים ב-WebAudio, בלי קבצים חיצוניים.
// מופעל כברירת מחדל; העדפת השתקה נשמרת במכשיר.

const LS_SOUND = 'agol_sound';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function soundEnabled(): boolean {
  return localStorage.getItem(LS_SOUND) !== 'off';
}

export function toggleSound(): boolean {
  const next = !soundEnabled();
  localStorage.setItem(LS_SOUND, next ? 'on' : 'off');
  return next;
}

function note(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = 'sine',
  peak = 0.18
): void {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// כמה גרסאות של צליל הצלחה — נבחרת אחת אקראית כדי שלא יימאס
const CORRECT_VARIANTS: Array<Array<[number, number, number, OscillatorType]>> = [
  [[660, 0, 0.16, 'sine'], [880, 0.09, 0.22, 'sine']],                       // דינג עולה
  [[523, 0, 0.12, 'triangle'], [659, 0.08, 0.12, 'triangle'], [784, 0.16, 0.2, 'triangle']], // שלשה עולה
  [[784, 0, 0.13, 'sine'], [1046, 0.08, 0.24, 'sine']],                      // נצנוץ גבוה
  [[587, 0, 0.14, 'triangle'], [880, 0.09, 0.2, 'sine']],                    // קווינטה
  [[880, 0, 0.09, 'sine'], [784, 0.07, 0.09, 'sine'], [1046, 0.14, 0.22, 'sine']], // סלסול
];

/** תשובה נכונה — צליל עולה, מתחלף אקראית */
export function playCorrect(): void {
  if (!soundEnabled()) return;
  const v = CORRECT_VARIANTS[Math.floor(Math.random() * CORRECT_VARIANTS.length)];
  v.forEach(([f, t, d, type]) => note(f, t, d, type, 0.16));
}

/** טעות — באזז רך ונמוך */
export function playWrong(): void {
  if (!soundEnabled()) return;
  note(196, 0, 0.2, 'triangle', 0.14);
  note(147, 0.1, 0.25, 'triangle', 0.12);
}

// שתי פנפרות שונות לסיום פעילות
const WIN_VARIANTS: number[][] = [
  [523, 659, 784, 1047],
  [587, 740, 880, 1175],
  [523, 784, 659, 1047],
];

/** סיום פעילות — פנפרה קצרה, מתחלפת */
export function playWin(): void {
  if (!soundEnabled()) return;
  const seq = WIN_VARIANTS[Math.floor(Math.random() * WIN_VARIANTS.length)];
  seq.forEach((f, i) => note(f, i * 0.11, 0.3, 'triangle', 0.17));
  note(seq[3] * 1.26, 0.46, 0.5, 'sine', 0.12);
}

/** קליק קטן (הפיכת קלף, בחירה) */
export function playTap(): void {
  if (!soundEnabled()) return;
  note(520, 0, 0.07, 'sine', 0.08);
}
