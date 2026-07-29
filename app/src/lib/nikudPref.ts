/** העדפת הצגת ניקוד — כמו מסלול חופשי, לשליטה מקומית */
const LS = 'agol_show_nikud';

/** ברירת מחדל: עם ניקוד */
export function isNikudEnabled(): boolean {
  try {
    return localStorage.getItem(LS) !== 'off';
  } catch {
    return true;
  }
}

export function setNikudEnabled(on: boolean): void {
  localStorage.setItem(LS, on ? 'on' : 'off');
  window.dispatchEvent(new Event('agol-nikud'));
}
