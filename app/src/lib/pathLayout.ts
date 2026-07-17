import { UNITS } from '../data/units';

export interface Pt { x: number; y: number }

export const BG = '/agol/bg-journey.webp';
export const BG_TINY = '/agol/bg-journey-tiny.webp';
export const BG_RATIO = 2413 / 1200;
export const UNIT_COLORS = ['#0d9488', '#f59e0b', '#8b5cf6', '#e05252', '#3b82f6', '#ec4899', '#16a34a', '#a16207', '#d97706', '#0891b2', '#c026d3', '#4d7c0f', '#b45309'];

/** גרסה — מתעלמים משמירות ישנות אם שינינו את ברירת המחדל בקוד */
export const LS_PATH = 'agol_station_pos_v4';

/** מיקומי 32 התחנות — הותאמו ידנית על השביל */
export const STATION_POS: Pt[] = [
  { x: 50.2, y: 97.1 }, // 1
  { x: 53.5, y: 93.8 }, // 2
  { x: 46.5, y: 92.6 }, // 3
  { x: 38.6, y: 89.4 }, // 4
  { x: 32.0, y: 85.6 }, // 5
  { x: 39.0, y: 82.8 }, // 6
  { x: 45.1, y: 80.4 }, // 7
  { x: 52.4, y: 78.2 }, // 8
  { x: 47.8, y: 76.9 }, // 9
  { x: 40.0, y: 74.3 }, // 10
  { x: 40.2, y: 71.0 }, // 11
  { x: 44.7, y: 69.4 }, // 12
  { x: 50.0, y: 68.2 }, // 13
  { x: 59.2, y: 66.6 }, // 14
  { x: 66.7, y: 66.4 }, // 15
  { x: 75.1, y: 66.6 }, // 16
  { x: 67.6, y: 63.6 }, // 17
  { x: 57.5, y: 61.6 }, // 18
  { x: 51.0, y: 60.4 }, // 19
  { x: 58.0, y: 57.6 }, // 20
  { x: 46.1, y: 56.4 }, // 21
  { x: 50.2, y: 54.6 }, // 22
  { x: 53.7, y: 50.6 }, // 23
  { x: 45.5, y: 49.2 }, // 24
  { x: 37.5, y: 47.7 }, // 25
  { x: 45.5, y: 44.5 }, // 26
  { x: 54.5, y: 42.7 }, // 27
  { x: 56.5, y: 39.6 }, // 28
  { x: 64.7, y: 38.0 }, // 29
  { x: 64.3, y: 35.7 }, // 30
  { x: 63.3, y: 33.2 }, // 31
  { x: 66.7, y: 31.1 }, // 32
];

export const START_POS: Pt = { x: 50.2, y: 98.6 };
export const TROPHY_POS: Pt = { x: 66.7, y: 28.0 };
export const CLOUD_COVER: Pt = { x: 58.8, y: 16.2 };

export function stationCount(): number {
  return UNITS.reduce((n, u) => n + u.activities.length, 0);
}

/**
 * דגימה מחדש של השביל המכוון-ידנית לכל מספר תחנות:
 * שומרים על צורת המסלול, מפזרים N נקודות במרווחים שווים לאורכו.
 * כך אפשר להוסיף/להסיר פעילויות בלי לכוון מחדש את המפה.
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
export const PATH_FOCUS_X = 52;

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
    const spanY = 0.66;
    const targetGap = 50;
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
