// כל אותיות האלף-בית, כולל סופיות — גרסת כתב עגול (כתב יד).
// כאן כל האותיות "חדשות": צורת כתב היד שונה מהדפוס, והן נלמדות
// בקבוצות לפי קלות הכתיבה — מהקווים הפשוטים אל הצורות המורכבות (ראו units.ts).

export interface LetterInfo {
  ch: string;        // האות בדפוס (הפונט "Agol" מרנדר אותה בכתב יד)
  name: string;      // שם האות
  final?: boolean;   // אות סופית
  hard?: boolean;    // נספרת כאות-מטרה בקריאת סיפורים
  hint?: string;     // סימן לזכירה
}

export const LETTERS: LetterInfo[] = [
  { ch: 'א', name: 'אלף', hard: true },
  { ch: 'ב', name: 'בית', hard: true, hint: 'שימו לב להבדל בין ב׳ ל-כ׳ בכתב יד' },
  { ch: 'ג', name: 'גימל', hard: true },
  { ch: 'ד', name: 'דלת', hard: true },
  { ch: 'ה', name: 'הא', hard: true, hint: 'שימו לב להבדל בין ה׳ ל-ת׳ בכתב יד' },
  { ch: 'ו', name: 'וו', hint: 'קו ישר יורד — ארוך יותר מ-י׳' },
  { ch: 'ז', name: 'זין', hard: true },
  { ch: 'ח', name: 'חית', hard: true, hint: 'שימו לב להבדל בין ח׳ ל-ה׳' },
  { ch: 'ט', name: 'טית', hard: true },
  { ch: 'י', name: 'יוד', hint: 'קו קצר — הקטן בכל האותיות' },
  { ch: 'כ', name: 'כף', hard: true, hint: 'עגולה ופתוחה — בלי הקו הישר של ב׳' },
  { ch: 'ך', name: 'כף סופית', final: true, hard: true },
  { ch: 'ל', name: 'למד', hard: true, hint: 'האות הגבוהה — מטפסת מעל השורה' },
  { ch: 'מ', name: 'מם', hard: true },
  { ch: 'ם', name: 'מם סופית', final: true, hard: true, hint: 'עיגול סגור — שימו לב להבדל מ-ס׳' },
  { ch: 'נ', name: 'נון', hard: true },
  { ch: 'ן', name: 'נון סופית', final: true, hint: 'קו ישר ארוך שיורד מתחת לשורה' },
  { ch: 'ס', name: 'סמך', hard: true, hint: 'עיגול סגור — שימו לב להבדל מ-ם׳' },
  { ch: 'ע', name: 'עין', hard: true },
  { ch: 'פ', name: 'פא', hard: true },
  { ch: 'ף', name: 'פא סופית', final: true, hard: true },
  { ch: 'צ', name: 'צדי', hard: true },
  { ch: 'ץ', name: 'צדי סופית', final: true, hard: true, hint: 'יורדת עמוק מתחת לשורה' },
  { ch: 'ק', name: 'קוף', hard: true },
  { ch: 'ר', name: 'ריש', hard: true },
  { ch: 'ש', name: 'שין', hard: true },
  { ch: 'ת', name: 'תו', hard: true, hint: 'שימו לב להבדל בין ת׳ ל-ה׳' },
];

export const ALL_CHARS = LETTERS.map((l) => l.ch);

// סדר עמודות למפת החום של המורה — לפי סדר האלף-בית
export const HEATMAP_ORDER = ALL_CHARS;

// מיפוי אות-סופית לאות רגילה לצורך צבירת נתונים (סופיות נספרות בנפרד)
export const FINAL_TO_BASE: Record<string, string> = {
  'ך': 'כ',
  'ם': 'מ',
  'ן': 'נ',
  'ף': 'פ',
  'ץ': 'צ',
};

const HEBREW_RE = /[א-ת]/;

/** מפרק מחרוזת לאותיות עבריות בלבד */
export function hebrewLetters(text: string): string[] {
  return [...text].filter((c) => HEBREW_RE.test(c));
}

/** אילו אותיות ייחודיות מופיעות בטקסט */
export function uniqueLetters(text: string): string[] {
  return [...new Set(hebrewLetters(text))];
}
