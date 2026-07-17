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

/** תשובה נכונה — דינג עולה קטן */
export function playCorrect(): void {
  if (!soundEnabled()) return;
  note(660, 0, 0.16, 'sine', 0.16);
  note(880, 0.09, 0.22, 'sine', 0.16);
}

/** טעות — באזז רך ונמוך */
export function playWrong(): void {
  if (!soundEnabled()) return;
  note(196, 0, 0.2, 'triangle', 0.14);
  note(147, 0.1, 0.25, 'triangle', 0.12);
}

/** סיום פעילות — פנפרה קצרה */
export function playWin(): void {
  if (!soundEnabled()) return;
  const seq = [523, 659, 784, 1047];
  seq.forEach((f, i) => note(f, i * 0.11, 0.3, 'triangle', 0.17));
  note(1319, 0.46, 0.5, 'sine', 0.12);
}

/** קליק קטן (הפיכת קלף, בחירה) */
export function playTap(): void {
  if (!soundEnabled()) return;
  note(520, 0, 0.07, 'sine', 0.08);
}
