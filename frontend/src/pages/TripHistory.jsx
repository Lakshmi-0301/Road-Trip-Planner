import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TripHistory.module.css';

// ── Icon helpers ──────────────────────────────────────────────────────────────
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
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Route: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
      <circle cx="18" cy="5" r="3"/>
    </svg>
  ),
  ExternalLink: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Filter: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  TrendUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  EmptyBox: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
};

// ── Route type config ─────────────────────────────────────────────────────────
const ROUTE_META = {
  scenic:   { label: 'Scenic',   color: '#6dbf8a', bg: 'rgba(109,191,138,0.1)'  },
  quick:    { label: 'Quick',    color: '#6a9fd8', bg: 'rgba(106,159,216,0.1)'  },
  balanced: { label: 'Balanced', color: '#aa9371', bg: 'rgba(170,147,113,0.1)'  },
  offroad:  { label: 'Off-road', color: '#d4845a', bg: 'rgba(212,132,90,0.1)'   },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function monthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr + 'T00:00:00') >= new Date(new Date().toDateString());
}

// ── Mini bar chart (pure SVG) ─────────────────────────────────────────────────
function BarChart({ data }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 28, gap = 12, h = 80, padB = 28;
  const w = data.length * (barW + gap) - gap + 2;

  return (
    <svg viewBox={`0 0 ${w} ${h + padB}`} style={{ width: '100%', maxWidth: `${w * 2}px`, overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / max) * h);
        const x = i * (barW + gap);
        const y = h - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH}
              fill={d.value > 0 ? 'var(--color-tan)' : 'var(--color-surface-2)'}
              rx="4" opacity={d.value > 0 ? 0.85 : 0.3}
            />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle"
                fill="var(--color-tan)" fontSize="9" fontWeight="700">
                {d.value}
              </text>
            )}
            <text x={x + barW / 2} y={h + padB - 4} textAnchor="middle"
              fill="var(--color-text-muted)" fontSize="9">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut chart (route type breakdown) ───────────────────────────────────────
function DonutChart({ slices }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (!total) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
      No data yet
    </div>
  );

  let cursor = 0;
  const r = 36, cx = 48, cy = 48, stroke = 14;
  const circ = 2 * Math.PI * r;

  const paths = slices.filter(s => s.value > 0).map(s => {
    const pct = s.value / total;
    const dash = pct * circ;
    const offset = circ - cursor * circ;
    cursor += pct;
    return { ...s, dash, offset, pct };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg viewBox="0 0 96 96" style={{ width: 96, height: 96, flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={stroke} />
        {paths.map((p, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={p.color} strokeWidth={stroke}
            strokeDasharray={`${p.dash} ${circ - p.dash}`}
            strokeDashoffset={p.offset}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--color-text-primary)" fontSize="14" fontWeight="800" fontFamily="var(--font-heading)">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">trips</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slices.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{s.label}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-primary)', marginLeft: 'auto', paddingLeft: 8 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TripHistory() {
  const navigate = useNavigate();
  const [user, setUser]     = useState(null);
  const [trips, setTrips]   = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');   // all | upcoming | completed | draft
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | route
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { navigate('/login'); return; }
    let parsedUser;
    try { parsedUser = JSON.parse(stored); setUser(parsedUser); } catch { navigate('/login'); return; }
    const uid = parsedUser.id;
    setTrips(JSON.parse(localStorage.getItem(`trips_${uid}`) || '[]'));
  }, [navigate]);

  // ── Analytics derived data ───────────────────────────────────────────────
  const analytics = useMemo(() => {
    const totalTrips      = trips.length;
    const completedTrips  = trips.filter(t => t.resolved).length;
    const upcomingTrips   = trips.filter(t => isUpcoming(t.startDate)).length;
    const totalTravellers = trips.reduce((s, t) => s + Number(t.people || 0), 0);
    const uniqueDests     = new Set(trips.map(t => t.destination)).size;

    // Trips per month (last 6 months)
    const now = new Date();
    const monthBars = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      return { label: d.toLocaleDateString('en-IN', { month: 'short' }), value: trips.filter(t => monthKey(t.startDate) === key).length };
    });

    // Route type breakdown
    const routeCounts = Object.fromEntries(Object.keys(ROUTE_META).map(k => [k, 0]));
    trips.forEach(t => { if (routeCounts[t.route] !== undefined) routeCounts[t.route]++; });
    const routeSlices = Object.entries(ROUTE_META).map(([key, meta]) => ({
      label: meta.label, color: meta.color, value: routeCounts[key],
    }));

    // Top destinations
    const destCount = {};
    trips.forEach(t => { destCount[t.destination] = (destCount[t.destination] || 0) + 1; });
    const topDests = Object.entries(destCount).sort((a, b) => b[1] - a[1]).slice(0, 4);

    // Favourite route type
    const favRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0];

    return { totalTrips, completedTrips, upcomingTrips, totalTravellers, uniqueDests, monthBars, routeSlices, topDests, favRoute };
  }, [trips]);

  // ── Filtered + sorted trip list ─────────────────────────────────────────
  const visible = useMemo(() => {
    let list = [...trips];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.source?.toLowerCase().includes(q) ||
        t.destination?.toLowerCase().includes(q) ||
        t.route?.toLowerCase().includes(q)
      );
    }
    if (filter === 'upcoming')  list = list.filter(t => isUpcoming(t.startDate));
    if (filter === 'completed') list = list.filter(t => t.resolved);
    if (filter === 'draft')     list = list.filter(t => !t.resolved);

    list.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.startDate) - new Date(b.startDate);
      if (sortBy === 'route')  return (a.route || '').localeCompare(b.route || '');
      return new Date(b.startDate) - new Date(a.startDate); // newest
    });
    return list;
  }, [trips, search, filter, sortBy]);

  const handleOpen = (trip) => {
    if (trip.resolved && trip.tripData) {
      navigate('/trip-result', { state: { formData: trip, tripData: trip.tripData } });
    } else {
      navigate('/trip-result', { state: { formData: trip } });
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    setTimeout(() => {
      const updated = trips.filter(t => t.id !== id);
      setTrips(updated);
      localStorage.setItem(`trips_${user.id}`, JSON.stringify(updated));
      setDeletingId(null);
    }, 300);
  };

  if (!user) return null;

  const FILTERS = [
    { key: 'all',       label: 'All Trips' },
    { key: 'upcoming',  label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'draft',     label: 'Drafts' },
  ];

  return (
    <div className={styles.page}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            <Icon.ArrowLeft />
            <span>Dashboard</span>
          </button>
          <div className={styles.navDivider} />
          <div className={styles.navBrand}>
            <Icon.Map />
            <span className={styles.navBrandName}>Road Trip Planner</span>
          </div>
        </div>
        <div className={styles.navRight}>
          <button className={styles.planBtn} onClick={() => navigate('/dashboard')}>
            <Icon.Plus />
            Plan Trip
          </button>
          <button className={styles.logoutBtn} onClick={() => {
            localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login');
          }}>
            <Icon.Logout />
          </button>
        </div>
      </nav>

      {/* ── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Trip History <span className={styles.pageTitleAccent}>& Analytics</span>
          </h1>
          <p className={styles.pageSub}>A complete record of your road trip adventures</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.headerStat}>
            <span className={styles.headerStatVal}>{analytics.totalTrips}</span>
            <span className={styles.headerStatLabel}>Total Trips</span>
          </div>
          <div className={styles.headerStatDivider} />
          <div className={styles.headerStat}>
            <span className={styles.headerStatVal}>{analytics.uniqueDests}</span>
            <span className={styles.headerStatLabel}>Destinations</span>
          </div>
          <div className={styles.headerStatDivider} />
          <div className={styles.headerStat}>
            <span className={styles.headerStatVal}>{analytics.totalTravellers}</span>
            <span className={styles.headerStatLabel}>Travellers</span>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
      <div className={styles.mainGrid}>

        {/* LEFT — Trip list */}
        <div className={styles.leftCol}>

          {/* Search + Filter bar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Icon.Search />
              <input
                className={styles.searchInput}
                placeholder="Search by city or route type…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.filterTabs}>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`${styles.filterTab} ${filter === f.key ? styles.filterTabActive : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className={styles.sortWrap}>
              <Icon.Filter />
              <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="route">Route type</option>
              </select>
            </div>
          </div>

          {/* Trip cards */}
          {visible.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><Icon.EmptyBox /></div>
              <p className={styles.emptyTitle}>
                {trips.length === 0 ? 'No trips yet' : 'No trips match your filter'}
              </p>
              <p className={styles.emptyHint}>
                {trips.length === 0
                  ? 'Head back to the dashboard and plan your first adventure'
                  : 'Try clearing your search or changing the filter'}
              </p>
              {trips.length === 0 && (
                <button className={styles.emptyBtn} onClick={() => navigate('/dashboard')}>
                  <Icon.Plus /> Plan your first trip
                </button>
              )}
            </div>
          ) : (
            <div className={styles.tripList}>
              {visible.map(trip => {
                const rm = ROUTE_META[trip.route] || ROUTE_META.balanced;
                const upcoming = isUpcoming(trip.startDate);
                const isDeleting = deletingId === trip.id;
                return (
                  <div
                    key={trip.id}
                    className={`${styles.tripCard} ${isDeleting ? styles.tripCardDeleting : ''}`}
                    onClick={() => handleOpen(trip)}
                    style={{ '--route-color': rm.color, '--route-bg': rm.bg }}
                  >
                    {/* Route stripe */}
                    <div className={styles.tripStripe} />

                    {/* Main content */}
                    <div className={styles.tripCardBody}>
                      <div className={styles.tripRouteRow}>
                        <div className={styles.tripCityPair}>
                          <span className={styles.tripCity}>{trip.source}</span>
                          <span className={styles.tripArrow}>
                            <svg width="16" height="10" viewBox="0 0 24 12" fill="none">
                              <path d="M0 6h20M14 1l6 5-6 5" stroke="var(--route-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                          <span className={styles.tripCity}>{trip.destination}</span>
                        </div>
                        <div className={styles.tripBadges}>
                          <span className={styles.routeBadge} style={{ color: rm.color, background: rm.bg, border: `1px solid ${rm.color}33` }}>
                            {rm.label}
                          </span>
                          <span className={`${styles.statusBadge} ${trip.resolved ? styles.statusDone : upcoming ? styles.statusUpcoming : styles.statusDraft}`}>
                            {trip.resolved ? 'Planned' : upcoming ? 'Upcoming' : 'Draft'}
                          </span>
                        </div>
                      </div>

                      <div className={styles.tripMetaRow}>
                        <span className={styles.tripMetaItem}>
                          <Icon.Calendar /> {formatDate(trip.startDate)}
                        </span>
                        <span className={styles.tripMetaItem}>
                          <Icon.Clock /> {trip.departureTime || '—'}
                        </span>
                        <span className={styles.tripMetaItem}>
                          <Icon.Users /> {trip.people} {Number(trip.people) === 1 ? 'person' : 'people'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.tripCardActions} onClick={e => e.stopPropagation()}>
                      <button className={styles.openBtn} onClick={() => handleOpen(trip)}>
                        <Icon.ExternalLink />
                        {trip.resolved ? 'Open' : 'Plan'}
                      </button>
                      <button className={styles.deleteBtn} onClick={e => handleDelete(e, trip.id)} title="Delete trip">
                        <Icon.Trash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {visible.length > 0 && (
            <p className={styles.countLine}>
              Showing <strong>{visible.length}</strong> of <strong>{trips.length}</strong> trip{trips.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* RIGHT — Analytics sidebar */}
        <div className={styles.rightCol}>

          {/* Summary stats */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Overview</h2>
            <div className={styles.statGrid}>
              {[
                { label: 'Completed Plans', value: analytics.completedTrips, color: '#6dbf8a' },
                { label: 'Upcoming',        value: analytics.upcomingTrips,  color: '#6a9fd8' },
                { label: 'Destinations',    value: analytics.uniqueDests,    color: '#aa9371' },
                { label: 'Travellers',      value: analytics.totalTravellers, color: '#d4845a' },
              ].map(s => (
                <div key={s.label} className={styles.statCell}>
                  <span className={styles.statCellVal} style={{ color: s.color }}>{s.value}</span>
                  <span className={styles.statCellLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Monthly activity */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Monthly Activity</h2>
              <span className={styles.cardSubtitle}>Last 6 months</span>
            </div>
            <div className={styles.chartWrap}>
              <BarChart data={analytics.monthBars} />
            </div>
          </section>

          {/* Route type breakdown */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Route Preference</h2>
            </div>
            <DonutChart slices={analytics.routeSlices} />
            {analytics.favRoute && analytics.favRoute[1] > 0 && (
              <p className={styles.insightLine}>
                <Icon.TrendUp />
                Your go-to: <strong style={{ color: ROUTE_META[analytics.favRoute[0]]?.color }}>{ROUTE_META[analytics.favRoute[0]]?.label}</strong>
              </p>
            )}
          </section>

          {/* Top destinations */}
          {analytics.topDests.length > 0 && (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Top Destinations</h2>
              </div>
              <div className={styles.destList}>
                {analytics.topDests.map(([city, count], i) => (
                  <div key={city} className={styles.destRow}>
                    <span className={styles.destRank}>{i + 1}</span>
                    <span className={styles.destName}>
                      <Icon.MapPin /> {city}
                    </span>
                    <div className={styles.destBar}>
                      <div
                        className={styles.destBarFill}
                        style={{ width: `${(count / analytics.topDests[0][1]) * 100}%` }}
                      />
                    </div>
                    <span className={styles.destCount}>{count}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}