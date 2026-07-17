// טיפוסי הפעילויות. כל פעילות מדווחת בסיום: ציון, מקסימום, ואירועי אות
// (לכל אות: כמה פעמים נענתה נכון וכמה שגוי) — מהם נגזרת רמת השליטה.

export interface LetterEvents {
  [letter: string]: { c: number; w: number }; // c=correct, w=wrong
}

export interface ActivityResult {
  score: number;
  max: number;
  letters: LetterEvents;
}

export interface IntroActivity {
  type: 'intro';
  id: string;
  title: string;
  instructions: string;
  letters: string[]; // אותיות להצגה (רגיל מול רש"י), עם רמזים מ-letters.ts
}

export interface FlashcardsActivity {
  type: 'flashcards';
  id: string;
  title: string;
  instructions: string;
  cards: { text: string }[]; // מוצג ברש"י, התלמיד מקליד בכתב רגיל
}

export interface WordSearchActivity {
  type: 'wordsearch';
  id: string;
  title: string;
  instructions: string;
  words: string[];
  size: number;       // גודל הרשת
  reversed?: boolean; // מילים כתובות הפוך (משמאל לימין / מלמעלה למטה בלבד)
  fillPool: string;   // אותיות מילוי — רק אותיות שנלמדו
}

export interface MatchActivity {
  type: 'match';
  id: string;
  title: string;
  instructions: string;
  pairs: { agol: string; label?: string }[]; // גוררים כתב רגיל אל כתב רש"י
}

export interface MemoryActivity {
  type: 'memory';
  id: string;
  title: string;
  instructions: string;
  pairs: { a: string; b: string }[]; // a מוצג ברש"י, b בכתב רגיל
}

export interface StoryActivity {
  type: 'story';
  id: string;
  title: string;
  instructions: string;
  paragraphs: string[];
  questions: QuizQuestion[];
}

export interface OrderActivity {
  type: 'order';
  id: string;
  title: string;
  instructions: string;
  items: string[]; // הסדר הנכון; מוצג מעורבב ברש"י
}

export interface PaintActivity {
  type: 'paint';
  id: string;
  title: string;
  instructions: string;
  gridSize: number;
  steps: { text: string; cells: [number, number][] }[]; // ההוראה ברש"י + התאים הנכונים
  revealEmoji: string; // מה מתקבל בציור
}

export interface TraceActivity {
  type: 'trace';
  id: string;
  title: string;
  instructions: string;
  letters: string[]; // האותיות לעקיבה, בסדר — מציירים עליהן עם אצבע/עכבר
}

export interface QuizQuestion {
  prompt: string;        // טקסט השאלה (כתב רגיל)
  agolText?: string;    // טקסט להצגה בכתב רש"י
  options: string[];
  correct: number;
  targetLetters?: string[]; // האותיות שהשאלה בוחנת (ברירת מחדל: אותיות agolText)
}

export interface QuizActivity {
  type: 'quiz';
  id: string;
  title: string;
  instructions: string;
  questions: QuizQuestion[];
}

export type Activity =
  | IntroActivity
  | FlashcardsActivity
  | WordSearchActivity
  | MatchActivity
  | MemoryActivity
  | StoryActivity
  | OrderActivity
  | PaintActivity
  | TraceActivity
  | QuizActivity;

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  icon: string;            // אימוג'י ליחידה
  newLetters: string[];    // האותיות החדשות שנלמדות ביחידה
  activities: Activity[];
}
