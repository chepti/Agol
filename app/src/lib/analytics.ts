// שכבת מעקב דקה מעל gtag (Google Analytics 4).
// התג עצמו נטען ב-index.html; כאן שולחים "צפיות עמוד" וירטואליות למעברי המסכים.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** שולח צפיית עמוד וירטואלית עבור מסך ה-SPA הנוכחי */
export function trackPage(hash: string): void {
  if (typeof window.gtag !== 'function') return;
  const path = '/agol/' + (hash.replace(/^#/, '') || '/');
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.origin + window.location.pathname + hash,
    page_title: document.title,
  });
}
