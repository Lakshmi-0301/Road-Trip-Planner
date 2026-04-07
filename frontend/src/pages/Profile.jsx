import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  Map: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Mail: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Lock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Check: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Route: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
      <circle cx="18" cy="5" r="3"/>
    </svg>
  ),
  Car: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/>
      <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    </svg>
  ),
};

// ── Section nav items ─────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'profile',       label: 'Profile',        Icon: Icon.User    },
  { id: 'preferences',   label: 'Preferences',    Icon: Icon.Car     },
  { id: 'notifications', label: 'Notifications',  Icon: Icon.Bell    },
  { id: 'security',      label: 'Security',       Icon: Icon.Shield  },
  { id: 'danger',        label: 'Danger Zone',    Icon: Icon.Trash   },
];

const VEHICLE_TYPES = ['Car', 'SUV', 'Bike', 'Bus', 'Van'];
const FUEL_TYPES    = ['Petrol', 'Diesel', 'Electric', 'CNG'];
const DEFAULT_PREFS = {
  defaultRoute: 'balanced',
  vehicleType:  'Car',
  fuelType:     'Petrol',
  mileage:      15,
  defaultPeople: 1,
  // Trip alerts
  notifyWeather:    true,
  notifyTraffic:    true,
  notifyReminder:   true,
  notifyRoadHazard: true,
  // Trip activity
  notifyTripSaved:    true,
  notifyTripDeleted:  false,
  // System
  notifyNewFeatures:  true,
  notifyTips:         false,
};

const NOTIFICATION_GROUPS = [
  {
    group: 'Trip Alerts',
    desc:  'Real-time warnings during trip planning',
    items: [
      { key: 'notifyWeather',    title: 'Weather alerts',    desc: 'Severe weather warnings on your planned route' },
      { key: 'notifyTraffic',    title: 'Traffic updates',   desc: 'Traffic warnings before your trip date' },
      { key: 'notifyRoadHazard', title: 'Road hazards',      desc: 'Reported accidents or road closures on route' },
      { key: 'notifyReminder',   title: 'Trip reminders',    desc: 'Reminder notification the day before a trip' },
    ],
  },
  {
    group: 'Trip Activity',
    desc:  'Updates when your trips change',
    items: [
      { key: 'notifyTripSaved',   title: 'Trip saved',    desc: 'Confirmation when a new trip is planned and saved' },
      { key: 'notifyTripDeleted', title: 'Trip deleted',  desc: 'Confirmation when a trip is removed from history' },
    ],
  },
  {
    group: 'System',
    desc:  'App updates and tips',
    items: [
      { key: 'notifyNewFeatures', title: 'New features',      desc: 'Be the first to know about new app capabilities' },
      { key: 'notifyTips',        title: 'Travel tips',       desc: 'Occasional road trip tips and suggestions' },
    ],
  },
];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div className={`${styles.toast} ${type === 'error' ? styles.toastError : styles.toastSuccess}`}>
      {type === 'success' ? <Icon.Check /> : '!'}
      {msg}
    </div>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function Avatar({ name, size = 72 }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────
function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const PW_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const PW_COLORS = ['', '#e05c5c', '#e09a4a', '#6a9fd8', '#6dbf8a'];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();

  // Auth
  const [user, setUser]   = useState(null);
  const [trips, setTrips] = useState([]);

  // Active section
  const [active, setActive] = useState('profile');

  // Profile form
  const [profileForm, setProfileForm] = useState({ username: '', email: '' });
  const [profileSaved, setProfileSaved] = useState(false);

  // Password form
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [pwShow, setPwShow]   = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState('');

  // Preferences
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefSaved, setPrefSaved] = useState(false);

  // Toast
  const [toast, setToast]   = useState(null);
  const toastTimer = useRef(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { navigate('/login'); return; }
    try {
      const u = JSON.parse(stored);
      setUser(u);
      setProfileForm({ username: u.username || '', email: u.email || '' });
      const uid = u.id;
      setTrips(JSON.parse(localStorage.getItem(`trips_${uid}`) || '[]'));
      const savedPrefs = JSON.parse(localStorage.getItem(`userPrefs_${uid}`) || 'null');
      if (savedPrefs) setPrefs(p => ({ ...p, ...savedPrefs }));
    } catch { navigate('/login'); }
  }, [navigate]);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleProfileSave = () => {
    if (!profileForm.username.trim()) { showToast('Username cannot be empty', 'error'); return; }
    if (!profileForm.email.trim() || !profileForm.email.includes('@')) { showToast('Enter a valid email', 'error'); return; }
    const updated = { ...user, ...profileForm };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    setProfileSaved(true);
    showToast('Profile updated successfully');
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handlePasswordSave = () => {
    setPwError('');
    if (!pwForm.current) { setPwError('Enter your current password'); return; }
    if (pwForm.next.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    // In a real app: call /api/change-password
    setPwForm({ current: '', next: '', confirm: '' });
    showToast('Password changed successfully');
  };

  const handlePrefSave = () => {
    localStorage.setItem(`userPrefs_${user.id}`, JSON.stringify(prefs));
    setPrefSaved(true);
    showToast('Preferences saved');
    setTimeout(() => setPrefSaved(false), 2000);
  };

  const handleDeleteAccount = () => {
    const uid = user.id;
    localStorage.removeItem(`trips_${uid}`);
    localStorage.removeItem(`savedRoutes_${uid}`);
    localStorage.removeItem(`budgetLog_${uid}`);
    localStorage.removeItem(`userPrefs_${uid}`);
    localStorage.removeItem(`memberSince_${uid}`);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const setPref = (key, val) => setPrefs(p => ({ ...p, [key]: val }));
  const setProfile = (key) => (e) => setProfileForm(p => ({ ...p, [key]: e.target.value }));
  const setPw = (key) => (e) => setPwForm(p => ({ ...p, [key]: e.target.value }));
  const togglePwShow = (key) => setPwShow(p => ({ ...p, [key]: !p[key] }));

  const strength = pwStrength(pwForm.next);

  if (!user) return null;

  // ── Computed stats ───────────────────────────────────────────────────────────
  const memberSince = (() => {
    const stored = localStorage.getItem(`memberSince_${user.id}`);
    if (!stored) {
      const now = new Date().toISOString();
      localStorage.setItem(`memberSince_${user.id}`, now);
      return now;
    }
    return stored;
  })();
  const memberDate = new Date(memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.page}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            <Icon.ArrowLeft /><span>Dashboard</span>
          </button>
          <div className={styles.navDivider} />
          <div className={styles.navBrand}>
            <Icon.Map />
            <span className={styles.navBrandName}>Road Trip Planner</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <Icon.Logout /><span>Log out</span>
        </button>
      </nav>

      {/* ── LAYOUT ─────────────────────────────────────────────────────────── */}
      <div className={styles.layout}>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>

          {/* Profile card */}
          <div className={styles.profileCard}>
            <Avatar name={user.username} size={64} />
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{user.username}</p>
              <p className={styles.profileEmail}>{user.email}</p>
              <p className={styles.profileSince}>Member since {memberDate}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className={styles.quickStats}>
            {[
              { label: 'Trips',        value: trips.length },
              { label: 'Completed',    value: trips.filter(t => t.resolved).length },
              { label: 'Cities',       value: new Set(trips.map(t => t.destination)).size },
            ].map(s => (
              <div key={s.label} className={styles.quickStat}>
                <span className={styles.quickStatVal}>{s.value}</span>
                <span className={styles.quickStatLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Nav items */}
          <nav className={styles.sideNav}>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                className={`${styles.navItem} ${active === s.id ? styles.navItemActive : ''} ${s.id === 'danger' ? styles.navItemDanger : ''}`}
                onClick={() => setActive(s.id)}
              >
                <s.Icon />
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className={styles.main}>

          {/* ── PROFILE SECTION ─────────────────────────────────────────── */}
          {active === 'profile' && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon.User /></div>
                <div>
                  <h2 className={styles.sectionTitle}>Profile Information</h2>
                  <p className={styles.sectionSub}>Update your name and email address</p>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.avatarRow}>
                  <Avatar name={profileForm.username} size={72} />
                  <div>
                    <p className={styles.avatarName}>{profileForm.username || user.username}</p>
                    <p className={styles.avatarSub}>Your display name and avatar initial</p>
                  </div>
                </div>

                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Username</label>
                    <div className={styles.inputWrap}>
                      <Icon.User />
                      <input
                        className={styles.input}
                        value={profileForm.username}
                        onChange={setProfile('username')}
                        placeholder="Your username"
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email address</label>
                    <div className={styles.inputWrap}>
                      <Icon.Mail />
                      <input
                        className={styles.input}
                        type="email"
                        value={profileForm.email}
                        onChange={setProfile('email')}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <button
                    className={`${styles.saveBtn} ${profileSaved ? styles.saveBtnDone : ''}`}
                    onClick={handleProfileSave}
                  >
                    {profileSaved ? <><Icon.Check /> Saved!</> : 'Save changes'}
                  </button>
                </div>
              </div>

              {/* Change password card */}
              <div className={styles.card} style={{ marginTop: 20 }}>
                <h3 className={styles.cardTitle}>Change Password</h3>
                <div className={styles.fieldStack}>
                  {[
                    { key: 'current', label: 'Current password',  placeholder: '••••••••' },
                    { key: 'next',    label: 'New password',       placeholder: 'Min 8 characters' },
                    { key: 'confirm', label: 'Confirm new password', placeholder: 'Repeat new password' },
                  ].map(({ key, label, placeholder }) => (
                    <div className={styles.field} key={key}>
                      <label className={styles.label}>{label}</label>
                      <div className={styles.inputWrap}>
                        <Icon.Lock />
                        <input
                          className={styles.input}
                          type={pwShow[key] ? 'text' : 'password'}
                          value={pwForm[key]}
                          onChange={setPw(key)}
                          placeholder={placeholder}
                        />
                        <button className={styles.eyeBtn} onClick={() => togglePwShow(key)} tabIndex={-1}>
                          {pwShow[key] ? <Icon.EyeOff /> : <Icon.Eye />}
                        </button>
                      </div>
                      {key === 'next' && pwForm.next && (
                        <div className={styles.strengthBar}>
                          {[1,2,3,4].map(i => (
                            <div key={i} className={styles.strengthSeg} style={{ background: i <= strength ? PW_COLORS[strength] : undefined }} />
                          ))}
                          <span className={styles.strengthLabel} style={{ color: PW_COLORS[strength] }}>
                            {PW_LABELS[strength]}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {pwError && <p className={styles.fieldErr}>{pwError}</p>}
                <div className={styles.cardFooter}>
                  <button className={styles.saveBtn} onClick={handlePasswordSave}>Update password</button>
                </div>
              </div>
            </section>
          )}

          {/* ── PREFERENCES SECTION ─────────────────────────────────────── */}
          {active === 'preferences' && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon.Car /></div>
                <div>
                  <h2 className={styles.sectionTitle}>Travel Preferences</h2>
                  <p className={styles.sectionSub}>Set your defaults for every trip you plan</p>
                </div>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Vehicle & Fuel</h3>
                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Vehicle type</label>
                    <div className={styles.chipGroup}>
                      {VEHICLE_TYPES.map(v => (
                        <button
                          key={v}
                          className={`${styles.chip} ${prefs.vehicleType === v ? styles.chipActive : ''}`}
                          onClick={() => setPref('vehicleType', v)}
                        >{v}</button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Fuel type</label>
                    <div className={styles.chipGroup}>
                      {FUEL_TYPES.map(f => (
                        <button
                          key={f}
                          className={`${styles.chip} ${prefs.fuelType === f ? styles.chipActive : ''}`}
                          onClick={() => setPref('fuelType', f)}
                        >{f}</button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Average mileage <span className={styles.labelUnit}>km/l</span></label>
                    <div className={styles.sliderWrap}>
                      <input
                        type="range" min="5" max="40" step="1"
                        value={prefs.mileage}
                        onChange={e => setPref('mileage', Number(e.target.value))}
                        className={styles.slider}
                      />
                      <span className={styles.sliderVal}>{prefs.mileage} km/l</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.card} style={{ marginTop: 20 }}>
                <h3 className={styles.cardTitle}>Trip Defaults</h3>
                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Default route type</label>
                    <div className={styles.chipGroup}>
                      {[
                        { v: 'scenic',   l: 'Scenic'   },
                        { v: 'quick',    l: 'Quick'    },
                        { v: 'balanced', l: 'Balanced' },
                        { v: 'offroad',  l: 'Off-road' },
                      ].map(r => (
                        <button
                          key={r.v}
                          className={`${styles.chip} ${prefs.defaultRoute === r.v ? styles.chipActive : ''}`}
                          onClick={() => setPref('defaultRoute', r.v)}
                        >{r.l}</button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Default travellers <span className={styles.labelUnit}>people</span></label>
                    <div className={styles.sliderWrap}>
                      <input
                        type="range" min="1" max="20" step="1"
                        value={prefs.defaultPeople}
                        onChange={e => setPref('defaultPeople', Number(e.target.value))}
                        className={styles.slider}
                      />
                      <span className={styles.sliderVal}>{prefs.defaultPeople} {prefs.defaultPeople === 1 ? 'person' : 'people'}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <button
                    className={`${styles.saveBtn} ${prefSaved ? styles.saveBtnDone : ''}`}
                    onClick={handlePrefSave}
                  >
                    {prefSaved ? <><Icon.Check /> Saved!</> : 'Save preferences'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ── NOTIFICATIONS SECTION ───────────────────────────────────── */}
          {active === 'notifications' && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon.Bell /></div>
                <div>
                  <h2 className={styles.sectionTitle}>Notifications</h2>
                  <p className={styles.sectionSub}>Control what updates you receive</p>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.notifyScroll}>
                  {NOTIFICATION_GROUPS.map(({ group, desc, items }) => (
                    <div key={group} className={styles.notifyGroup}>
                      <div className={styles.notifyGroupHeader}>
                        <p className={styles.notifyGroupTitle}>{group}</p>
                        <p className={styles.notifyGroupDesc}>{desc}</p>
                      </div>
                      {items.map(({ key, title, desc: itemDesc }) => (
                        <div key={key} className={styles.toggleRow}>
                          <div className={styles.toggleInfo}>
                            <p className={styles.toggleTitle}>{title}</p>
                            <p className={styles.toggleDesc}>{itemDesc}</p>
                          </div>
                          <button
                            className={`${styles.toggle} ${prefs[key] ? styles.toggleOn : ''}`}
                            onClick={() => setPref(key, !prefs[key])}
                            aria-label={title}
                          >
                            <span className={styles.toggleKnob} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className={styles.cardFooter}>
                  <button
                    className={`${styles.saveBtn} ${prefSaved ? styles.saveBtnDone : ''}`}
                    onClick={handlePrefSave}
                  >
                    {prefSaved ? <><Icon.Check /> Saved!</> : 'Save preferences'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ── SECURITY SECTION ────────────────────────────────────────── */}
          {active === 'security' && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Icon.Shield /></div>
                <div>
                  <h2 className={styles.sectionTitle}>Security</h2>
                  <p className={styles.sectionSub}>Manage your account security settings</p>
                </div>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Active Session</h3>
                <div className={styles.sessionRow}>
                  <div className={styles.sessionDot} />
                  <div>
                    <p className={styles.sessionTitle}>Current browser session</p>
                    <p className={styles.sessionSub}>Signed in · Road Trip Planner Web App</p>
                  </div>
                  <span className={styles.sessionBadge}>Active</span>
                </div>
              </div>

              <div className={styles.card} style={{ marginTop: 20 }}>
                <h3 className={styles.cardTitle}>Account Info</h3>
                <div className={styles.infoList}>
                  {[
                    { label: 'Username',      value: user.username },
                    { label: 'Email',         value: user.email },
                    { label: 'Member since',  value: memberDate },
                    { label: 'Trips planned', value: trips.length },
                  ].map(r => (
                    <div key={r.label} className={styles.infoRow}>
                      <span className={styles.infoLabel}>{r.label}</span>
                      <span className={styles.infoValue}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.card} style={{ marginTop: 20 }}>
                <h3 className={styles.cardTitle}>Sign out everywhere</h3>
                <p className={styles.cardDesc}>This will sign you out of the current session.</p>
                <div className={styles.cardFooter}>
                  <button className={styles.outlineBtn} onClick={handleLogout}>
                    <Icon.Logout /> Sign out
                  </button>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className={styles.card} style={{ marginTop: 20, borderColor: 'rgba(106,159,216,0.3)', background: 'rgba(106,159,216,0.04)' }}>
                  <h3 className={styles.cardTitle} style={{ color: '#6a9fd8' }}>
                    <Icon.Shield /> Admin Panel
                  </h3>
                  <p className={styles.cardDesc}>
                    You have administrator access. Manage users, view system stats, and control roles.
                  </p>
                  <div className={styles.cardFooter}>
                    <button
                      className={styles.outlineBtn}
                      style={{ borderColor: 'rgba(106,159,216,0.5)', color: '#6a9fd8' }}
                      onClick={() => navigate('/admin')}
                    >
                      <Icon.Shield /> Go to Admin Panel
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── DANGER ZONE ─────────────────────────────────────────────── */}
          {active === 'danger' && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={`${styles.sectionIcon} ${styles.sectionIconDanger}`}><Icon.Trash /></div>
                <div>
                  <h2 className={styles.sectionTitle}>Danger Zone</h2>
                  <p className={styles.sectionSub}>Irreversible actions — proceed with caution</p>
                </div>
              </div>

              <div className={`${styles.card} ${styles.cardDanger}`}>
                <div className={styles.dangerRow}>
                  <div>
                    <p className={styles.dangerTitle}>Clear all trip history</p>
                    <p className={styles.dangerDesc}>Permanently removes all your saved trips and cannot be undone.</p>
                  </div>
                  <button className={styles.dangerBtn} onClick={() => {
                    localStorage.removeItem(`trips_${user.id}`);
                    setTrips([]);
                    showToast('All trips cleared');
                  }}>
                    Clear trips
                  </button>
                </div>
              </div>

              <div className={`${styles.card} ${styles.cardDanger}`} style={{ marginTop: 16 }}>
                <div className={styles.dangerRow}>
                  <div>
                    <p className={styles.dangerTitle}>Delete account</p>
                    <p className={styles.dangerDesc}>Permanently deletes your account and all associated data. This cannot be undone.</p>
                  </div>
                  {!deleteConfirm ? (
                    <button className={`${styles.dangerBtn} ${styles.dangerBtnRed}`} onClick={() => setDeleteConfirm(true)}>
                      Delete account
                    </button>
                  ) : (
                    <div className={styles.confirmGroup}>
                      <p className={styles.confirmText}>Are you sure?</p>
                      <button className={`${styles.dangerBtn} ${styles.dangerBtnRed}`} onClick={handleDeleteAccount}>Yes, delete</button>
                      <button className={styles.outlineBtn} onClick={() => setDeleteConfirm(false)}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

        </main>
      </div>

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}