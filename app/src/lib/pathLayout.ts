import { UNITS } from '../data/units';

export interface Pt { x: number; y: number }

// ‎?v=3 — רקע מסלול חדש (כפר/פארק עם טירה)
export const BG = '/agol/bg-journey.webp?v=3';
export const BG_TINY = '/agol/bg-journey-tiny.webp?v=3';
/** יחס גובה/רוחב של bg-journey.webp (2816×5888 → 1400×2927) */
export const BG_RATIO = 2927 / 1400;
export const UNIT_COLORS = ['#0d9488', '#f59e0b', '#8b5cf6', '#e05252', '#3b82f6', '#ec4899', '#16a34a', '#a16207', '#d97706', '#0891b2', '#c026d3', '#4d7c0f', '#b45309'];

/** גרסה — מתעלמים משמירות ישנות אחרי החלפת רקע */
export const LS_PATH = 'agol_station_pos_v5';

/**
 * מיקומי תחנות על השביל החדש (תחתית → טירה):
 * כניסה למטה → בית אדום → גשר → קרוסלה → בתים כחולים → גלגל ענק → זיגזג במעלה → טירה
 */
export const STATION_POS: Pt[] = [
  { x: 50.0, y: 96.2 }, // 1 — כניסה לתחתית השביל
  { x: 44.5, y: 94.0 }, // 2
  { x: 38.0, y: 91.8 }, // 3 — ליד הבית האדום
  { x: 34.5, y: 89.2 }, // 4
  { x: 38.5, y: 86.8 }, // 5 — פנייה חזרה למרכז
  { x: 45.0, y: 84.5 }, // 6
  { x: 51.5, y: 82.2 }, // 7 — גישה לגשר
  { x: 54.0, y: 79.6 }, // 8 — תחילת הגשר
  { x: 51.0, y: 77.0 }, // 9 — אמצע הגשר
  { x: 47.5, y: 74.5 }, // 10 — יציאה מהגשר
  { x: 41.0, y: 72.0 }, // 11 — לכיוון הקרוסלה
  { x: 34.5, y: 69.5 }, // 12
  { x: 29.5, y: 66.8 }, // 13 — ליד הקרוסלה
  { x: 28.0, y: 63.8 }, // 14
  { x: 33.5, y: 61.2 }, // 15 — יוצאים מהקרוסלה ימינה
  { x: 41.0, y: 58.8 }, // 16
  { x: 49.0, y: 56.5 }, // 17
  { x: 57.5, y: 54.2 }, // 18 — אזור בתים כחולים
  { x: 65.0, y: 52.0 }, // 19
  { x: 69.0, y: 49.5 }, // 20
  { x: 66.0, y: 47.0 }, // 21 — חזרה שמאלה ליד גלגל ענק
  { x: 60.5, y: 44.5 }, // 22
  { x: 55.0, y: 42.0 }, // 23 — שמאל לגלגל הענק
  { x: 50.0, y: 39.5 }, // 24
  { x: 46.5, y: 37.0 }, // 25 — תחילת זיגזג במעלה
  { x: 52.5, y: 34.5 }, // 26
  { x: 48.0, y: 32.0 }, // 27
  { x: 43.5, y: 29.5 }, // 28 — גובה של טחנת הרוח
  { x: 48.5, y: 27.0 }, // 29
  { x: 53.0, y: 24.5 }, // 30
  { x: 49.0, y: 22.0 }, // 31
  { x: 46.0, y: 19.5 }, // 32
  { x: 50.0, y: 17.2 }, // 33 — התקרבות לטירה
  { x: 52.5, y: 14.8 }, // 34
  { x: 50.0, y: 12.5 }, // 35
  { x: 48.5, y: 10.5 }, // 36
  { x: 50.5, y: 8.8 },  // 37
  { x: 51.5, y: 7.2 },  // 38 — שער הטירה
];

export const START_POS: Pt = { x: 50.0, y: 97.8 };
export const TROPHY_POS: Pt = { x: 51.5, y: 5.5 };
export const CLOUD_COVER: Pt = { x: 52.0, y: 3.2 };

export function stationCount(): number {
  return UNITS.reduce((n, u) => n + u.activities.length, 0);
}

/**
 * דגימה מחדש של השביל המכוון-ידנית לכל מספר תחנות:
 * שומרים על צורת המסלול, מפזרים N נקודות במרווחים שווים לאורכו.
 */
function resamplePath(pts: Pt[], n: number): Pt[] {
  if (n <= 0) return [];
  if (n === pts.length) return pts.map((p) => ({ ...p }));
  const dist = [0];
  for (let i = 1; i < pts.length; i++) {
    dist.push(dist[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = dist[dist.length - 1];
  const out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const t = (k / Math.max(1, n - 1)) * total;
    let i = 1;
    while (i < dist.length - 1 && dist[i] < t) i++;
    const seg = dist[i] - dist[i - 1] || 1;
    const f = (t - dist[i - 1]) / seg;
    out.push({
      x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
      y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
    });
  }
  return out;
}

export function defaultStationPositions(): Pt[] {
  return resamplePath(STATION_POS, stationCount());
}

export function loadStationPositions(): Pt[] {
  try {
    const raw = localStorage.getItem(LS_PATH);
    if (!raw) return defaultStationPositions();
    const parsed = JSON.parse(raw) as Pt[];
    if (!Array.isArray(parsed) || parsed.length !== stationCount()) return defaultStationPositions();
    return parsed.map((p) => ({ x: Number(p.x), y: Number(p.y) }));
  } catch {
    return defaultStationPositions();
  }
}

export function saveStationPositions(pts: Pt[]): void {
  localStorage.setItem(LS_PATH, JSON.stringify(pts));
  window.dispatchEvent(new Event('agol-path'));
}

export function clearStationPositions(): void {
  localStorage.removeItem(LS_PATH);
  window.dispatchEvent(new Event('agol-path'));
}

/** מרכז אופקי משוער של השביל על התמונה (%) — למיקוד במובייל */
export const PATH_FOCUS_X = 50;

export interface BoardSize {
  /** רוחב לוח המפה (יכול להיות רחב מהמסך במובייל) */
  w: number;
  h: number;
  /** רוחב חלון התצוגה */
  viewW: number;
  /** מצב מובייל/צר — לוח גדול מהמסך, נקודות קטנות יותר */
  compact: boolean;
  /** scrollLeft שממרכז את השביל בחלון */
  scrollLeft: number;
}

/**
 * גודל לוח המפה.
 * בדסקטופ: רוחב = מסך, גובה לפי יחס התמונה.
 * במובייל: רוחב וירטואלי גדול יותר → גובה גדול יותר → מרחב בין תחנות,
 * עם גלילה אופקית אמיתית (LTR) אל מרכז השביל.
 */
export function boardSize(): BoardSize {
  const viewW = Math.max(320, window.innerWidth);
  const compact = viewW < 720;

  let w: number;
  if (compact) {
    const nGaps = Math.max(1, stationCount() - 1);
    const spanY = 0.88;
    const targetGap = 48;
    const minH = Math.round((nGaps * targetGap) / spanY);
    const fromGaps = Math.round(minH / BG_RATIO);
    w = Math.min(1180, Math.max(980, fromGaps, Math.round(viewW * 2.55)));
  } else {
    w = viewW;
  }

  const h = Math.round(w * BG_RATIO);
  const scrollLeft = compact
    ? Math.max(0, Math.min(w - viewW, w * (PATH_FOCUS_X / 100) - viewW / 2))
    : 0;

  return { w, h, viewW, compact, scrollLeft };
}

/** ממרכז את אזור השביל (או תחנה) בגלילה האופקית */
export function scrollBoardToFocus(
  scroller: HTMLElement | null,
  boardW: number,
  viewW: number,
  focusXPercent = PATH_FOCUS_X,
) {
  if (!scroller || boardW <= viewW) return;
  const left = Math.max(0, Math.min(boardW - viewW, boardW * (focusXPercent / 100) - viewW / 2));
  scroller.scrollLeft = left;
}

export function positionsToTs(pts: Pt[]): string {
  const lines = pts.map((p, i) => `  { x: ${p.x.toFixed(1)}, y: ${p.y.toFixed(1)} }, // ${i + 1}`);
  return `export const STATION_POS: Pt[] = [\n${lines.join('\n')}\n];\n`;
}
