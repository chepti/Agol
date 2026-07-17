import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UNITS } from '../data/units';
import {
  BG, UNIT_COLORS, boardSize, loadStationPositions, saveStationPositions,
  clearStationPositions, defaultStationPositions, positionsToTs,
  START_POS, TROPHY_POS, type Pt,
} from '../lib/pathLayout';
import { ACTIVITY_ICONS } from '../ui/icons';
import { nav } from '../App';

/**
 * עורך התאמת מסלול — גוררים תחנות על התמונה, שומרים, מעתיקים לקוד.
 * כתובת: #/path-edit
 */

export default function PathEdit() {
  const [size, setSize] = useState(boardSize);
  const [pts, setPts] = useState<Pt[]>(() => loadStationPositions());
  const [drag, setDrag] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const stations = useMemo(() => {
    const list: { id: string; title: string; unitIndex: number; unitTitle: string; type: string }[] = [];
    UNITS.forEach((u, ui) => u.activities.forEach((a) => {
      list.push({ id: a.id, title: a.title, unitIndex: ui, unitTitle: u.title, type: a.type });
    }));
    return list;
  }, []);

  useEffect(() => {
    const onResize = () => setSize(boardSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    // כניסה לתחתית כמו במפה + מיקוד אופקי על השביל
    if (scrollerRef.current && size.compact) {
      scrollerRef.current.scrollLeft = size.scrollLeft;
    }
    const t = window.setTimeout(() => {
      if (scrollerRef.current && size.compact) {
        scrollerRef.current.scrollLeft = size.scrollLeft;
      }
      window.scrollTo(0, Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    }, 60);
    return () => window.clearTimeout(t);
  }, [size.h, size.compact, size.scrollLeft]);

  const clientToPct = useCallback((clientX: number, clientY: number): Pt | null => {
    const el = boardRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 100;
    const y = ((clientY - r.top) / r.height) * 100;
    return {
      x: Math.min(98, Math.max(2, x)),
      y: Math.min(99, Math.max(1, y)),
    };
  }, []);

  useEffect(() => {
    if (drag === null) return;
    const move = (e: PointerEvent) => {
      const p = clientToPct(e.clientX, e.clientY);
      if (!p) return;
      setPts((prev) => prev.map((pt, i) => (i === drag ? p : pt)));
    };
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag, clientToPct]);

  const save = () => {
    saveStationPositions(pts);
    setCopied(false);
  };

  const copy = async () => {
    saveStationPositions(pts);
    const text = positionsToTs(pts);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt('העתיקו את הקואורדינטות:', text);
    }
  };

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{ background: '#1e293b', minHeight: '100vh', color: '#fff' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(15,23,42,0.95)',
          padding: '10px 12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          borderBottom: '1px solid #334155',
        }}
      >
        <strong style={{ marginLeft: 'auto' }}>עורך מסלול — גררו את העיגולים על השביל</strong>
        <button className="btn small" type="button" onClick={save}>💾 שמירה</button>
        <button className="btn small secondary" type="button" onClick={copy}>
          {copied ? '✓ הועתק' : '📋 העתקת קוד'}
        </button>
        <button
          className="btn small"
          type="button"
          style={{ background: '#64748b' }}
          onClick={() => { clearStationPositions(); setPts(defaultStationPositions()); }}
        >
          איפוס
        </button>
        <button className="btn small" type="button" style={{ background: 'transparent', boxShadow: 'none', color: '#94a3b8' }} onClick={() => nav('/map')}>
          → למפה
        </button>
      </div>

      <p style={{ padding: '8px 14px', margin: 0, fontSize: 13.5, color: '#cbd5e1', textAlign: 'center' }}>
        גררו כל תחנה למרכז השביל. אחרי שמירה המפה הרגילה משתמשת במיקומים האלה.
        לחצו «העתקת קוד» ושלחו לי / הדביקו בשיחה — ואעדכן בקובץ.
      </p>

      <div
        ref={scrollerRef}
        style={{
          width: '100%',
          overflowX: size.compact ? 'auto' : 'hidden',
          direction: 'ltr',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          ref={boardRef}
          style={{
            position: 'relative',
            width: size.w,
            height: size.h,
            margin: 0,
            backgroundImage: `url(${BG})`,
            backgroundSize: '100% 100%',
            touchAction: 'none',
            userSelect: 'none',
            direction: 'ltr',
          }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <path d={pathD} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.35" strokeDasharray="1.2 0.8" />
            <path d={pathD} fill="none" stroke="rgba(15,118,110,0.75)" strokeWidth="0.2" />
          </svg>

          <div style={{ position: 'absolute', left: `${START_POS.x}%`, top: `${START_POS.y}%`, transform: 'translate(-50%,-50%)', fontSize: 12, background: '#7d5226', padding: '3px 8px', borderRadius: 8 }}>
            התחלה
          </div>
          <div style={{ position: 'absolute', left: `${TROPHY_POS.x}%`, top: `${TROPHY_POS.y}%`, transform: 'translate(-50%,-50%)', fontSize: 12, background: '#b8860b', padding: '3px 8px', borderRadius: 8 }}>
            יעד
          </div>

          {stations.map((s, i) => {
            const p = pts[i];
            const color = UNIT_COLORS[s.unitIndex];
            const Icon = ACTIVITY_ICONS[s.type] || ACTIVITY_ICONS.quiz;
            const active = drag === i;
            return (
              <button
                key={s.id}
                type="button"
                title={`${i + 1}. ${s.title}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                  setDrag(i);
                }}
                style={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: 'translate(-50%, -82%)',
                  width: active ? 48 : 42,
                  height: active ? 48 : 42,
                  borderRadius: '50%',
                  border: `3px solid ${active ? '#fff' : color}`,
                  background: color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  zIndex: active ? 30 : 5,
                  boxShadow: active ? '0 0 0 5px rgba(255,255,255,0.35)' : '0 3px 8px rgba(0,0,0,0.4)',
                  padding: 0,
                }}
              >
                <Icon size={18} color="#fff" strokeWidth={2.4} />
                <span
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#0f172a',
                    border: '2px solid #fff',
                    fontSize: 10,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
