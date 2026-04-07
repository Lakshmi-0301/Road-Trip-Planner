import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PlanTripModal.module.css';

const CITIES = ['Bangalore', 'Chennai', 'Coimbatore', 'Hyderabad', 'Kochi', 'Mysore', 'Puducherry'];

const ROUTE_OPTIONS = [
  { value: 'scenic',   label: 'Scenic',   desc: 'Picturesque routes through landscapes' },
  { value: 'quick',    label: 'Quick',    desc: 'Fastest path, highways priority' },
  { value: 'balanced', label: 'Balanced', desc: 'Mix of speed and scenery' },
  { value: 'offroad',  label: 'Off-road', desc: 'Adventurous, less-traveled paths' },
];

// Smart departure time suggestions based on route type
const DEPARTURE_SUGGESTIONS = {
  scenic: { time: '06:00', reason: 'Early start to enjoy scenic views in daylight' },
  quick: { time: '07:00', reason: 'Beat morning traffic, reach faster' },
  balanced: { time: '08:00', reason: 'Good balance of daylight and traffic' },
  offroad: { time: '05:30', reason: 'Early start for adventure, avoid night driving' },
};

const today = new Date().toISOString().split('T')[0];

// Convert 24h to 12h format
const to12Hour = (time24) => {
  const [h, m] = time24.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${m} ${ampm}`;
};

// Convert 12h to 24h format
const to24Hour = (time12) => {
  const [time, ampm] = time12.split(' ');
  let [h, m] = time.split(':');
  h = parseInt(h);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
};

export default function PlanTripModal({ onClose, onSubmit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    source: '',
    destination: '',
    startDate: '',
    departureTime: '08:00',
    timeFormat: '24h', // '24h' or '12h'
    people: 1,
    route: 'balanced',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

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

  // Handle time format change
  const handleTimeFormatChange = (newFormat) => {
    if (newFormat === form.timeFormat) return;
    
    let newTime = form.departureTime;
    if (newFormat === '12h') {
      newTime = to12Hour(form.departureTime);
    } else {
      newTime = to24Hour(form.departureTime);
    }
    
    setForm(p => ({ ...p, timeFormat: newFormat, departureTime: newTime }));
  };

  // Handle time input change
  const handleTimeChange = (e) => {
    let value = e.target.value;
    
    if (form.timeFormat === '12h') {
      // Validate 12h format
      if (!/^\d{1,2}:\d{2}\s(AM|PM)$/.test(value)) return;
    }
    
    setForm(p => ({ ...p, departureTime: value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.source) errs.source = 'Select a source city';
    if (!form.destination) errs.destination = 'Select a destination city';
    if (form.source && form.destination && form.source === form.destination)
      errs.destination = 'Destination must differ from source';
    if (!form.startDate) errs.startDate = 'Pick a start date';
    if (!form.departureTime) errs.departureTime = 'Select departure time';
    if (!form.people || form.people < 1) errs.people = 'At least 1 person required';
    if (form.people > 20) errs.people = 'Maximum 20 people';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError(null);
    setLoading(true);
    setSubmitted(true);

    // Convert to 24h format for backend
    const departureTime24h = form.timeFormat === '12h' ? to24Hour(form.departureTime) : form.departureTime;

    // Save trip to local list optimistically
    onSubmit({ ...form, departureTime: departureTime24h });

    // Navigate to result page — TripResult will call the API
    setTimeout(() => {
      onClose();
      navigate('/trip-result', { state: { formData: { ...form, departureTime: departureTime24h } } });
    }, 600);
  };

  const destCities = CITIES.filter((c) => c !== form.source);
  const srcCities = CITIES.filter((c) => c !== form.destination);
  
  const suggestion = DEPARTURE_SUGGESTIONS[form.route];
  const suggestedTime24h = suggestion.time;
  const suggestedTime12h = to12Hour(suggestedTime24h);
  const suggestedTime = form.timeFormat === '24h' ? suggestedTime24h : suggestedTime12h;

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
            <p className={styles.successText}>Launching trip planner...</p>
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

            {/* Time Format Selection */}
            <div className={styles.field}>
              <span className={styles.label}>Time Format</span>
              <div className={styles.timeFormatGrid}>
                <button
                  type="button"
                  className={`${styles.timeFormatBtn} ${form.timeFormat === '24h' ? styles.timeFormatActive : ''}`}
                  onClick={() => handleTimeFormatChange('24h')}
                >
                  24-Hour
                </button>
                <button
                  type="button"
                  className={`${styles.timeFormatBtn} ${form.timeFormat === '12h' ? styles.timeFormatActive : ''}`}
                  onClick={() => handleTimeFormatChange('12h')}
                >
                  12-Hour (AM/PM)
                </button>
              </div>
            </div>

            {/* Departure Time */}
            <div className={styles.field}>
              <label htmlFor="trip-time" className={styles.label}>Departure Time</label>
              {form.timeFormat === '24h' ? (
                <input
                  id="trip-time"
                  type="time"
                  value={form.departureTime}
                  onChange={set('departureTime')}
                  className={`${styles.input} ${errors.departureTime ? styles.fieldError : ''}`}
                />
              ) : (
                <input
                  id="trip-time"
                  type="text"
                  placeholder="HH:MM AM/PM"
                  value={form.departureTime}
                  onChange={handleTimeChange}
                  className={`${styles.input} ${errors.departureTime ? styles.fieldError : ''}`}
                />
              )}
              {errors.departureTime && <p className={styles.err}>{errors.departureTime}</p>}
              
              {/* Smart Suggestion */}
              <div className={styles.timeSuggestion}>
                <span className={styles.suggestionIcon}>💡</span>
                <div>
                  <p className={styles.suggestionTitle}>Suggested: {suggestedTime}</p>
                  <p className={styles.suggestionReason}>{suggestion.reason}</p>
                </div>
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

            {/* API error */}
            {apiError && <p className={styles.err} style={{textAlign:'center'}}>{apiError}</p>}

            {/* Submit */}
            <button
              id="plan-trip-submit-btn"
              type="submit"
              className={styles.planBtn}
              disabled={loading}
            >
              {loading ? (
                <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{width:'14px',height:'14px',border:'2px solid rgba(0,0,0,0.3)',borderTopColor:'#000',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}} />
                  Planning...
                </span>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  Plan Trip
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
