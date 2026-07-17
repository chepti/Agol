import type { LetterEvents } from '../data/types';
import { hebrewLetters } from '../data/letters';

/** מוסיף אירוע (נכון/שגוי) לכל אות עברית בטקסט */
export function addTextEvents(events: LetterEvents, text: string, correct: boolean): void {
  for (const ch of hebrewLetters(text)) {
    addLetterEvent(events, ch, correct);
  }
}

export function addLetterEvent(events: LetterEvents, letter: string, correct: boolean): void {
  if (!events[letter]) events[letter] = { c: 0, w: 0 };
  if (correct) events[letter].c += 1;
  else events[letter].w += 1;
}

export function mergeEvents(target: LetterEvents, add: LetterEvents): LetterEvents {
  for (const [l, e] of Object.entries(add)) {
    if (!target[l]) target[l] = { c: 0, w: 0 };
    target[l].c += e.c;
    target[l].w += e.w;
  }
  return target;
}

/**
 * רמת שליטה 0..100 מתוך ספירת נכון/שגוי מצטברת.
 * ממוצע נע: תשובה שגויה "מושכת" חזק יותר מתשובה נכונה, כדי שקושי אמיתי יבלוט.
 * ביטחון עולה עם כמות הנתונים — מעט נתונים מקרבים ל-50 (לא יודעים).
 */
export function masteryFrom(c: number, w: number): number {
  const n = c + w;
  if (n === 0) return -1; // אין נתונים
  const raw = c / (c + w * 1.5);
  const confidence = Math.min(1, n / 8);
  const score = raw * confidence + 0.5 * (1 - confidence);
  return Math.round(score * 100);
}

/** צבע למפת חום: אדום (0) → צהוב (50) → ירוק (100). -1 = אפור */
export function masteryColor(m: number): string {
  if (m < 0) return '#e2e8f0';
  const clamped = Math.max(0, Math.min(100, m));
  // hue: 0 (אדום) עד 130 (ירוק)
  const hue = (clamped / 100) * 130;
  return `hsl(${hue}, 72%, ${58 - clamped * 0.08}%)`;
}

export function masteryLabel(m: number): string {
  if (m < 0) return 'טרם תורגל';
  if (m < 40) return 'מתקשה';
  if (m < 60) return 'מתחיל';
  if (m < 80) return 'מתקדם';
  return 'שולט';
}
