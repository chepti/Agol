import { UNITS } from '../data/units';

export interface Pt { x: number; y: number }

// ‎?v=3 — רקע מסלול חדש (כפר/פארק עם טירה)
export const BG = '/agol/bg-journey.webp?v=3';
export const BG_TINY = '/agol/bg-journey-tiny.webp?v=3';
/** יחס גובה/רוחב של bg-journey.webp (2816×5888 → 1400×2927) */
export const BG_RATIO = 2927 / 1400;
export const UNIT_COLORS = ['#0d9488', '#f59e0b', '#8b5cf6', '#e05252', '#3b82f6', '#ec4899', '#16a34a', '#a16207', '#d97706', '#0891b2', '#c026d3', '#4d7c0f', '#b45309'];

/** גרסה — מתעלמים משמירות ישנות אחרי הוספת פעילויות */
export const LS_PATH = 'agol_station_pos_v9';

/** מיקומי 43 התחנות — הותאמו ידנית על השביל החדש */
export const STATION_POS: Pt[] = [
  { x: 30.1, y: 97.3 }, // 1
  { x: 36.3, y: 96.5 }, // 2
  { x: 43.7, y: 94.3 }, // 3
  { x: 49.5, y: 93.0 }, // 4
  { x: 58.4, y: 92.6 }, // 5
  { x: 61.3, y: 89.9 }, // 6
  { x: 62.6, y: 87.2 }, // 7
  { x: 57.5, y: 85.1 }, // 8
  { x: 50.7, y: 81.4 }, // 9
  { x: 51.7, y: 77.9 }, // 10
  { x: 60.9, y: 75.8 }, // 11
  { x: 68.9, y: 74.6 }, // 12
  { x: 77.6, y: 71.4 }, // 13
  { x: 71.5, y: 68.9 }, // 14
  { x: 66.4, y: 67.8 }, // 15
  { x: 59.8, y: 66.5 }, // 16
  { x: 52.3, y: 65.1 }, // 17
  { x: 38.0, y: 64.3 }, // 18
  { x: 30.3, y: 62.0 }, // 19
  { x: 37.9, y: 57.9 }, // 20
  { x: 38.2, y: 61.9 }, // 21
  { x: 46.7, y: 62.6 }, // 22
  { x: 62.8, y: 64.9 }, // 23
  { x: 73.2, y: 65.1 }, // 24
  { x: 79.6, y: 62.6 }, // 25
  { x: 79.7, y: 58.4 }, // 26
  { x: 70.3, y: 54.5 }, // 27
  { x: 63.0, y: 52.4 }, // 28
  { x: 63.3, y: 47.2 }, // 29
  { x: 58.0, y: 44.2 }, // 30
  { x: 49.1, y: 42.5 }, // 31
  { x: 44.3, y: 41.0 }, // 32
  { x: 50.0, y: 38.9 }, // 33
  { x: 50.3, y: 36.4 }, // 34
  { x: 44.7, y: 34.4 }, // 35
  { x: 39.4, y: 32.6 }, // 36
  { x: 44.0, y: 31.0 }, // 37
  { x: 51.7, y: 28.7 }, // 38
  { x: 34.3, y: 25.8 }, // 39
  { x: 25.4, y: 24.4 }, // 40
  { x: 34.8, y: 20.6 }, // 41
  { x: 52.7, y: 16.9 }, // 42
  { x: 54.1, y: 12.6 }, // 43
];

export const START_POS: Pt = { x: 28.0, y: 98.6 };
export const TROPHY_POS: Pt = { x: 54.1, y: 10.0 };
export const CLOUD_COVER: Pt = { x: 55.0, y: 6.5 };

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
