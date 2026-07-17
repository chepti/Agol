import React from 'react';

const FEEDBACK_MAIL = 'chepti@gmail.com';

export function feedbackMailto(subject = 'משוב — מסע כתב היד') {
  return `mailto:${FEEDBACK_MAIL}?subject=${encodeURIComponent(subject)}`;
}

/** כפתור משוב קטן — למורים ולתרגול חופשי */
export function FeedbackButton({
  compact = false,
  light = false,
  style,
}: {
  compact?: boolean;
  /** טקסט בהיר על רקע כהה/תמונה */
  light?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <a
      href={feedbackMailto()}
      className={compact ? 'btn small' : 'btn small'}
      style={{
        textDecoration: 'none',
        fontSize: compact ? 13 : 14,
        fontWeight: 700,
        padding: compact ? '6px 12px' : '8px 14px',
        background: light ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.92)',
        color: light ? '#fff' : 'var(--teal-dark)',
        border: light ? '1.5px solid rgba(255,255,255,0.55)' : '1.5px solid rgba(15,118,110,0.35)',
        boxShadow: light ? 'none' : 'var(--shadow)',
        backdropFilter: light ? 'blur(6px)' : undefined,
        ...style,
      }}
    >
      משוב
    </a>
  );
}

/** קרדיט קבוע — למטה מימין */
export function SiteCredit({
  light = false,
  style,
}: {
  light?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 12,
        lineHeight: 1.45,
        textAlign: 'right',
        color: light ? 'rgba(255,255,255,0.78)' : 'var(--ink-soft)',
        textShadow: light ? '0 1px 6px rgba(0,0,0,0.35)' : undefined,
        ...style,
      }}
    >
      נוצר ע״י חפציה בן ארצי · חולמים תקשוב ·{' '}
      <a
        href="https://chepti.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: light ? 'rgba(255,255,255,0.95)' : 'var(--teal-dark)',
          fontWeight: 700,
          textDecoration: 'underline',
          textUnderlineOffset: 2,
        }}
      >
        chepti.com
      </a>
    </p>
  );
}
