import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Budget.module.css';
import { calcFuelCost, estimateToll, calcCarbon } from './tripUtils';
import { Leaf, AlertTriangle } from 'lucide-react';

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
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
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
  Fuel: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9"/>
      <path d="M5 22V10h8v12"/>
      <path d="M17 14v-3a2 2 0 0 1 4 0v3a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z"/>
    </svg>
  ),
  Toll: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  Food: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  ),
  Hotel: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 22V11l9-9 9 9v11"/><path d="M9 22V12h6v10"/>
    </svg>
  ),
  Activity: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Misc: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

// ── Expense category config ───────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'fuel',       label: 'Fuel',        Icon: Icon.Fuel,     color: '#D4A574', bg: 'rgba(212,165,116,0.12)' },
  { key: 'toll',       label: 'Tolls',       Icon: Icon.Toll,     color: '#6DBFBF', bg: 'rgba(109,191,191,0.12)' },
  { key: 'food',       label: 'Food',        Icon: Icon.Food,     color: '#C97C7C', bg: 'rgba(201,124,124,0.12)' },
  { key: 'stay',       label: 'Stay',        Icon: Icon.Hotel,    color: '#A89BC4', bg: 'rgba(168,155,196,0.12)' },
  { key: 'activities', label: 'Activities',  Icon: Icon.Activity, color: '#6FD9A3', bg: 'rgba(111,217,163,0.12)' },
  { key: 'misc',       label: 'Misc',        Icon: Icon.Misc,     color: '#aa9371', bg: 'rgba(170,147,113,0.12)' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function rupee(n) { return `₹${Number(n).toLocaleString('en-IN')}`; }

// Pull vehicle/fuel prefs saved by Profile page
function getUserPrefs(uid) {
  const key = uid ? `userPrefs_${uid}` : 'userPrefs';
  const p = JSON.parse(localStorage.getItem(key) || '{}');
  return {
    vehicle:  (p.vehicleType || 'Car').toLowerCase(),
    mileage:  p.mileage  || 15,
    fuelType: p.fuelType || 'Petrol',
  };
}

const FUEL_PRICES = { Petrol: 103, Diesel: 90, Electric: 12, CNG: 78 };

// Build planned cost from saved tripData
function buildPlannedCosts(trip, uid) {
  const td = trip.tripData;
  if (!td) return null;
  const prefs   = getUserPrefs(uid);
  const dist    = td.route?.total_distance_km || 0;
  const mileage = prefs.mileage;
  const price   = FUEL_PRICES[prefs.fuelType] || 103;
  const vehicle = prefs.vehicle;

  const fuel = calcFuelCost(dist, mileage, price);
  const toll = estimateToll(dist, vehicle);

  return {
    fuel: fuel.cost,
    toll,
    food: 0,
    stay: 0,
    activities: 0,
    misc: 0,
    dist,
    litres: fuel.litres,
    carbon: calcCarbon(dist, vehicle),
  };
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ slices, total }) {
  if (!total) return (
    <div className={styles.donutEmpty}>No expenses logged yet</div>
  );
  const r = 54, cx = 64, cy = 64, stroke = 18, circ = 2 * Math.PI * r;
  let cursor = 0;
  const paths = slices.filter(s => s.value > 0).map(s => {
    const pct  = s.value / total;
    const dash = pct * circ;
    const offset = circ - cursor * circ;
    cursor += pct;
    return { ...s, dash, offset };
  });

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 128 128" className={styles.donutSvg}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={stroke}/>
        {paths.map((p, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={p.color} strokeWidth={stroke}
            strokeDasharray={`${p.dash} ${circ - p.dash}`}
            strokeDashoffset={p.offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--color-text-primary)"
          fontSize="11" fontWeight="800" fontFamily="var(--font-heading)">
          {rupee(total)}
        </text>
        <text x={cx} y={cy + 9} textAnchor="middle" fill="var(--color-text-muted)" fontSize="7.5">
          total spent
        </text>
      </svg>
      <div className={styles.donutLegend}>
        {slices.filter(s => s.value > 0).map(s => (
          <div key={s.label} className={styles.legendRow}>
            <div className={styles.legendDot} style={{ background: s.color }}/>
            <span className={styles.legendLabel}>{s.label}</span>
            <span className={styles.legendVal}>{rupee(s.value)}</span>
            <span className={styles.legendPct}>{total ? Math.round(s.value / total * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Planned vs Actual bar ────────────────────────────────────────────────────
function CompareBar({ label, planned, actual, color }) {
  const max = Math.max(planned, actual, 1);
  const over = actual > planned;
  return (
    <div className={styles.compareRow}>
      <span className={styles.compareLabel}>{label}</span>
      <div className={styles.compareBars}>
        <div className={styles.compareBarWrap}>
          <div className={styles.compareBarFill}
            style={{ width: `${(planned / max) * 100}%`, background: color, opacity: 0.4 }}/>
          <span className={styles.compareBarLabel} style={{ color }}>
            {rupee(planned)} planned
          </span>
        </div>
        <div className={styles.compareBarWrap}>
          <div className={styles.compareBarFill}
            style={{ width: `${(actual / max) * 100}%`, background: over ? '#e05c5c' : '#6dbf8a' }}/>
          <span className={styles.compareBarLabel} style={{ color: over ? '#e05c5c' : '#6dbf8a' }}>
            {rupee(actual)} actual {over ? '↑' : actual < planned ? '↓' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Custom dark trip selector ─────────────────────────────────────────────────
function TripSelector({ trips, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = trips.find(t => t.id === selectedId);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={styles.tripSelectorWrap} ref={ref}>
      <label className={styles.selectorLabel}>Select trip</label>
      <button className={`${styles.selectorBtn} ${open ? styles.selectorBtnOpen : ''}`} onClick={() => setOpen(o => !o)}>
        <span className={styles.selectorBtnText}>
          {selected ? `${selected.source} → ${selected.destination} · ${formatDate(selected.startDate)}` : 'Select a trip'}
        </span>
        <span className={`${styles.selectorChevron} ${open ? styles.selectorChevronOpen : ''}`}>
          <Icon.ChevronDown />
        </span>
      </button>
      {open && (
        <div className={styles.selectorDropdown}>
          {trips.map(t => (
            <button
              key={t.id}
              className={`${styles.selectorOption} ${t.id === selectedId ? styles.selectorOptionActive : ''}`}
              onClick={() => { onSelect(t.id); setOpen(false); }}
            >
              <span className={styles.selectorOptionRoute}>
                {t.source} → {t.destination}
              </span>
              <span className={styles.selectorOptionMeta}>
                {formatDate(t.startDate)} · {t.people} {Number(t.people) === 1 ? 'person' : 'people'}
              </span>
              {t.id === selectedId && (
                <span className={styles.selectorOptionCheck}><Icon.Check /></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Budget() {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [trips, setTrips]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Expense log: { [tripId]: [{ id, category, label, amount, date }] }
  const [expenseLog, setExpenseLog] = useState({});

  // New expense form
  const [form, setForm] = useState({ category: 'food', label: '', amount: '' });
  const [formErr, setFormErr] = useState('');
  const [saved, setSaved] = useState(false);

  // Settings overlay per trip (mileage/vehicle override)
  const [tripSettings, setTripSettings] = useState({});

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { navigate('/login'); return; }
    let parsedUser;
    try { parsedUser = JSON.parse(stored); setUser(parsedUser); } catch { navigate('/login'); return; }
    const uid = parsedUser.id;

    const savedTrips = JSON.parse(localStorage.getItem(`trips_${uid}`) || '[]');
    setTrips(savedTrips);
    if (savedTrips.length > 0) setSelectedId(savedTrips[0].id);

    const savedLog = JSON.parse(localStorage.getItem(`budgetLog_${uid}`) || '{}');
    setExpenseLog(savedLog);
  }, [navigate]);

  const selectedTrip = trips.find(t => t.id === selectedId) || null;
  const planned      = selectedTrip ? buildPlannedCosts(selectedTrip, user?.id) : null;
  const expenses     = expenseLog[selectedId] || [];

  // Actual totals per category from logged expenses
  const actualByCat  = useMemo(() => {
    const totals = Object.fromEntries(CATEGORIES.map(c => [c.key, 0]));
    expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + Number(e.amount); });
    return totals;
  }, [expenses]);

  const totalActual  = Object.values(actualByCat).reduce((a, b) => a + b, 0);
  const totalPlanned = planned
    ? Object.values({ fuel: planned.fuel, toll: planned.toll, food: planned.food, stay: planned.stay, activities: planned.activities, misc: planned.misc }).reduce((a, b) => a + b, 0)
    : 0;

  const pax = selectedTrip ? Number(selectedTrip.people) || 1 : 1;

  // Donut slices from actual
  const donutSlices = CATEGORIES.map(c => ({
    label: c.label, color: c.color, value: actualByCat[c.key] || 0,
  }));

  // ── Expense handlers ──────────────────────────────────────────────────────
  const saveLog = (id, log) => {
    const updated = { ...expenseLog, [id]: log };
    setExpenseLog(updated);
    localStorage.setItem(`budgetLog_${user.id}`, JSON.stringify(updated));
  };

  const handleAddExpense = () => {
    setFormErr('');
    if (!form.label.trim()) { setFormErr('Enter a description'); return; }
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setFormErr('Enter a valid amount'); return; }

    const entry = {
      id: Date.now(),
      category: form.category,
      label: form.label.trim(),
      amount,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [entry, ...expenses];
    saveLog(selectedId, updated);
    setForm(f => ({ ...f, label: '', amount: '' }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleDeleteExpense = (expId) => {
    const updated = expenses.filter(e => e.id !== expId);
    saveLog(selectedId, updated);
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
            Budget <span className={styles.pageTitleAccent}>Planner</span>
          </h1>
          <p className={styles.pageSub}>Track planned vs actual spend for every trip</p>
        </div>

        {/* Trip selector */}
        {trips.length > 0 && (
          <TripSelector
            trips={trips}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
      </div>

      {/* ── NO TRIPS STATE ─────────────────────────────────────────────────── */}
      {trips.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <p className={styles.emptyTitle}>No trips to budget yet</p>
          <p className={styles.emptyHint}>Plan a trip first, then come back to track your expenses.</p>
          <button className={styles.emptyBtn} onClick={() => navigate('/dashboard')}>
            <Icon.Plus /> Plan a trip
          </button>
        </div>
      )}

      {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
      {selectedTrip && (
        <div className={styles.mainGrid}>

          {/* ── LEFT COL ─────────────────────────────────────────────────── */}
          <div className={styles.leftCol}>

            {/* Trip summary strip */}
            <div className={styles.tripStrip}>
              <div className={styles.tripStripRoute}>
                <span className={styles.tripCity}>{selectedTrip.source}</span>
                <svg width="20" height="10" viewBox="0 0 24 12" fill="none">
                  <path d="M0 6h20M14 1l6 5-6 5" stroke="#aa9371" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={styles.tripCity}>{selectedTrip.destination}</span>
              </div>
              <div className={styles.tripStripMeta}>
                <span className={styles.metaChip}><Icon.Calendar />{formatDate(selectedTrip.startDate)}</span>
                <span className={styles.metaChip}><Icon.Users />{pax} {pax === 1 ? 'person' : 'people'}</span>
                {planned && <span className={styles.metaChip}><Icon.Fuel /> {planned.dist} km</span>}
                {planned && <span className={styles.metaChip}><Leaf size={14} style={{ marginRight: 4 }} /> {planned.carbon}</span>}
              </div>
            </div>

            {/* Planned vs Actual summary cards */}
            <div className={styles.summaryCards}>
              {[
                {
                  label: 'Planned Budget',
                  value: planned ? rupee(planned.fuel + planned.toll) : '—',
                  sub: planned ? 'Fuel + tolls estimated' : 'No trip data yet',
                  color: '#aa9371',
                },
                {
                  label: 'Total Spent',
                  value: rupee(totalActual),
                  sub: `${expenses.length} expense${expenses.length !== 1 ? 's' : ''} logged`,
                  color: totalActual > (planned?.fuel + planned?.toll || 0) ? '#e05c5c' : '#6dbf8a',
                },
                {
                  label: 'Per Person',
                  value: rupee(Math.round(totalActual / pax)),
                  sub: `Split across ${pax} traveller${pax !== 1 ? 's' : ''}`,
                  color: '#6a9fd8',
                },
                {
                  label: 'Remaining',
                  value: planned ? rupee(Math.max(0, planned.fuel + planned.toll - totalActual)) : '—',
                  sub: totalActual > (planned?.fuel + planned?.toll || 0) ? <span style={{display:'flex', alignItems:'center', gap:4}}><AlertTriangle size={14}/> Over budget</span> : 'Within estimate',
                  color: totalActual > (planned?.fuel + planned?.toll || 0) ? '#e05c5c' : '#6dbf8a',
                },
              ].map(s => (
                <div key={s.label} className={styles.summaryCard}>
                  <p className={styles.summaryLabel}>{s.label}</p>
                  <p className={styles.summaryValue} style={{ color: s.color }}>{s.value}</p>
                  <p className={styles.summarySub}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Planned breakdown (from tripUtils) */}
            {planned && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Planned Cost Breakdown</h3>
                <p className={styles.cardDesc}>
                  Auto-calculated from your trip ({planned.dist} km, {getUserPrefs(user?.id).fuelType}, {getUserPrefs(user?.id).mileage} km/l)
                </p>
                <div className={styles.breakdownList}>
                  {[
                    { label: 'Fuel',  value: planned.fuel, sub: `${planned.litres}L × ₹${FUEL_PRICES[getUserPrefs(user?.id).fuelType]}/L`, color: '#D4A574' },
                    { label: 'Tolls', value: planned.toll, sub: `Estimated for ${getUserPrefs(user?.id).vehicle}`,                         color: '#6DBFBF' },
                  ].map(r => (
                    <div key={r.label} className={styles.breakdownRow}>
                      <div className={styles.breakdownLeft}>
                        <div className={styles.breakdownDot} style={{ background: r.color }}/>
                        <div>
                          <p className={styles.breakdownLabel}>{r.label}</p>
                          <p className={styles.breakdownSub}>{r.sub}</p>
                        </div>
                      </div>
                      <span className={styles.breakdownVal} style={{ color: r.color }}>{rupee(r.value)}</span>
                    </div>
                  ))}
                  <div className={styles.breakdownTotal}>
                    <span>Estimated total</span>
                    <span>{rupee(planned.fuel + planned.toll)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Planned vs Actual comparison */}
            {planned && totalActual > 0 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Planned vs Actual</h3>
                <div className={styles.compareList}>
                  {CATEGORIES.filter(c => (planned[c.key] || 0) > 0 || actualByCat[c.key] > 0).map(c => (
                    <CompareBar
                      key={c.key}
                      label={c.label}
                      planned={planned[c.key] || 0}
                      actual={actualByCat[c.key] || 0}
                      color={c.color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Expense log */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Expense Log</h3>
              {expenses.length === 0 ? (
                <p className={styles.logEmpty}>No expenses logged yet. Add one using the form →</p>
              ) : (
                <div className={styles.expenseList}>
                  {expenses.map(e => {
                    const cat = CAT_MAP[e.category] || CAT_MAP.misc;
                    return (
                      <div key={e.id} className={styles.expenseRow}>
                        <div className={styles.expenseCatIcon} style={{ background: cat.bg, color: cat.color }}>
                          <cat.Icon />
                        </div>
                        <div className={styles.expenseInfo}>
                          <p className={styles.expenseLabel}>{e.label}</p>
                          <p className={styles.expenseMeta}>{cat.label} · {formatDate(e.date)}</p>
                        </div>
                        <span className={styles.expenseAmount}>{rupee(e.amount)}</span>
                        <button className={styles.expenseDelete} onClick={() => handleDeleteExpense(e.id)}>
                          <Icon.Trash />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COL ────────────────────────────────────────────────── */}
          <div className={styles.rightCol}>

            {/* Add expense form */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Log an Expense</h3>

              {/* Category picker */}
              <div className={styles.catGrid}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    className={`${styles.catBtn} ${form.category === c.key ? styles.catBtnActive : ''}`}
                    style={form.category === c.key
                      ? { '--cat-color': c.color, '--cat-bg': c.bg, borderColor: c.color }
                      : {}}
                    onClick={() => setForm(f => ({ ...f, category: c.key }))}
                  >
                    <div className={styles.catBtnIcon} style={{ color: c.color }}>
                      <c.Icon />
                    </div>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              <div className={styles.formFields}>
                <div className={styles.field}>
                  <label className={styles.label}>Description</label>
                  <input
                    className={styles.input}
                    placeholder={`e.g. Dinner at ${selectedTrip.destination}`}
                    value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddExpense()}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Amount (₹)</label>
                  <input
                    className={styles.input}
                    type="number"
                    placeholder="0"
                    min="0"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddExpense()}
                  />
                </div>
              </div>

              {formErr && <p className={styles.formErr}>{formErr}</p>}

              <button
                className={`${styles.addBtn} ${saved ? styles.addBtnSaved : ''}`}
                onClick={handleAddExpense}
              >
                {saved ? <><Icon.Check /> Added!</> : <><Icon.Plus /> Add Expense</>}
              </button>
            </div>

            {/* Spending donut */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Spending Breakdown</h3>
              <DonutChart slices={donutSlices} total={totalActual} />
            </div>

            {/* Per-person split — always shown when pax > 1 */}
            {pax > 1 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Per Person Split</h3>
                <p className={styles.cardDesc}>Equal split across {pax} travellers</p>
                <div className={styles.splitList}>
                  {CATEGORIES.map(c => {
                    const actual  = actualByCat[c.key] || 0;
                    const planned = c.key === 'fuel' ? (buildPlannedCosts(selectedTrip, user?.id)?.fuel || 0)
                                  : c.key === 'toll' ? (buildPlannedCosts(selectedTrip, user?.id)?.toll || 0)
                                  : 0;
                    const display = actual > 0 ? actual : planned;
                    if (display === 0) return null;
                    return (
                      <div key={c.key} className={styles.splitRow}>
                        <div className={styles.splitDot} style={{ background: c.color }}/>
                        <span className={styles.splitLabel}>
                          {c.label}
                          {actual === 0 && planned > 0 && (
                            <span className={styles.splitEstTag}>est.</span>
                          )}
                        </span>
                        <span className={styles.splitVal}>{rupee(Math.round(display / pax))}</span>
                      </div>
                    );
                  }).filter(Boolean)}
                  {(totalActual > 0 || (planned && planned.fuel + planned.toll > 0)) && (
                    <div className={styles.splitTotal}>
                      <span>Total per person</span>
                      <span>{rupee(Math.round((totalActual || (planned?.fuel || 0) + (planned?.toll || 0)) / pax))}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}