import { useState } from 'react';
import styles from './MiniCalendar.module.css';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function MiniCalendar({ tripDates = [] }) {
  const today = new Date();
  const [current, setCurrent] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const { year, month } = current;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = () =>
    setCurrent((c) =>
      c.month === 0
        ? { year: c.year - 1, month: 11 }
        : { year: c.year, month: c.month - 1 }
    );
  const next = () =>
    setCurrent((c) =>
      c.month === 11
        ? { year: c.year + 1, month: 0 }
        : { year: c.year, month: c.month + 1 }
    );

  const isToday = (d) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const isTripDay = (d) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return tripDates.includes(dateStr);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={prev} aria-label="Previous month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className={styles.monthYear}>
          {MONTHS[month]} {year}
        </span>
        <button className={styles.navBtn} onClick={next} aria-label="Next month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div className={styles.grid}>
        {DAYS.map((d) => (
          <div key={d} className={styles.dayName}>{d}</div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={[
              styles.cell,
              d === null ? styles.empty : '',
              d && isToday(d) ? styles.today : '',
              d && isTripDay(d) ? styles.tripDay : '',
            ].join(' ')}
          >
            {d}
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendDot} style={{ background: 'var(--color-tan)' }} />
        <span className={styles.legendLabel}>Today</span>
        <span className={styles.legendDot} style={{ background: 'var(--color-accent-hover)', marginLeft: '12px' }} />
        <span className={styles.legendLabel}>Trip</span>
      </div>
    </div>
  );
}
