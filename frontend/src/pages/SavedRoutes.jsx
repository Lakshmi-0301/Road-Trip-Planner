import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SavedRoutes.module.css';
import { calcFuelCost, estimateToll, calcCarbon } from './tripUtils';

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
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Star: ({ filled }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#aa9371' : 'none'} stroke="#aa9371" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Route: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
      <circle cx="18" cy="5" r="3"/>
    </svg>
  ),
  Replan: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Users: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Fuel: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9"/>
      <path d="M5 22V10h8v12"/>
      <path d="M17 14v-3a2 2 0 0 1 4 0v3a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z"/>
    </svg>
  ),
  Pin: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Clock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
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
function rupee(n) { return `₹${Number(n).toLocaleString('en-IN')}`; }

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getUserPrefs(uid) {
  const key = uid ? `userPrefs_${uid}` : 'userPrefs';
  const p = JSON.parse(localStorage.getItem(key) || '{}');
  return { vehicle: (p.vehicleType || 'Car').toLowerCase(), mileage: p.mileage || 15, fuelType: p.fuelType || 'Petrol' };
}

const FUEL_PRICES = { Petrol: 103, Diesel: 90, Electric: 12, CNG: 78 };

function estimateCost(route, uid) {
  if (!route.dist) return null;
  const prefs  = getUserPrefs(uid);
  const fuel   = calcFuelCost(route.dist, prefs.mileage, FUEL_PRICES[prefs.fuelType] || 103);
  const toll   = estimateToll(route.dist, prefs.vehicle);
  return { fuel: fuel.cost, toll, total: fuel.cost + toll, carbon: calcCarbon(route.dist, prefs.vehicle) };
}

// ── Re-plan modal (lightweight inline version) ────────────────────────────────
const CITIES = ['Bangalore', 'Chennai', 'Coimbatore', 'Hyderabad', 'Kochi', 'Mysore', 'Puducherry'];
const today  = new Date().toISOString().split('T')[0];

function ReplanModal({ route, onClose, onSubmit }) {
  const [form, setForm] = useState({
    source:        route.source,
    destination:   route.destination,
    route:         route.route,
    startDate:     '',
    departureTime: route.departureTime || '08:00',
    people:        route.people || 1,
  });
  const [err, setErr] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.startDate) { setErr('Pick a start date'); return; }
    onSubmit(form);
    onClose();
  };

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const rm = ROUTE_META[form.route] || ROUTE_META.balanced;

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Re-plan Route</h2>
            <p className={styles.modalSub}>Adjust and launch your saved route</p>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Route preview */}
        <div className={styles.modalRoutePreview} style={{ '--route-color': rm.color, '--route-bg': rm.bg }}>
          <span className={styles.modalCity}>{form.source}</span>
          <svg width="40" height="12" viewBox="0 0 48 12" fill="none">
            <path d="M0 6h40M32 1l8 5-8 5" stroke={rm.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={styles.modalCity}>{form.destination}</span>
          <span className={styles.modalRouteBadge} style={{ color: rm.color, background: rm.bg, border: `1px solid ${rm.color}33` }}>
            {rm.label}
          </span>
        </div>

        <div className={styles.modalFields}>
          {/* Cities */}
          <div className={styles.modalGrid2}>
            <div className={styles.field}>
              <label className={styles.label}>From</label>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={form.source} onChange={set('source')}>
                  {CITIES.filter(c => c !== form.destination).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>To</label>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={form.destination} onChange={set('destination')}>
                  {CITIES.filter(c => c !== form.source).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Date + time */}
          <div className={styles.modalGrid2}>
            <div className={styles.field}>
              <label className={styles.label}>Trip Date</label>
              <input type="date" min={today} value={form.startDate} onChange={set('startDate')} className={styles.input}/>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Departure Time</label>
              <input type="time" value={form.departureTime} onChange={set('departureTime')} className={styles.input}/>
            </div>
          </div>

          {/* People + route type */}
          <div className={styles.modalGrid2}>
            <div className={styles.field}>
              <label className={styles.label}>Travellers</label>
              <input type="number" min="1" max="20" value={form.people} onChange={set('people')} className={styles.input}/>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Route type</label>
              <div className={styles.selectWrap}>
                <select className={styles.select} value={form.route} onChange={set('route')}>
                  {Object.entries(ROUTE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {err && <p className={styles.modalErr}>{err}</p>}

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.replanBtn} onClick={handleSubmit}>
            <Icon.Replan /> Launch trip planner
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SavedRoutes() {
  const navigate = useNavigate();
  const [user, setUser]             = useState(null);
  const [routes, setRoutes]         = useState([]);
  const [search, setSearch]         = useState('');
  const [filterRoute, setFilterRoute] = useState('all');
  const [replanTarget, setReplanTarget] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { navigate('/login'); return; }
    let parsedUser;
    try { parsedUser = JSON.parse(stored); setUser(parsedUser); } catch { navigate('/login'); return; }
    const uid = parsedUser.id;
    setRoutes(JSON.parse(localStorage.getItem(`savedRoutes_${uid}`) || '[]'));
  }, [navigate]);

  // ── Analytics ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!routes.length) return null;
    const routeCount = {};
    routes.forEach(r => { routeCount[r.route] = (routeCount[r.route] || 0) + 1; });
    const favType = Object.entries(routeCount).sort((a, b) => b[1] - a[1])[0];
    const destCount = {};
    routes.forEach(r => { destCount[r.destination] = (destCount[r.destination] || 0) + 1; });
    const favDest = Object.entries(destCount).sort((a, b) => b[1] - a[1])[0];
    return { total: routes.length, favType, favDest };
  }, [routes]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = [...routes];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.source?.toLowerCase().includes(q) ||
        r.destination?.toLowerCase().includes(q)
      );
    }
    if (filterRoute !== 'all') list = list.filter(r => r.route === filterRoute);
    return list;
  }, [routes, search, filterRoute]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleRemove = (id) => {
    setRemovingId(id);
    setTimeout(() => {
      const updated = routes.filter(r => r.id !== id);
      setRoutes(updated);
      localStorage.setItem(`savedRoutes_${user.id}`, JSON.stringify(updated));
      setRemovingId(null);
    }, 300);
  };

  const handleReplan = (form) => {
    const newTrip = { ...form, id: Date.now(), resolved: false };
    const existing = JSON.parse(localStorage.getItem(`trips_${user.id}`) || '[]');
    localStorage.setItem(`trips_${user.id}`, JSON.stringify([newTrip, ...existing]));
    navigate('/trip-result', { state: { formData: newTrip } });
  };

  if (!user) return null;

  return (
    <div className={styles.page}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            <Icon.ArrowLeft /><span>Dashboard</span>
          </button>
          <div className={styles.navDivider}/>
          <div className={styles.navBrand}>
            <Icon.Map />
            <span className={styles.navBrandName}>Road Trip Planner</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={() => {
          localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login');
        }}>
          <Icon.Logout /><span>Log out</span>
        </button>
      </nav>

      {/* ── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Saved <span className={styles.pageTitleAccent}>Routes</span>
          </h1>
          <p className={styles.pageSub}>Your favourite routes, ready to re-plan anytime</p>
        </div>

        {/* Quick stats */}
        {stats && (
          <div className={styles.headerStats}>
            <div className={styles.headerStat}>
              <span className={styles.headerStatVal}>{stats.total}</span>
              <span className={styles.headerStatLabel}>Saved</span>
            </div>
            <div className={styles.headerStatDivider}/>
            <div className={styles.headerStat}>
              <span className={styles.headerStatVal} style={{ color: ROUTE_META[stats.favType[0]]?.color }}>
                {ROUTE_META[stats.favType[0]]?.label}
              </span>
              <span className={styles.headerStatLabel}>Fav type</span>
            </div>
            <div className={styles.headerStatDivider}/>
            <div className={styles.headerStat}>
              <span className={styles.headerStatVal}>{stats.favDest[0]}</span>
              <span className={styles.headerStatLabel}>Top dest.</span>
            </div>
          </div>
        )}
      </div>

      {/* ── TOOLBAR ────────────────────────────────────────────────────────── */}
      {routes.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Icon.Search />
            <input
              className={styles.searchInput}
              placeholder="Search by city…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterTabs}>
            {[{ key: 'all', label: 'All' }, ...Object.entries(ROUTE_META).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
              <button
                key={f.key}
                className={`${styles.filterTab} ${filterRoute === f.key ? styles.filterTabActive : ''}`}
                onClick={() => setFilterRoute(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── EMPTY STATE ─────────────────────────────────────────────────────── */}
      {routes.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Icon.Star filled={false} />
          </div>
          <p className={styles.emptyTitle}>No saved routes yet</p>
          <p className={styles.emptyHint}>
            Star any trip on your Dashboard to save the route here for quick re-planning.
          </p>
          <button className={styles.emptyBtn} onClick={() => navigate('/dashboard')}>
            ← Go to Dashboard
          </button>
        </div>
      )}

      {/* ── ROUTE GRID ─────────────────────────────────────────────────────── */}
      {routes.length > 0 && (
        <div className={styles.routeGrid}>
          {visible.length === 0 ? (
            <div className={styles.noResults}>No routes match your search.</div>
          ) : (
            visible.map(route => {
              const rm   = ROUTE_META[route.route] || ROUTE_META.balanced;
              const cost = estimateCost(route, user?.id);
              const isRemoving = removingId === route.id;

              return (
                <div
                  key={route.id}
                  className={`${styles.routeCard} ${isRemoving ? styles.routeCardRemoving : ''}`}
                  style={{ '--route-color': rm.color, '--route-bg': rm.bg }}
                >
                  {/* Top stripe */}
                  <div className={styles.cardStripe}/>

                  {/* Header */}
                  <div className={styles.cardHead}>
                    <div className={styles.cardRouteRow}>
                      <span className={styles.cardCity}>{route.source}</span>
                      <svg width="28" height="10" viewBox="0 0 36 12" fill="none">
                        <path d="M0 6h28M20 1l8 5-8 5" stroke={rm.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className={styles.cardCity}>{route.destination}</span>
                    </div>
                    <button
                      className={styles.unsaveBtn}
                      onClick={() => handleRemove(route.id)}
                      title="Remove from saved"
                    >
                      <Icon.Star filled={true} />
                    </button>
                  </div>

                  {/* Badges */}
                  <div className={styles.cardBadges}>
                    <span className={styles.routeTypeBadge} style={{ color: rm.color, background: rm.bg, border: `1px solid ${rm.color}33` }}>
                      {rm.label}
                    </span>
                    <span className={styles.metaBadge}><Icon.Users />{route.people} {Number(route.people) === 1 ? 'person' : 'people'}</span>
                    {route.dist && <span className={styles.metaBadge}><Icon.Pin />{route.dist} km</span>}
                  </div>

                  {/* Cost estimate */}
                  {cost && (
                    <div className={styles.cardCostRow}>
                      <div className={styles.costItem}>
                        <span className={styles.costLabel}><Icon.Fuel /> Fuel</span>
                        <span className={styles.costVal}>{rupee(cost.fuel)}</span>
                      </div>
                      <div className={styles.costDivider}/>
                      <div className={styles.costItem}>
                        <span className={styles.costLabel}>Tolls</span>
                        <span className={styles.costVal}>{rupee(cost.toll)}</span>
                      </div>
                      <div className={styles.costDivider}/>
                      <div className={styles.costItem}>
                        <span className={styles.costLabel}>Est. total</span>
                        <span className={styles.costVal} style={{ color: rm.color, fontWeight: 800 }}>{rupee(cost.total)}</span>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className={styles.cardFooter}>
                    <span className={styles.savedAgo}>
                      <Icon.Clock /> Saved {timeAgo(route.savedAt)}
                    </span>
                    <button
                      className={styles.replanBtn}
                      onClick={() => setReplanTarget(route)}
                    >
                      <Icon.Replan /> Re-plan
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── RE-PLAN MODAL ──────────────────────────────────────────────────── */}
      {replanTarget && (
        <ReplanModal
          route={replanTarget}
          onClose={() => setReplanTarget(null)}
          onSubmit={handleReplan}
        />
      )}
    </div>
  );
}