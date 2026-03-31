import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MiniCalendar from '../components/MiniCalendar';
import PlanTripModal from '../components/PlanTripModal';
import styles from './Dashboard.module.css';

// ── Inline SVG icon helpers ───────────────────────────────────────────────────
const Icon = {
  Map: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Plus: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Route: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
      <circle cx="18" cy="5" r="3"/>
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Zap: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

const APP_FEATURES = [
  {
    Icon: Icon.Route,
    title: 'Smart Routing',
    desc: 'Choose from scenic, quick, balanced, or off-road routes tailored to your travel style.',
  },
  {
    Icon: Icon.Shield,
    title: 'Safe & Reliable',
    desc: 'Routes are built on verified map data with real-time conditions and safety checkpoints.',
  },
  {
    Icon: Icon.Zap,
    title: 'Instant Planning',
    desc: 'Get a complete trip plan in seconds — waypoints, stops, and timings all sorted.',
  },
  {
    Icon: Icon.Users,
    title: 'Group Travel',
    desc: 'Plan for solo trips or large groups, with accommodation and stop suggestions scaled accordingly.',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { navigate('/login'); return; }
    try { setUser(JSON.parse(stored)); } catch { navigate('/login'); }

    // Load saved trips from localStorage
    const savedTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    setTrips(savedTrips);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleTripSubmit = (form) => {
    const newTrip = { ...form, id: Date.now() };
    const updated = [newTrip, ...trips];
    setTrips(updated);
    localStorage.setItem('trips', JSON.stringify(updated));
  };

  const tripDates = trips.map((t) => t.startDate);

  if (!user) return null;

  return (
    <div className={styles.page}>
      {/* ──────────── NAVBAR ──────────── */}
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          <Icon.Map />
          <span className={styles.navBrandName}>Road Trip Planner</span>
        </div>
        <div className={styles.navCenter}>
          <span className={styles.navGreeting}>
            Good {getGreeting()}, <strong>{user.username}</strong>
          </span>
        </div>
        <div className={styles.navActions}>
          <button id="open-plan-trip-nav-btn" className={styles.planNavBtn} onClick={() => setShowModal(true)}>
            <Icon.Plus />
            Plan Trip
          </button>
          <button id="logout-btn" className={styles.logoutBtn} onClick={handleLogout}>
            <Icon.Logout />
            Log out
          </button>
        </div>
      </nav>

      {/* ──────────── HERO / ANIMATION ──────────── */}
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroHeading}>
            Your next adventure<br />
            <span className={styles.heroAccent}>starts here.</span>
          </h1>
          <p className={styles.heroSub}>
            Plan road trips across South India — scenic routes, smart stops, seamless journeys.
          </p>
        </div>
        {/* Animated road strip */}
        <div className={styles.roadScene} aria-hidden="true">
          <div className={styles.road}>
            <div className={styles.roadLine} />
            <div className={styles.roadLine} />
            <div className={styles.carTrack}>
              <div className={styles.car} />
            </div>
          </div>
          <div className={styles.roadScenery}>
            <div className={`${styles.tree} ${styles.tree1}`} />
            <div className={`${styles.tree} ${styles.tree2}`} />
            <div className={`${styles.tree} ${styles.tree3}`} />
            <div className={`${styles.mountain} ${styles.mtn1}`} />
            <div className={`${styles.mountain} ${styles.mtn2}`} />
          </div>
        </div>
      </div>

      {/* ──────────── MAIN GRID ──────────── */}
      <div className={styles.mainGrid}>
        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>
          {/* Upcoming Trips */}
          <section className={styles.card} aria-labelledby="upcoming-trips-heading">
            <div className={styles.cardHeader}>
              <h2 id="upcoming-trips-heading" className={styles.cardTitle}>Upcoming Trips</h2>
              <button
                id="plan-trip-cta-btn"
                className={styles.addTripBtn}
                onClick={() => setShowModal(true)}
              >
                <Icon.Plus />
                Plan a Trip
              </button>
            </div>

            {trips.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Icon.Map />
                </div>
                <p className={styles.emptyText}>No trips planned yet</p>
                <p className={styles.emptyHint}>
                  Hit <strong>Plan a Trip</strong> to get started
                </p>
              </div>
            ) : (
              <div className={styles.tripList}>
                {trips.map((t) => (
                  <div key={t.id} className={styles.tripItem}>
                    <div className={styles.tripRoute}>
                      <span className={styles.tripCity}>{t.source}</span>
                      <span className={styles.tripArrow}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </span>
                      <span className={styles.tripCity}>{t.destination}</span>
                    </div>
                    <div className={styles.tripMeta}>
                      <span className={styles.tripBadge}>{t.route}</span>
                      <span className={styles.tripDate}>
                        <Icon.Calendar />
                        {formatDate(t.startDate)}
                      </span>
                      <span className={styles.tripPeople}>
                        <Icon.Users />
                        {t.people}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* App Features */}
          <section className={styles.card} aria-labelledby="features-heading">
            <h2 id="features-heading" className={styles.cardTitle} style={{ marginBottom: '16px' }}>
              Why Road Trip Planner?
            </h2>
            <div className={styles.featureGrid}>
              {APP_FEATURES.map(({ Icon: FeatureIcon, title, desc }) => (
                <div key={title} className={styles.featureCard}>
                  <div className={styles.featureIconWrap}>
                    <FeatureIcon />
                  </div>
                  <h3 className={styles.featureTitle}>{title}</h3>
                  <p className={styles.featureDesc}>{desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>
          {/* Calendar */}
          <section className={styles.card} aria-labelledby="calendar-heading">
            <div className={styles.cardHeader}>
              <h2 id="calendar-heading" className={styles.cardTitle}>Trip Calendar</h2>
            </div>
            <MiniCalendar tripDates={tripDates} />
          </section>

          {/* Quick Stats */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Overview</h2>
            <div className={styles.statsList}>
              {[
                { label: 'Trips Planned', value: trips.length },
                { label: 'Destinations', value: new Set(trips.map(t => t.destination)).size },
                { label: 'Total Travellers', value: trips.reduce((s, t) => s + Number(t.people), 0) },
              ].map((s) => (
                <div key={s.label} className={styles.statRow}>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statValue}>{s.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ──────────── MODAL ──────────── */}
      {showModal && (
        <PlanTripModal
          onClose={() => setShowModal(false)}
          onSubmit={handleTripSubmit}
        />
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
