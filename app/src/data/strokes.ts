// מסלולי כתיבה לאותיות — לצורך הדגמת סדר וכיוון המשיכות בפעילות ה-Tracing.
//
// כל אות ממופה למערך של "משיכות" (strokes). כל משיכה היא רשימת נקודות [x, y]
// בקואורדינטות מנורמלות 0..1 (יחסית לריבוע הקנבס). מציירים אותן בעורך
// (‎#/trace-edit) ושומרים — ואפשר להטמיע כאן לצמיתות דרך "העתקת קוד".
//
// אם לאות אין מסלול מוגדר — פעילות ה-Tracing נופלת חזרה לשלד אוטומטי
// שמחושב מצורת הפונט (קו מרכזי מלמעלה למטה).
//
// אחרי החלפת גופן (Ktiva Tama) יש לצייר מחדש את המסלולים בעורך.

export type StrokePt = [number, number];
export type LetterStrokes = StrokePt[][];

/** מסלולים מוטמעים — ריק אחרי החלפת גופן; מלאו מחדש דרך #/trace-edit */
export const AUTHORED_STROKES: Record<string, LetterStrokes> = {};

const LS_KEY = 'agol_strokes_override_v2';

function loadOverrides(): Record<string, LetterStrokes> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

/** המסלול הפעיל לאות: קודם עריכה מקומית, אחרת המוטמע בקוד, אחרת null */
export function getLetterStrokes(letter: string): LetterStrokes | null {
  const o = loadOverrides();
  if (o[letter]?.length) return o[letter];
  if (AUTHORED_STROKES[letter]?.length) return AUTHORED_STROKES[letter];
  return null;
}

export function saveLetterStrokes(letter: string, strokes: LetterStrokes): void {
  const o = loadOverrides();
  if (strokes.length) o[letter] = strokes;
  else delete o[letter];
  localStorage.setItem(LS_KEY, JSON.stringify(o));
  window.dispatchEvent(new Event('agol-strokes'));
}

export function hasStrokes(letter: string): boolean {
  return !!getLetterStrokes(letter);
}

/** ייצוא כל המסלולים (מוטמע + מקומי) כקוד TypeScript להדבקה בקובץ זה */
export function exportStrokesTs(): string {
  const merged: Record<string, LetterStrokes> = { ...AUTHORED_STROKES, ...loadOverrides() };
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const lines = Object.entries(merged).map(([ch, strokes]) => {
    const s = strokes
      .map((st) => '[' + st.map((p) => `[${round(p[0])},${round(p[1])}]`).join(',') + ']')
      .join(', ');
    return `  '${ch}': [${s}],`;
  });
  return `export const AUTHORED_STROKES: Record<string, LetterStrokes> = {\n${lines.join('\n')}\n};\n`;
}
