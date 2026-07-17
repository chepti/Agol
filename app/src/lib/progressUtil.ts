import { UNITS } from '../data/units';
import type { Unit } from '../data/types';
import type { ProgressData } from './api';

export function activityDone(p: ProgressData, activityId: string): boolean {
  return !!p.completed[activityId];
}

export function unitDoneCount(p: ProgressData, unit: Unit): number {
  return unit.activities.filter((a) => activityDone(p, a.id)).length;
}

export function unitCompleted(p: ProgressData, unit: Unit): boolean {
  return unitDoneCount(p, unit) >= unit.activities.length;
}

/** יחידה פתוחה אם היא הראשונה, שהקודמת הושלמה, או שמופעל מסלול חופשי */
export function unitUnlocked(p: ProgressData, index: number): boolean {
  if (p.freeNav) return true;
  if (index === 0) return true;
  return unitCompleted(p, UNITS[index - 1]);
}

/** רשומת "דילוג" — פעילות שסומנה כ'בוחר לדלג' */
export const SKIP_RECORD = { score: 0, max: 1 };

export function isSkipped(p: ProgressData, activityId: string): boolean {
  const r = p.completed[activityId];
  return !!r && r.max === 1 && r.score === 0;
}

export function overallPercent(p: ProgressData): number {
  const total = UNITS.reduce((n, u) => n + u.activities.length, 0);
  const done = UNITS.reduce((n, u) => n + unitDoneCount(p, u), 0);
  return Math.round((done / total) * 100);
}

export function allCompleted(p: ProgressData): boolean {
  return UNITS.every((u) => unitCompleted(p, u));
}
