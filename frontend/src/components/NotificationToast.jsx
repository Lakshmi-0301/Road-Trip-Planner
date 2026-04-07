/**
 * NotificationToast — Road Trip Planner
 *
 * Renders a stacked list of toast notifications in the bottom-right corner.
 * Matches the app's dark tan palette exactly.
 * Each toast has an icon, title, description, and a dismiss button.
 * Progress bar depletes over DURATION ms.
 */

import { useEffect, useState } from 'react';
import styles from './NotificationToast.module.css';

const DURATION = 5000;

// ── Icons per type ────────────────────────────────────────────────────────────
const TypeIcon = ({ type }) => {
  if (type === 'weather') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  );
  if (type === 'traffic') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
  if (type === 'hazard') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  if (type === 'success') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
  if (type === 'reminder') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
  if (type === 'deleted') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    </svg>
  );
  if (type === 'info') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="8"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
    </svg>
  );
  // tip
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
};

// Color config per type
const TYPE_CONFIG = {
  weather:  { color: '#6a9fd8', bg: 'rgba(106,159,216,0.1)',  border: 'rgba(106,159,216,0.25)' },
  traffic:  { color: '#e09a4a', bg: 'rgba(224,154,74,0.1)',   border: 'rgba(224,154,74,0.25)'  },
  hazard:   { color: '#e05c5c', bg: 'rgba(224,92,92,0.1)',    border: 'rgba(224,92,92,0.25)'   },
  success:  { color: '#6dbf8a', bg: 'rgba(109,191,138,0.1)', border: 'rgba(109,191,138,0.25)' },
  deleted:  { color: '#e05c5c', bg: 'rgba(224,92,92,0.08)',   border: 'rgba(224,92,92,0.2)'   },
  reminder: { color: '#aa9371', bg: 'rgba(170,147,113,0.1)',  border: 'rgba(170,147,113,0.25)' },
  info:     { color: '#aa9371', bg: 'rgba(170,147,113,0.1)',  border: 'rgba(170,147,113,0.25)' },
  tip:      { color: '#aa9371', bg: 'rgba(170,147,113,0.08)', border: 'rgba(170,147,113,0.2)'  },
};

// ── Single toast ──────────────────────────────────────────────────────────────
function Toast({ id, title, desc, type, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100);
      setProgress(pct);
      if (pct > 0) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={styles.toast}
      style={{ '--toast-color': cfg.color, '--toast-bg': cfg.bg, '--toast-border': cfg.border }}
    >
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Content */}
      <div className={styles.toastInner}>
        <div className={styles.toastIcon}>
          <TypeIcon type={type} />
        </div>
        <div className={styles.toastText}>
          <p className={styles.toastTitle}>{title}</p>
          {desc && <p className={styles.toastDesc}>{desc}</p>}
        </div>
        <button className={styles.dismissBtn} onClick={() => onDismiss(id)} aria-label="Dismiss">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Stack ─────────────────────────────────────────────────────────────────────
export default function NotificationToast({ queue, onDismiss }) {
  if (!queue.length) return null;
  return (
    <div className={styles.stack}>
      {queue.map(n => (
        <Toast key={n.id} {...n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}