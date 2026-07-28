// צלילי משוב — מסונתזים ב-WebAudio, בלי קבצים חיצוניים.
// כל סוג צליל מתחלף בין כמה וריאציות, בלי לחזור על אותה וריאציה ברצף.

const LS_SOUND = 'agol_sound';

let ctx: AudioContext | null = null;
const lastIdx: Record<string, number> = {};

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

/** בוחר אינדקס אקראי שאינו האחרון שנשמע */
function pickVariant(key: string, n: number): number {
  if (n <= 1) return 0;
  let i = Math.floor(Math.random() * n);
  if (i === lastIdx[key]) i = (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
  lastIdx[key] = i;
  return i;
}

type Chord = Array<[number, number, number, OscillatorType?, number?]>;

const CORRECT_VARIANTS: Chord[] = [
  [[660, 0, 0.16, 'sine'], [880, 0.09, 0.22, 'sine']],
  [[523, 0, 0.12, 'triangle'], [659, 0.08, 0.12, 'triangle'], [784, 0.16, 0.2, 'triangle']],
  [[784, 0, 0.13, 'sine'], [1046, 0.08, 0.24, 'sine']],
  [[587, 0, 0.14, 'triangle'], [880, 0.09, 0.2, 'sine']],
  [[880, 0, 0.09, 'sine'], [784, 0.07, 0.09, 'sine'], [1046, 0.14, 0.22, 'sine']],
  [[440, 0, 0.1, 'triangle'], [554, 0.08, 0.1, 'triangle'], [659, 0.16, 0.22, 'sine']],
  [[698, 0, 0.11, 'sine'], [880, 0.1, 0.11, 'sine'], [698, 0.2, 0.18, 'triangle']],
  [[988, 0, 0.08, 'sine'], [1174, 0.06, 0.2, 'sine']],
  [[392, 0, 0.12, 'triangle'], [523, 0.1, 0.12, 'triangle'], [659, 0.2, 0.24, 'sine']],
];

const WRONG_VARIANTS: Chord[] = [
  [[196, 0, 0.2, 'triangle', 0.14], [147, 0.1, 0.25, 'triangle', 0.12]],
  [[220, 0, 0.16, 'sawtooth', 0.07], [185, 0.12, 0.22, 'triangle', 0.11]],
  [[165, 0, 0.18, 'triangle', 0.13], [130, 0.14, 0.2, 'sine', 0.1]],
  [[247, 0, 0.1, 'triangle', 0.1], [196, 0.1, 0.1, 'triangle', 0.1], [165, 0.2, 0.22, 'triangle', 0.12]],
  [[175, 0, 0.28, 'sine', 0.11]],
];

const TAP_VARIANTS: Chord[] = [
  [[520, 0, 0.07, 'sine', 0.08]],
  [[640, 0, 0.05, 'triangle', 0.07]],
  [[480, 0, 0.06, 'sine', 0.07], [720, 0.04, 0.05, 'sine', 0.05]],
  [[400, 0, 0.05, 'triangle', 0.06]],
  [[880, 0, 0.04, 'sine', 0.05]],
];

const WIN_VARIANTS: number[][] = [
  [523, 659, 784, 1047],
  [587, 740, 880, 1175],
  [523, 784, 659, 1047],
  [440, 554, 659, 880],
  [659, 784, 988, 1318],
  [392, 523, 659, 784],
];

function playChord(notes: Chord): void {
  notes.forEach(([f, t, d, type = 'sine', peak = 0.16]) => note(f, t, d, type, peak));
}

/** תשובה נכונה — מתחלף, בלי חזרה רצופה */
export function playCorrect(): void {
  if (!soundEnabled()) return;
  playChord(CORRECT_VARIANTS[pickVariant('correct', CORRECT_VARIANTS.length)]);
}

/** טעות — כמה באזזים רכים שונים */
export function playWrong(): void {
  if (!soundEnabled()) return;
  playChord(WRONG_VARIANTS[pickVariant('wrong', WRONG_VARIANTS.length)]);
}

/** סיום פעילות — פנפרה מתחלפת */
export function playWin(): void {
  if (!soundEnabled()) return;
  const seq = WIN_VARIANTS[pickVariant('win', WIN_VARIANTS.length)];
  seq.forEach((f, i) => note(f, i * 0.11, 0.3, 'triangle', 0.17));
  note(seq[3] * 1.26, 0.46, 0.5, 'sine', 0.12);
}

/** קליק קטן — גם מתחלף */
export function playTap(): void {
  if (!soundEnabled()) return;
  playChord(TAP_VARIANTS[pickVariant('tap', TAP_VARIANTS.length)]);
}
