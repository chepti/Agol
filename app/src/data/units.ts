import type { Unit } from './types';

// מסע כתב היד (כתב עגול) — סדר הלמידה לפי קלות הכתיבה:
// מהקווים הפשוטים ביותר אל הצורות המורכבות.
//
// הסדר: י,ו,ן ← נ,ר,ה ← ח,ק,ת ← ס,כ(+ך),א ← ב,ג,ד ← מ,ם ← ע,ט,ש ← ז ← ל ← פ,ף ← צ,ץ
// אף פעילות לא משתמשת באות שטרם נלמדה (ההוראות והתשובות — בדפוס, מותר הכול).

export const UNITS: Unit[] = [
  // ─────────────────────────────── יחידה 1 ───────────────────────────────
  {
    id: 'kavim',
    title: "קווים ראשונים: י' ו' ן'",
    subtitle: 'שלוש אותיות של קו אחד פשוט',
    icon: '✏️',
    newLetters: ['י', 'ו', 'ן'],
    activities: [
      {
        type: 'intro',
        id: 'kavim-intro',
        title: 'הכירו את כתב היד',
        instructions:
          'מתחילים מהאותיות הכי פשוטות לכתיבה — קו אחד! לחצו על כל כרטיס כדי לראות את האות בדפוס.',
        letters: ['י', 'ו', 'ן'],
      },
      {
        type: 'trace',
        id: 'kavim-trace',
        title: 'ציירו את האותיות',
        instructions: 'צפו בהדגמה ואז ציירו כל אות בעצמכם. כשהמילוי מדויק — עוברים לבא אוטומטית!',
        letters: ['י', 'ו', 'ן'],
      },
      {
        type: 'memory',
        id: 'kavim-memory',
        title: 'זיכרון של קווים',
        instructions: 'הפכו קלפים ומצאו זוגות: אות בכתב יד ואותה אות בדפוס. קל וכיפי!',
        pairs: [
          { a: 'י', b: 'י' },
          { a: 'ו', b: 'ו' },
          { a: 'ן', b: 'ן' },
          { a: 'יו', b: 'יו' },
        ],
      },
      {
        type: 'quiz',
        id: 'kavim-quiz',
        title: 'קצר או ארוך?',
        instructions: 'איזו אות כתובה כאן בכתב יד? שימו לב לאורך הקו!',
        questions: [
          { prompt: 'איזו אות זו?', agolText: 'י', options: ['י', 'ו', 'ן'], correct: 0 },
          { prompt: 'איזו אות זו?', agolText: 'ו', options: ['י', 'ו', 'ן'], correct: 1 },
          { prompt: 'איזו אות זו?', agolText: 'ן', options: ['י', 'ו', 'ן'], correct: 2 },
          { prompt: 'מה כתוב כאן?', agolText: 'יו', options: ['יו', 'וי', 'ין'], correct: 0 },
          { prompt: 'מה כתוב כאן?', agolText: 'וי', options: ['יי', 'וי', 'ון'], correct: 1 },
          { prompt: 'מה כתוב כאן?', agolText: 'ין', options: ['יו', 'ון', 'ין'], correct: 2 },
        ],
      },
    ],
  },

  // ─────────────────────────────── יחידה 2 ───────────────────────────────
  {
    id: 'nun',
    title: "נ' ר' ה'",
    subtitle: 'מוסיפים סיבוב קטן לקו',
    icon: '🌱',
    newLetters: ['נ', 'ר', 'ה'],
    activities: [
      {
        type: 'intro',
        id: 'nun-intro',
        title: "מכירים את נ' ר' ה'",
        instructions: 'עוד שלוש אותיות פשוטות. התבוננו היטב בצורת כתב היד של כל אחת.',
        letters: ['נ', 'ר', 'ה'],
      },
      {
        type: 'trace',
        id: 'nun-trace',
        title: 'ציירו את האותיות',
        instructions: 'צפו בהדגמה ואז ציירו כל אות בעצמכם. כשהמילוי מדויק — עוברים לבא אוטומטית!',
        letters: ['נ', 'ר', 'ה'],
      },
      {
        type: 'flashcards',
        id: 'nun-cards',
        title: 'המילים הראשונות!',
        instructions: 'כתבו בדפוס את מה שכתוב על הכרטיס בכתב יד.',
        cards: [
          { text: 'נר' },
          { text: 'הר' },
          { text: 'רון' },
          { text: 'נהר' },
          { text: 'נורה' },
          { text: 'נייר' },
          { text: 'ינון' },
          { text: 'היונה' },
        ],
      },
      {
        type: 'bubbles',
        id: 'nun-bubbles',
        title: 'בועות מילים',
        instructions: 'גררו בועה בכתב יד אל הבועה בדפוס שמתאימה לה — כשהן נפגשות הן מתפוצצות!',
        pairs: [
          { agol: 'נר' },
          { agol: 'הר' },
          { agol: 'רון' },
          { agol: 'נהר' },
          { agol: 'יונה' },
        ],
      },
      {
        type: 'quiz',
        id: 'nun-quiz',
        title: 'מה כתוב כאן?',
        instructions: 'קראו את המילה בכתב יד ובחרו את הקריאה הנכונה.',
        questions: [
          { prompt: 'מה כתוב כאן?', agolText: 'נר', options: ['נר', 'גר', 'נו'], correct: 0 },
          { prompt: 'מה כתוב כאן?', agolText: 'הר', options: ['הן', 'הר', 'רה'], correct: 1 },
          { prompt: 'מה כתוב כאן?', agolText: 'רון', options: ['נור', 'רין', 'רון'], correct: 2 },
          { prompt: 'מה כתוב כאן?', agolText: 'נהר', options: ['נהר', 'נחל', 'הנר'], correct: 0 },
          { prompt: 'מה כתוב כאן?', agolText: 'הרי', options: ['הרו', 'הרי', 'חרי'], correct: 1 },
          { prompt: 'מה כתוב כאן?', agolText: 'נורה', options: ['נורה', 'הרון', 'נוהר'], correct: 0 },
        ],
      },
    ],
  },

  // ─────────────────────────────── יחידה 3 ───────────────────────────────
  {
    id: 'chet',
    title: "ח' ק' ת'",
    subtitle: 'אותיות עם רגליים',
    icon: '🔑',
    newLetters: ['ח', 'ק', 'ת'],
    activities: [
      {
        type: 'intro',
        id: 'chet-intro',
        title: "מכירים את ח' ק' ת'",
        instructions: 'שימו לב: ח׳ ו-ת׳ דומות מאוד בכתב יד — הבחינו בהבדל ביניהן!',
        letters: ['ח', 'ק', 'ת'],
      },
      {
        type: 'trace',
        id: 'chet-trace',
        title: 'ציירו את האותיות',
        instructions: 'צפו בהדגמה ואז ציירו כל אות בעצמכם. כשהמילוי מדויק — עוברים לבא אוטומטית!',
        letters: ['ח', 'ק', 'ת'],
      },
      {
        type: 'flashcards',
        id: 'chet-cards',
        title: 'פענחו את המילים',
        instructions: 'כתבו בדפוס את מה שכתוב על הכרטיס — דייקו בין ח׳ ל-ת׳!',
        cards: [
          { text: 'חוק' },
          { text: 'תיק' },
          { text: 'רוח' },
          { text: 'קיר' },
          { text: 'תנור' },
          { text: 'קרן' },
          { text: 'נחת' },
          { text: 'חנות' },
        ],
      },
      {
        type: 'bubbles',
        id: 'chet-bubbles',
        title: 'בועות ח׳ ו-ת׳',
        instructions: 'גררו בועות כתב יד אל הדפוס — שימו לב במיוחד להבדל בין ח׳ ל-ת׳!',
        pairs: [
          { agol: 'חוק' },
          { agol: 'תיק' },
          { agol: 'רוח' },
          { agol: 'קיר' },
          { agol: 'תות' },
        ],
      },
      {
        type: 'wordsearch',
        id: 'chet-search',
        title: 'תפזורת ראשונה',
        instructions: 'מצאו את המילים בתפזורת — הכול בכתב יד! לחצו על האות הראשונה וגררו עד האחרונה.',
        words: ['תיק', 'רוח', 'קיר', 'נהר', 'תות', 'חוק', 'קרן'],
        size: 8,
        fillPool: 'יוןנרהחקת',
      },
    ],
  },

  // ─────────────────────────────── יחידה 4 ───────────────────────────────
  {
    id: 'samech',
    title: "ס' כ' א'",
    subtitle: 'העיגולים מצטרפים למסע',
    icon: '🪑',
    newLetters: ['ס', 'כ', 'ך', 'א'],
    activities: [
      {
        type: 'intro',
        id: 'samech-intro',
        title: "מכירים את ס' כ' א'",
        instructions: 'אותיות עגולות! שימו לב להבדל בין ס׳ הסגורה ל-כ׳ הפתוחה, והכירו גם את ך׳ הסופית.',
        letters: ['ס', 'כ', 'ך', 'א'],
      },
      {
        type: 'trace',
        id: 'samech-trace',
        title: 'ציירו את האותיות',
        instructions: 'צפו בהדגמה ואז ציירו כל אות בעצמכם. כשהמילוי מדויק — עוברים לבא אוטומטית!',
        letters: ['ס', 'כ', 'ך', 'א'],
      },
      {
        type: 'flashcards',
        id: 'samech-cards',
        title: 'פענחו את המילים',
        instructions: 'כתבו בדפוס את מה שכתוב על הכרטיס.',
        cards: [
          { text: 'כוס' },
          { text: 'סיר' },
          { text: 'אור' },
          { text: 'כיסא' },
          { text: 'סוכה' },
          { text: 'אחות' },
          { text: 'ארון' },
          { text: 'נסיך' },
        ],
      },
      {
        type: 'match',
        id: 'samech-match',
        title: 'התאימו כתב יד לדפוס',
        instructions: 'לחצו על מילה בדפוס, ואז על המילה המתאימה בכתב יד.',
        pairs: [
          { agol: 'אור' },
          { agol: 'ארון' },
          { agol: 'כיסא' },
          { agol: 'סוכה' },
          { agol: 'נסיך' },
        ],
      },
    ],
  },

  // ─────────────────────────────── יחידה 5 ───────────────────────────────
  {
    id: 'bet',
    title: "ב' ג' ד'",
    subtitle: 'שלוש אותיות חדשות ומילים חדשות',
    icon: '🐟',
    newLetters: ['ב', 'ג', 'ד'],
    activities: [
      {
        type: 'intro',
        id: 'bet-intro',
        title: "מכירים את ב' ג' ד'",
        instructions: 'שימו לב: ב׳ בכתב יד שונה מ-כ׳ — חפשו את הקו הישר למטה.',
        letters: ['ב', 'ג', 'ד'],
      },
      {
        type: 'trace',
        id: 'bet-trace',
        title: 'ציירו את האותיות',
        instructions: 'צפו בהדגמה ואז ציירו כל אות בעצמכם. כשהמילוי מדויק — עוברים לבא אוטומטית!',
        letters: ['ב', 'ג', 'ד'],
      },
      {
        type: 'flashcards',
        id: 'bet-cards',
        title: 'פענחו את המילים',
        instructions: 'כתבו בדפוס את מה שכתוב על הכרטיס — הבחינו בין ב׳ ל-כ׳!',
        cards: [
          { text: 'דג' },
          { text: 'דוב' },
          { text: 'בגד' },
          { text: 'גיר' },
          { text: 'גדר' },
          { text: 'דרך' },
          { text: 'בקבוק' },
          { text: 'גבינה' },
        ],
      },
      {
        type: 'memory',
        id: 'bet-memory',
        title: 'משחק זיכרון',
        instructions: 'הפכו את הקלפים ומצאו כל זוג: מילה בכתב יד והמילה שלה בדפוס.',
        pairs: [
          { a: 'דג', b: 'דג' },
          { a: 'דוב', b: 'דוב' },
          { a: 'בגד', b: 'בגד' },
          { a: 'גן', b: 'גן' },
          { a: 'גיר', b: 'גיר' },
          { a: 'גדר', b: 'גדר' },
        ],
      },
    ],
  },

  // ─────────────────────────────── יחידה 6 ───────────────────────────────
  {
    id: 'mem',
    title: "מ' ם'",
    subtitle: 'חצי דרך! וכבר קוראים מכתב',
    icon: '💧',
    newLetters: ['מ', 'ם'],
    activities: [
      {
        type: 'intro',
        id: 'mem-intro',
        title: "מכירים את מ' ם'",
        instructions: 'שימו לב: ם׳ סופית בכתב יד היא עיגול סגור — כמעט כמו ס׳! הבחינו בהבדל.',
        letters: ['מ', 'ם'],
      },
      {
        type: 'trace',
        id: 'mem-trace',
        title: 'ציירו את האותיות',
        instructions: 'צפו בהדגמה ואז ציירו כל אות בעצמכם. כשהמילוי מדויק — עוברים לבא אוטומטית!',
        letters: ['מ', 'ם'],
      },
      {
        type: 'flashcards',
        id: 'mem-cards',
        title: 'פענחו את המילים',
        instructions: 'כתבו בדפוס את מה שכתוב על הכרטיס.',
        cards: [
          { text: 'מים' },
          { text: 'אמא' },
          { text: 'חם' },
          { text: 'גמד' },
          { text: 'קמח' },
          { text: 'אדם' },
          { text: 'מנורה' },
          { text: 'מדבקה' },
        ],
      },
      {
        type: 'story',
        id: 'mem-letter',
        title: 'מכתב ראשון בכתב יד',
        instructions:
          'דנה כתבה מכתב מהמחנה — בכתב יד! נסו לקרוא לבד. אפשר להזיז את הקו כדי להציץ בדפוס.',
        paragraphs: [
          'אמא ואבא היקרים,',
          'אני נהנית מאוד במחנה. בבוקר ראינו נהר ארוך וגם דוב חום. התות כאן מתוק מאוד.',
          'מחר נדוג דגים בנהר. נתראה בקרוב,',
          'דנה',
        ],
        questions: [
          { prompt: 'מי כתבה את המכתב?', options: ['אמא', 'דנה', 'המדריכה'], correct: 1 },
          { prompt: 'איפה נמצאת דנה?', options: ['במחנה', 'בבית סבתא', 'בבית ספר'], correct: 0 },
          { prompt: 'מה ראו בבוקר?', options: ['ים וסירה', 'הר געש', 'נהר ארוך ודוב חום'], correct: 2 },
          { prompt: 'מה יעשו מחר?', options: ['ידוגו דגים', 'יטפסו על הר', 'ישחו בבריכה'], correct: 0 },
        ],
      },
    ],
  },

  // ─────────────────────────────── יחידה 7 ───────────────────────────────
  {
    id: 'ayin',
    title: "ע' ט' ש'",
    subtitle: 'האותיות המפותלות',
    icon: '☀️',
    newLetters: ['ע', 'ט', 'ש'],
    activities: [
      {
        type: 'intro',
        id: 'ayin-intro',
        title: "מכירים את ע' ט' ש'",
        instructions: 'שלוש אותיות עם פיתולים. התבוננו היטב בצורת כתב היד של כל אחת.',
        letters: ['ע', 'ט', 'ש'],
      },
      {
        type: 'trace',
        id: 'ayin-trace',
        title: 'ציירו את האותיות',
        instructions: 'צפו בהדגמה ואז ציירו כל אות בעצמכם. כשהמילוי מדויק — עוברים לבא אוטומטית!',
        letters: ['ע', 'ט', 'ש'],
      },
      {
        type: 'flashcards',
        id: 'ayin-cards',
        title: 'פענחו את המילים',
        instructions: 'כתבו בדפוס את מה שכתוב על הכרטיס.',
        cards: [
          { text: 'שמש' },
          { text: 'עט' },
          { text: 'שעון' },
          { text: 'מטוס' },
          { text: 'קשת' },
          { text: 'עכביש' },
          { text: 'שבת' },
          { text: 'מטרייה' },
        ],
      },
      {
        type: 'quiz',
        id: 'ayin-quiz',
        title: 'קריאה מהירה',
        instructions: 'קראו את המילה בכתב יד ובחרו את הקריאה הנכונה.',
        questions: [
          { prompt: 'מה כתוב כאן?', agolText: 'שמש', options: ['שמש', 'שמח', 'סמס'], correct: 0 },
          { prompt: 'מה כתוב כאן?', agolText: 'עט', options: ['אט', 'עט', 'עת'], correct: 1 },
          { prompt: 'מה כתוב כאן?', agolText: 'קשת', options: ['קשה', 'כשת', 'קשת'], correct: 2 },
          { prompt: 'מה כתוב כאן?', agolText: 'שעון', options: ['שעון', 'שאון', 'סבון'], correct: 0 },
          { prompt: 'מה כתוב כאן?', agolText: 'מטוס', options: ['מוטס', 'מטוס', 'מתוס'], correct: 1 },
          { prompt: 'מה כתוב כאן?', agolText: 'עכביש', options: ['אכביש', 'עקביש', 'עכביש'], correct: 2 },
        ],
      },
    ],
  },

  // ─────────────────────────────── יחידה 8 ───────────────────────────────
  {
    id: 'zayin',
    title: "ז'",
    subtitle: 'אות אחת קטנה וזריזה',
    icon: '🥕',
    newLetters: ['ז'],
    activities: [
      {
        type: 'intro',
        id: 'zayin-intro',
        title: "מכירים את ז'",
        instructions: 'אות אחת בלבד הפעם — אבל אל תתבלבלו בינה לבין ג׳ בכתב יד!',
        letters: ['ז', 'ג'],
      },
      {
        type: 'trace',
        id: 'zayin-trace',
        title: 'ציירו את האותיות',
        instructions: 'צפו בהדגמה ואז ציירו כל אות בעצמכם. כשהמילוי מדויק — עוברים לבא אוטומטית!',
        letters: ['ז'],
      },
      {
        type: 'wordsearch',
        id: 'zayin-search',
        title: "תפזורת ז'",
        instructions: 'מצאו את המילים בתפזורת — כולן עם ז׳.',
        words: ['זר', 'ברז', 'אורז', 'זנב', 'מזרן', 'חרוז'],
        size: 8,
        fillPool: 'יונרהחקתסכאבגדמעטשז',
      },
    ],
  },

  // ─────────────────────────────── יחידה 9 ───────────────────────────────
  {
    id: 'lamed',
    title: "ל'",
    subtitle: 'האות הגבוהה מכולן',
    icon: '❤️',
    newLetters: ['ל'],
    activities: [
      {
        type: 'intro',
        id: 'lamed-intro',
        title: "מכירים את ל'",
        instructions: 'ל׳ היא האות היחידה שמטפסת מעל השורה — קל לזהות אותה מרחוק!',
        letters: ['ל'],
      },
      {
        type: 'trace',
        id: 'lamed-trace',
        title: 'ציירו את האותיות',
        instructions: 'צפו בהדגמה ואז ציירו כל אות בעצמכם. כשהמילוי מדויק — עוברים לבא אוטומטית!',
        letters: ['ל'],
      },
      {
        type: 'flashcards',
        id: 'lamed-cards',
        title: 'פענחו את המילים',
        instructions: 'כתבו בדפוס את מה שכתוב על הכרטיס.',
        cards: [
          { text: 'לב' },
          { text: 'שלום' },
          { text: 'חלב' },
          { text: 'גלגל' },
          { text: 'סלט' },
          { text: 'לילה' },
          { text: 'מלון' },
          { text: 'שולחן' },
        ],
      },
      {
        type: 'paint',
        id: 'lamed-paint',
        title: 'ציור לפי הוראות',
        instructions:
          'קראו כל הוראה — היא כתובה בכתב יד! — ומלאו את המשבצות הנכונות. בסוף יתגלה ציור.',
        gridSize: 7,
        revealEmoji: '❤️',
        steps: [
          { text: 'מלאו בשורה 2 את טור 2, טור 3, טור 5 וטור 6', cells: [[1, 1], [1, 2], [1, 4], [1, 5]] },
          { text: 'מלאו את כל שורה 3 ואת כל שורה 4', cells: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6]] },
          { text: 'מלאו בשורה 5 את טור 2 עד טור 6', cells: [[4, 1], [4, 2], [4, 3], [4, 4], [4, 5]] },
          { text: 'מלאו בשורה 6 את טור 3, טור 4 וטור 5', cells: [[5, 2], [5, 3], [5, 4]] },
          { text: 'מלאו בשורה 7 את טור 4', cells: [[6, 3]] },
        ],
      },
    ],
  },

  // ─────────────────────────────── יחידה 10 ───────────────────────────────
  {
    id: 'pe',
    title: "פ' ף'",
    subtitle: 'כמעט בסוף המסע!',
    icon: '🌸',
    newLetters: ['פ', 'ף'],
    activities: [
      {
        type: 'intro',
        id: 'pe-intro',
        title: "מכירים את פ' ף'",
        instructions: 'פ׳ רגילה ו-ף׳ סופית שיורדת מתחת לשורה. התבוננו היטב.',
        letters: ['פ', 'ף'],
      },
      {
        type: 'trace',
        id: 'pe-trace',
        title: 'ציירו את האותיות',
        instructions: 'צפו בהדגמה ואז ציירו כל אות בעצמכם. כשהמילוי מדויק — עוברים לבא אוטומטית!',
        letters: ['פ', 'ף'],
      },
      {
        type: 'flashcards',
        id: 'pe-cards',
        title: 'פענחו את המילים',
        instructions: 'כתבו בדפוס את מה שכתוב על הכרטיס.',
        cards: [
          { text: 'פיל' },
          { text: 'פרח' },
          { text: 'עוף' },
          { text: 'פנס' },
          { text: 'שפן' },
          { text: 'טלפון' },
          { text: 'כפית' },
          { text: 'סוף' },
        ],
      },
    ],
  },

  // ─────────────────────────────── יחידה 11 ───────────────────────────────
  {
    id: 'tsadi',
    title: "צ' ץ'",
    subtitle: 'האותיות האחרונות!',
    icon: '🐢',
    newLetters: ['צ', 'ץ'],
    activities: [
      {
        type: 'intro',
        id: 'tsadi-intro',
        title: "מכירים את צ' ץ'",
        instructions: 'האותיות האחרונות במסע! צ׳ רגילה ו-ץ׳ סופית שצוללת עמוק מתחת לשורה.',
        letters: ['צ', 'ץ'],
      },
      {
        type: 'trace',
        id: 'tsadi-trace',
        title: 'ציירו את האותיות',
        instructions: 'צפו בהדגמה ואז ציירו כל אות בעצמכם. כשהמילוי מדויק — עוברים לבא אוטומטית!',
        letters: ['צ', 'ץ'],
      },
      {
        type: 'flashcards',
        id: 'tsadi-cards',
        title: 'פענחו את המילים',
        instructions: 'כתבו בדפוס את מה שכתוב על הכרטיס.',
        cards: [
          { text: 'צב' },
          { text: 'מיץ' },
          { text: 'ארץ' },
          { text: 'עציץ' },
          { text: 'ציפור' },
          { text: 'קפיצה' },
          { text: 'צלחת' },
          { text: 'מצנח' },
        ],
      },
    ],
  },

  // ─────────────────────────────── יחידה 12 ───────────────────────────────
  {
    id: 'story',
    title: 'סיפור בכתב יד',
    subtitle: 'קוראים סיפור שלם — בכתב עגול',
    icon: '📖',
    newLetters: [],
    activities: [
      {
        type: 'story',
        id: 'agol-story',
        title: 'החילזון שלמד לכתוב',
        instructions:
          'קראו את הסיפור בכתב יד. הזיזו את הקו המפריד — האם תצליחו לקרוא הכול בלי להציץ בדפוס?',
        paragraphs: [
          'לחילזון קטן בגינה היה חלום: ללמוד לכתוב בכתב יד. כל בוקר הוא הביט בילדים שכותבים במחברות, והתאמן בסתר על עלים ירוקים.',
          'יום אחד השאיר החילזון שביל כסוף מיוחד על הדשא — והשביל היה בצורת אותיות! "שלום" היה כתוב שם, בכתב עגול ויפה.',
          'מאז, כל ילדי הגינה באים לראות את החילזון הסופר, והוא כותב להם מילים יפות: פרח, שמש, חברים.',
        ],
        questions: [
          { prompt: 'מה היה החלום של החילזון?', options: ['לרוץ מהר', 'ללמוד לכתוב בכתב יד', 'לטוס לירח'], correct: 1 },
          { prompt: 'על מה התאמן החילזון בסתר?', options: ['על עלים ירוקים', 'על לוח וגיר', 'על חול בחוף'], correct: 0 },
          { prompt: 'מה היה כתוב בשביל הכסוף?', options: ['תודה', 'בוקר טוב', 'שלום'], correct: 2 },
          { prompt: 'מה כותב החילזון לילדים?', options: ['סיפורים ארוכים', 'מילים יפות', 'תרגילי חשבון'], correct: 1 },
        ],
      },
    ],
  },

  // ─────────────────────────────── יחידה 13 ───────────────────────────────
  {
    id: 'all',
    title: 'כל האותיות',
    subtitle: 'המסע הושלם — אתגר הגמר!',
    icon: '🏆',
    newLetters: [],
    activities: [
      {
        type: 'order',
        id: 'all-order',
        title: 'סדרו את האלף-בית',
        instructions: 'לחצו על האותיות — בכתב יד! — לפי סדר האלף-בית.',
        items: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'],
      },
      {
        type: 'quiz',
        id: 'all-final',
        title: 'מבחן הגמר',
        instructions: 'עשר שאלות — כל האותיות. בהצלחה!',
        questions: [
          { prompt: 'מה כתוב כאן?', agolText: 'ספר', options: ['ספר', 'סופר', 'טפר'], correct: 0 },
          { prompt: 'מה כתוב כאן?', agolText: 'חבר', options: ['הבר', 'חבר', 'חכר'], correct: 1 },
          { prompt: 'מה כתוב כאן?', agolText: 'גזר', options: ['גדר', 'זגר', 'גזר'], correct: 2 },
          { prompt: 'מה כתוב כאן?', agolText: 'בלון', options: ['בלון', 'כלון', 'בלוו'], correct: 0 },
          { prompt: 'מה כתוב כאן?', agolText: 'מתנה', options: ['מהנה', 'מתנה', 'מחנה'], correct: 1 },
          { prompt: 'מה כתוב כאן?', agolText: 'צהריים', options: ['עהריים', 'צחריים', 'צהריים'], correct: 2 },
          { prompt: 'מה כתוב כאן?', agolText: 'שמיכה', options: ['שמיכה', 'סמיכה', 'שמיבה'], correct: 0 },
          { prompt: 'מה כתוב כאן?', agolText: 'תפוח', options: ['הפוח', 'תפוח', 'תפוה'], correct: 1 },
          { prompt: 'מה כתוב כאן?', agolText: 'עפיפון', options: ['אפיפון', 'עפיפוו', 'עפיפון'], correct: 2 },
          { prompt: 'מה כתוב כאן?', agolText: 'ברוכים הבאים', options: ['ברוכים הבאים', 'כרוכים הכאים', 'ברוצים הבאים'], correct: 0 },
        ],
      },
    ],
  },
];

/** האותיות המותרות עד יחידה מסוימת (כולל) */
export function lettersUpTo(unitIndex: number): string[] {
  const set = new Set<string>();
  for (let i = 0; i <= unitIndex && i < UNITS.length; i++) {
    UNITS[i].newLetters.forEach((l) => set.add(l));
  }
  return [...set];
}

export function totalActivities(): number {
  return UNITS.reduce((n, u) => n + u.activities.length, 0);
}
