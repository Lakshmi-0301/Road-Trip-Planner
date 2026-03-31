import { useState, useEffect } from 'react';
import styles from './PlanTripModal.module.css';

const CITIES = ['Chennai', 'Coimbatore', 'Hyderabad', 'Kochi', 'Puducherry'];

const ROUTE_OPTIONS = [
  { value: 'scenic',   label: 'Scenic',   desc: 'Picturesque routes through landscapes' },
  { value: 'quick',    label: 'Quick',    desc: 'Fastest path, highways priority' },
  { value: 'balanced', label: 'Balanced', desc: 'Mix of speed and scenery' },
  { value: 'offroad',  label: 'Off-road', desc: 'Adventurous, less-traveled paths' },
];

const today = new Date().toISOString().split('T')[0];

export default function PlanTripModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    source: '',
    destination: '',
    startDate: '',
    people: 1,
    route: 'balanced',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.source) errs.source = 'Select a source city';
    if (!form.destination) errs.destination = 'Select a destination city';
    if (form.source && form.destination && form.source === form.destination)
      errs.destination = 'Destination must differ from source';
    if (!form.startDate) errs.startDate = 'Pick a start date';
    if (!form.people || form.people < 1) errs.people = 'At least 1 person required';
    if (form.people > 20) errs.people = 'Maximum 20 people';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitted(true);
    setTimeout(() => {
      onSubmit(form);
      onClose();
    }, 1200);
  };

  const destCities = CITIES.filter((c) => c !== form.source);
  const srcCities = CITIES.filter((c) => c !== form.destination);

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 id="modal-title" className={styles.modalTitle}>Plan Your Trip</h2>
            <p className={styles.modalSub}>Fill in the details and hit Plan</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {submitted ? (
          <div className={styles.successState}>
            <div className={styles.checkCircle}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className={styles.successText}>Trip planned successfully!</p>
            <p className={styles.successSub}>{form.source} → {form.destination}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Route visual */}
            <div className={styles.routeVisual}>
              <div className={styles.routeNode}>
                <span className={styles.nodeLabel}>From</span>
                <span className={styles.nodeName}>{form.source || '—'}</span>
              </div>
              <div className={styles.routeLine}>
                <svg width="100%" height="20" viewBox="0 0 200 20" preserveAspectRatio="none">
                  <line x1="0" y1="10" x2="200" y2="10" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="6 4"/>
                </svg>
                <div className={styles.routeBadge}>{ROUTE_OPTIONS.find(r => r.value === form.route)?.label}</div>
              </div>
              <div className={styles.routeNode}>
                <span className={styles.nodeLabel}>To</span>
                <span className={styles.nodeName}>{form.destination || '—'}</span>
              </div>
            </div>

            {/* Two-column grid */}
            <div className={styles.grid2}>
              {/* Source */}
              <div className={styles.field}>
                <label htmlFor="trip-source" className={styles.label}>Source</label>
                <div className={`${styles.selectWrap} ${errors.source ? styles.fieldError : ''}`}>
                  <select id="trip-source" value={form.source} onChange={set('source')} className={styles.select}>
                    <option value="">Select city</option>
                    {srcCities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {errors.source && <p className={styles.err}>{errors.source}</p>}
              </div>

              {/* Destination */}
              <div className={styles.field}>
                <label htmlFor="trip-dest" className={styles.label}>Destination</label>
                <div className={`${styles.selectWrap} ${errors.destination ? styles.fieldError : ''}`}>
                  <select id="trip-dest" value={form.destination} onChange={set('destination')} className={styles.select}>
                    <option value="">Select city</option>
                    {destCities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {errors.destination && <p className={styles.err}>{errors.destination}</p>}
              </div>

              {/* Start Date */}
              <div className={styles.field}>
                <label htmlFor="trip-date" className={styles.label}>Trip Start Date</label>
                <input
                  id="trip-date"
                  type="date"
                  min={today}
                  value={form.startDate}
                  onChange={set('startDate')}
                  className={`${styles.input} ${errors.startDate ? styles.fieldError : ''}`}
                />
                {errors.startDate && <p className={styles.err}>{errors.startDate}</p>}
              </div>

              {/* People */}
              <div className={styles.field}>
                <label htmlFor="trip-people" className={styles.label}>Number of Travellers</label>
                <input
                  id="trip-people"
                  type="number"
                  min="1"
                  max="20"
                  value={form.people}
                  onChange={set('people')}
                  className={`${styles.input} ${errors.people ? styles.fieldError : ''}`}
                />
                {errors.people && <p className={styles.err}>{errors.people}</p>}
              </div>
            </div>

            {/* Route preference */}
            <div className={styles.field}>
              <span className={styles.label}>Preferred Route</span>
              <div className={styles.routeGrid}>
                {ROUTE_OPTIONS.map((r) => (
                  <label
                    key={r.value}
                    className={`${styles.routeCard} ${form.route === r.value ? styles.routeSelected : ''}`}
                    htmlFor={`route-${r.value}`}
                  >
                    <input
                      type="radio"
                      id={`route-${r.value}`}
                      name="route"
                      value={r.value}
                      checked={form.route === r.value}
                      onChange={set('route')}
                      className={styles.radioHidden}
                    />
                    <span className={styles.routeCardTitle}>{r.label}</span>
                    <span className={styles.routeCardDesc}>{r.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button id="plan-trip-submit-btn" type="submit" className={styles.planBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Plan Trip
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
