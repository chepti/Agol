import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { UNITS } from '../data/units';
import type { Unit, Activity } from '../data/types';
import type { ProgressData } from '../lib/api';
import { unitUnlocked, isSkipped } from '../lib/progressUtil';
import { starsFor } from '../games/ui';
import { ACTIVITY_ICONS, Lock, Check, Star3D, Trophy } from '../ui/icons';
import {
  BG, BG_TINY, UNIT_COLORS, TROPHY_POS, START_POS, CLOUD_COVER,
  boardSize, scrollBoardToFocus, loadStationPositions, type Pt,
} from '../lib/pathLayout';
import { nav } from '../App';

interface Station {
  unit: Unit;
  unitIndex: number;
  act: Activity;
  actIndex: number;
  globalIndex: number;
  pos: Pt;
}

/** כוכבים בקשת מעל העיגול */
function StarArc({ count, compact }: { count: number; compact: boolean }) {
  const angles = [-30, 0, 30];
  const radius = compact ? 16 : 22;
  return (
    <div className="trail-star-arc" aria-hidden>
      {angles.map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const x = Math.sin(a) * radius;
        const y = -Math.cos(a) * radius + 1;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `translate(-50%, -50%) rotate(${deg * 0.3}deg)`,
            }}
          >
            <Star3D filled={i < count} size={compact ? (i === 1 ? 16 : 14) : (i === 1 ? 22 : 19)} />
          </span>
        );
      })}
    </div>
  );
}

export default function JourneyTrail({ progress }: { progress: ProgressData }) {
  const [size, setSize] = useState(boardSize);
  const [positions, setPositions] = useState<Pt[]>(() => loadStationPositions());
  const [bgReady, setBgReady] = useState(false);
  const [showPanHint, setShowPanHint] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setPositions(loadStationPositions());
    window.addEventListener('agol-path', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('agol-path', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.src = BG;
    img.onload = () => { if (!cancelled) setBgReady(true); };
    if (img.complete) setBgReady(true);
    return () => { cancelled = true; };
  }, []);

  const stations: Station[] = useMemo(() => {
    const flat: Omit<Station, 'pos'>[] = [];
    UNITS.forEach((unit, unitIndex) =>
      unit.activities.forEach((act, actIndex) =>
        flat.push({ unit, unitIndex, act, actIndex, globalIndex: flat.length })
      )
    );
    return flat.map((s, i) => ({ ...s, pos: positions[i] || { x: 50, y: 50 } }));
  }, [positions]);

  const unitFlags = useMemo(() => {
    const flags: { unitIndex: number; pos: Pt; title: string; color: string }[] = [];
    for (let ui = 0; ui < UNITS.length; ui++) {
      const first = stations.find((s) => s.unitIndex === ui);
      if (!first) continue;
      const side = ui % 2 === 0 ? -1 : 1;
      flags.push({
        unitIndex: ui,
        title: UNITS[ui].title,
        color: UNIT_COLORS[ui],
        pos: {
          x: Math.min(84, Math.max(16, first.pos.x + side * (size.compact ? 8 : 6))),
          y: Math.max(2, first.pos.y - 1.8),
        },
      });
    }
    return flags;
  }, [stations, size.compact]);

  useEffect(() => {
    const onResize = () => setSize(boardSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!size.compact) {
      setShowPanHint(false);
      return;
    }
    if (sessionStorage.getItem('agol_pan_hint') === '1') return;
    setShowPanHint(true);
    const t = window.setTimeout(() => {
      setShowPanHint(false);
      sessionStorage.setItem('agol_pan_hint', '1');
    }, 4200);
    return () => window.clearTimeout(t);
  }, [size.compact]);

  // מיקוד אופקי על השביל + גלילה אנכית לתחתית / לתחנה
  useLayoutEffect(() => {
    const focusH = (xPercent?: number) =>
      scrollBoardToFocus(scrollerRef.current, size.w, size.viewW, xPercent);

    const focusId = sessionStorage.getItem('agol_focus_act');
    if (focusId) {
      sessionStorage.removeItem('agol_focus_act');
      const el = document.getElementById(`station-${focusId}`);
      if (el) {
        const st = stations.find((s) => s.act.id === focusId);
        focusH(st?.pos.x);
        requestAnimationFrame(() => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
        return;
      }
    }

    const toBottom = () => {
      focusH();
      const top = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        size.h
      );
      window.scrollTo(0, top);
    };
    toBottom();
    const t1 = window.setTimeout(toBottom, 0);
    const t2 = window.setTimeout(toBottom, 120);
    const t3 = window.setTimeout(toBottom, 400);
    const img = new Image();
    img.src = BG;
    img.onload = toBottom;
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
    // stations נקרא רק לפתיחה מפעילות — לא כתלות (מונע קפיצות בגלילה)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.h, size.w, size.viewW]);

  const isOpen = (s: Station): boolean => {
    if (progress.freeNav) return true;
    if (!unitUnlocked(progress, s.unitIndex)) return false;
    if (s.actIndex === 0) return true;
    return !!progress.completed[s.unit.activities[s.actIndex - 1].id];
  };

  const currentIdx = stations.findIndex((s) => isOpen(s) && !progress.completed[s.act.id]);
  const allDone = currentIdx === -1 && stations.every((s) => progress.completed[s.act.id]);
  const { compact } = size;

  const openPlay = (s: Station) => {
    sessionStorage.setItem('agol_focus_act', s.act.id);
    nav(`/play/${s.unit.id}/${s.act.id}`);
  };

  const nodeSize = (isCurrent: boolean) => {
    if (compact) return isCurrent ? 34 : 28;
    return isCurrent ? 48 : 42;
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: size.h,
        background: 'linear-gradient(180deg, #c5e4a8 0%, #8ec96a 55%, #6faf4a 100%)',
      }}
    >
      {/*
        direction:ltr חובה — ב-RTL הדפדפן מצמיד לוח רחב לימין והשביל נעלם בצד.
        overflow-x:auto = גלילה אופקית אמיתית שאפשר להחליק באצבע.
      */}
      <div
        ref={scrollerRef}
        className="trail-h-scroll"
        onScroll={() => {
          if (showPanHint) {
            setShowPanHint(false);
            sessionStorage.setItem('agol_pan_hint', '1');
          }
        }}
        style={{
          width: '100%',
          overflowX: compact ? 'auto' : 'hidden',
          overflowY: 'hidden',
          direction: 'ltr',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: size.w,
            height: size.h,
            direction: 'ltr',
            margin: 0,
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${BG_TINY})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center bottom',
              backgroundRepeat: 'no-repeat',
              filter: 'blur(10px) saturate(1.05)',
              transform: 'scale(1.06)',
              opacity: bgReady ? 0 : 1,
              transition: 'opacity 0.35s ease',
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${BG})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center bottom',
              backgroundRepeat: 'no-repeat',
              opacity: bgReady ? 1 : 0,
              transition: 'opacity 0.5s ease',
              pointerEvents: 'none',
            }}
          />

          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: `${CLOUD_COVER.x}%`,
              top: `${CLOUD_COVER.y}%`,
              transform: 'translate(-50%, -50%)',
              width: compact ? '12%' : '10%',
              height: compact ? '4.2%' : '3.8%',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <svg viewBox="0 0 180 80" width="100%" height="100%" style={{ overflow: 'visible' }}>
              <ellipse cx="90" cy="40" rx="50" ry="26" fill="rgba(253,250,240,0.97)" />
              <ellipse cx="62" cy="48" rx="34" ry="18" fill="rgba(253,250,240,0.95)" />
              <ellipse cx="118" cy="46" rx="36" ry="20" fill="rgba(253,250,240,0.95)" />
            </svg>
          </div>

          <Marker pos={START_POS} ground={false}>
            <div
              style={{
                background: '#7d5226',
                color: '#ffefc9',
                borderRadius: compact ? 9 : 11,
                padding: compact ? '4px 10px' : '6px 16px',
                fontSize: compact ? 12 : 14,
                fontWeight: 800,
                border: '3px solid #5d3b18',
                boxShadow: '0 4px 10px rgba(30,70,20,0.45)',
                whiteSpace: 'nowrap',
              }}
            >
              🚩 מתחילים כאן!
            </div>
          </Marker>

          <Marker pos={TROPHY_POS} ground={false}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: compact ? 44 : 58,
                  height: compact ? 44 : 58,
                  borderRadius: '50%',
                  background: allDone
                    ? 'radial-gradient(circle at 34% 30%, #fff3b8, #f3c53d 75%)'
                    : 'radial-gradient(circle at 34% 30%, rgba(255,255,255,0.92), rgba(233,217,178,0.92) 75%)',
                  border: compact ? '3px solid #b8860b' : '4px solid #b8860b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 5px 14px rgba(30,70,20,0.45)',
                  margin: '0 auto',
                }}
              >
                <Trophy size={compact ? 22 : 28} color="#b8860b" strokeWidth={2.2} />
              </div>
              <div style={{
                marginTop: 4,
                background: 'rgba(125,82,38,0.95)',
                color: '#ffefc9',
                borderRadius: 9,
                padding: compact ? '2px 8px' : '2px 11px',
                fontSize: compact ? 11 : 12,
                fontWeight: 800,
                display: 'inline-block',
              }}>
                {allDone ? '🎉 סיימת!' : 'סוף המסע'}
              </div>
            </div>
          </Marker>

          {unitFlags.map((f) => (
            <Marker key={`flag-${f.unitIndex}`} pos={f.pos} ground={false}>
              <div
                style={{
                  background: f.color,
                  color: '#fff',
                  borderRadius: 9,
                  padding: compact ? '3px 7px' : '4px 10px',
                  fontSize: compact ? 10.5 : 12,
                  fontWeight: 800,
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 3px 8px rgba(20,60,20,0.4)',
                  whiteSpace: 'nowrap',
                  maxWidth: compact ? 96 : 130,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {f.unitIndex + 1}. {f.title}
              </div>
            </Marker>
          ))}

          {stations.map((s) => {
            const open = isOpen(s);
            const done = !!progress.completed[s.act.id];
            const skipped = isSkipped(progress, s.act.id);
            const isCurrent = s.globalIndex === currentIdx;
            const color = UNIT_COLORS[s.unitIndex];
            const rec = progress.completed[s.act.id];
            const stars = rec && !skipped ? starsFor(rec.score, rec.max) : 0;
            const Icon = ACTIVITY_ICONS[s.act.type] || ACTIVITY_ICONS.quiz;

            let bg = 'rgba(255,255,255,0.97)';
            let ring = color;
            if (!open) { bg = 'rgba(226,229,223,0.94)'; ring = '#8fa088'; }
            else if (done && !skipped) { bg = color; }

            const ns = nodeSize(isCurrent);

            return (
              <Marker key={s.act.id} pos={s.pos} className="trail-node-wrap" ground id={`station-${s.act.id}`}>
                {done && !skipped && <StarArc count={stars} compact={compact} />}

                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -3,
                    width: ns * 0.8,
                    height: 10,
                    transform: 'translateX(-50%)',
                    background: 'radial-gradient(ellipse, rgba(40,60,20,0.4) 0%, rgba(40,60,20,0) 70%)',
                    pointerEvents: 'none',
                  }}
                />

                <button
                  onClick={() => open && openPlay(s)}
                  aria-label={s.act.title}
                  style={{
                    width: ns,
                    height: ns,
                    borderRadius: '50%',
                    border: `${compact ? 2.5 : 3.5}px solid ${done && !skipped ? '#ffffff' : ring}`,
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: open ? 'pointer' : 'default',
                    boxShadow: isCurrent
                      ? `0 0 0 ${compact ? 4 : 5}px ${color}55, 0 5px 10px rgba(20,60,20,0.45)`
                      : '0 4px 10px rgba(20,60,20,0.4)',
                    animation: isCurrent ? 'trail-pulse 1.8s ease-in-out infinite' : 'none',
                    transition: 'transform 0.15s',
                    position: 'relative',
                    overflow: 'visible',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => open && (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {!open ? (
                    <Lock size={compact ? 12 : 16} color="#7c8873" />
                  ) : (
                    <Icon size={compact ? 14 : 19} color={done && !skipped ? '#fff' : color} strokeWidth={2.3} />
                  )}

                  {done && !skipped && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: -3,
                        left: -3,
                        width: compact ? 13 : 16,
                        height: compact ? 13 : 16,
                        borderRadius: '50%',
                        background: '#fff',
                        border: `2px solid ${color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={compact ? 7 : 9} color={color} strokeWidth={3.4} />
                    </span>
                  )}
                </button>

                <div className="trail-tip">
                  <div style={{ fontWeight: 800, fontSize: 13.5 }}>{s.act.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.88, marginTop: 5, lineHeight: 1.4 }}>
                    {s.act.instructions}
                  </div>
                </div>
              </Marker>
            );
          })}
        </div>
      </div>

      {compact && showPanHint && (
        <p
          aria-hidden
          style={{
            position: 'fixed',
            top: 78,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9,
            margin: 0,
            padding: '5px 14px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            color: 'rgba(74,52,22,0.9)',
            background: 'rgba(255,254,247,0.92)',
            border: '1.5px solid rgba(125,82,38,0.4)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 3px 10px rgba(30,70,20,0.2)',
            direction: 'rtl',
          }}
        >
          גללו למעלה במסע · החליקו הצידה לשביל
        </p>
      )}
    </div>
  );
}

function Marker({
  pos,
  children,
  className,
  ground = true,
  id,
}: {
  pos: { x: number; y: number };
  children: React.ReactNode;
  className?: string;
  ground?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={className}
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: ground ? 'translate(-50%, -82%)' : 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'visible',
      }}
    >
      {children}
    </div>
  );
}
