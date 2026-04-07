import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminPanel.module.css';
import axios from 'axios';
import { Sparkles, User } from 'lucide-react';

const API = 'http://localhost:8000';

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
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  TrendUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Chart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Crown: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l4 8 6-8 6 8 4-8v14H2z"/>
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30)  return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// Simple bar chart
function MiniBar({ value, max, color }) {
  return (
    <div style={{ flex: 1, height: 5, background: 'var(--color-surface-2)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${max ? (value / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }}/>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`${styles.toast} ${type === 'error' ? styles.toastError : styles.toastSuccess}`}>
      {type === 'success' ? <Icon.Check /> : '!'} {msg}
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={styles.confirmBox}>
        <p className={styles.confirmMsg}>{msg}</p>
        <div className={styles.confirmBtns}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button className={styles.confirmDeleteBtn} onClick={onConfirm}>Yes, delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate  = useNavigate();
  const [admin, setAdmin]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview | users
  const [toast, setToast]     = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, username }
  const [promoting, setPromoting] = useState(null); // user id being promoted
  const [deleting, setDeleting]   = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored || !token) { navigate('/login'); return; }
    try {
      const u = JSON.parse(stored);
      if (u.role !== 'admin') { navigate('/dashboard'); return; }
      setAdmin(u);
    } catch { navigate('/login'); return; }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API}/api/auth/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load users.');
    } finally { setLoading(false); }
  };

  const handlePromote = async (user, newRole) => {
    setPromoting(user.id);
    try {
      await axios.post(`${API}/api/auth/admin/promote`,
        { email: user.email, role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      showToast(`${user.username} is now ${newRole}`, 'success');
    } catch (e) {
      showToast(e?.response?.data?.detail || 'Failed to update role.', 'error');
    } finally { setPromoting(null); }
  };

  const handleDelete = async (userId) => {
    setConfirmDelete(null);
    setDeleting(userId);
    try {
      await axios.delete(`${API}/api/auth/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('User deleted.', 'success');
    } catch (e) {
      showToast(e?.response?.data?.detail || 'Failed to delete user.', 'error');
    } finally { setDeleting(null); }
  };

  const showToast = (msg, type) => setToast({ msg, type });

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = users.length;
    const admins  = users.filter(u => u.role === 'admin').length;
    const regular = total - admins;
    const today   = new Date().toDateString();
    const newToday = users.filter(u => new Date(u.created_at).toDateString() === today).length;
    // Join date distribution by month (last 6)
    const now = new Date();
    const monthBars = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return {
        label: d.toLocaleDateString('en-IN', { month: 'short' }),
        value: users.filter(u => {
          const ud = new Date(u.created_at);
          return ud.getFullYear() === d.getFullYear() && ud.getMonth() === d.getMonth();
        }).length,
      };
    });
    const maxBar = Math.max(...monthBars.map(b => b.value), 1);
    return { total, admins, regular, newToday, monthBars, maxBar };
  }, [users]);

  // ── Filtered users ───────────────────────────────────────────────────────
  const visible = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (!admin) return null;

  return (
    <div className={styles.page}>

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
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
          <span className={styles.adminBadge}><Icon.Shield /> Admin Panel</span>
        </div>
        <div className={styles.navRight}>
          <span className={styles.adminUser}>{admin.username}</span>
          <button className={styles.logoutBtn} onClick={() => {
            localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login');
          }}>
            <Icon.Logout />
          </button>
        </div>
      </nav>

      {/* ── PAGE HEADER ──────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Admin <span className={styles.pageTitleAccent}>Panel</span>
          </h1>
          <p className={styles.pageSub}>Manage users and monitor platform activity</p>
        </div>
        <div className={styles.tabRow}>
          {[
            { id: 'overview', label: 'Overview', Ic: Icon.Chart },
            { id: 'users',    label: 'Users',    Ic: Icon.Users },
          ].map(t => (
            <button
              key={t.id}
              className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <t.Ic />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className={styles.overviewGrid}>

          {/* Stat cards */}
          {[
            { label: 'Total Users',   value: stats.total,    color: '#aa9371', icon: <Icon.Users /> },
            { label: 'Admins',        value: stats.admins,   color: '#6a9fd8', icon: <Icon.Shield /> },
            { label: 'Regular Users', value: stats.regular,  color: '#6dbf8a', icon: <User size={18} /> },
            { label: 'Joined Today',  value: stats.newToday, color: '#e09a4a', icon: <Sparkles size={18} /> },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statCardTop}>
                <span className={styles.statIcon}>{s.icon}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
              <span className={styles.statVal} style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}

          {/* Growth chart */}
          <div className={`${styles.card} ${styles.growthCard}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>User Growth</h3>
              <span className={styles.cardSub}>Last 5 months</span>
            </div>
            <div className={styles.barChart}>
              {stats.monthBars.map(b => (
                <div key={b.label} className={styles.barCol}>
                  <span className={styles.barVal}>{b.value > 0 ? b.value : ''}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ height: `${(b.value / stats.maxBar) * 100}%` }}
                    />
                  </div>
                  <span className={styles.barLabel}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Role breakdown */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ marginBottom: 16 }}>Role Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Regular Users', value: stats.regular, color: '#6dbf8a' },
                { label: 'Admins',        value: stats.admins,  color: '#6a9fd8' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0 }}/>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', flex: 1 }}>{r.label}</span>
                  <MiniBar value={r.value} max={stats.total} color={r.color} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary)', minWidth: 24, textAlign: 'right' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent joins */}
          <div className={`${styles.card} ${styles.recentCard}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Recent Joins</h3>
            </div>
            <div className={styles.recentList}>
              {users.slice(0, 6).map(u => (
                <div key={u.id} className={styles.recentRow}>
                  <div className={styles.recentAvatar}>
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.recentInfo}>
                    <p className={styles.recentName}>{u.username}</p>
                    <p className={styles.recentEmail}>{u.email}</p>
                  </div>
                  <div className={styles.recentMeta}>
                    {u.role === 'admin' && (
                      <span className={styles.adminRoleBadge}><Icon.Crown /> Admin</span>
                    )}
                    <span className={styles.recentTime}>{timeAgo(u.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── USERS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className={styles.usersSection}>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Icon.Search />
              <input
                className={styles.searchInput}
                placeholder="Search by username or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className={styles.refreshBtn} onClick={fetchUsers}>
              <Icon.Refresh /> Refresh
            </button>
            <span className={styles.userCount}>{visible.length} user{visible.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Error */}
          {error && <p className={styles.errorMsg}>{error}</p>}

          {/* Loading */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}/>
              <p>Loading users…</p>
            </div>
          ) : (
            <div className={styles.userTable}>
              {/* Table head */}
              <div className={styles.tableHead}>
                <span className={styles.thUser}>User</span>
                <span className={styles.thJoined}>Joined</span>
                <span className={styles.thRole}>Role</span>
                <span className={styles.thActions}>Actions</span>
              </div>

              {/* Rows */}
              {visible.map(u => {
                const isSelf    = u.id === admin.id;
                const isDeleting = deleting === u.id;
                const isPromoting = promoting === u.id;

                return (
                  <div
                    key={u.id}
                    className={`${styles.tableRow} ${isSelf ? styles.tableRowSelf : ''} ${isDeleting ? styles.tableRowDeleting : ''}`}
                  >
                    {/* User info */}
                    <div className={styles.tdUser}>
                      <div className={styles.userAvatar}>
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className={styles.userName}>
                          {u.username}
                          {isSelf && <span className={styles.selfTag}>You</span>}
                        </p>
                        <p className={styles.userEmail}>{u.email}</p>
                      </div>
                    </div>

                    {/* Joined */}
                    <div className={styles.tdJoined}>
                      <span className={styles.joinedDate}>{formatDate(u.created_at)}</span>
                      <span className={styles.joinedAgo}>{timeAgo(u.created_at)}</span>
                    </div>

                    {/* Role */}
                    <div className={styles.tdRole}>
                      <span className={`${styles.roleBadge} ${u.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeUser}`}>
                        {u.role === 'admin' ? <><Icon.Crown /> Admin</> : 'User'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className={styles.tdActions}>
                      {!isSelf && (
                        <>
                          <button
                            className={styles.promoteBtn}
                            disabled={isPromoting}
                            onClick={() => handlePromote(u, u.role === 'admin' ? 'user' : 'admin')}
                            title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                          >
                            {isPromoting
                              ? <span className={styles.btnSpinner}/>
                              : u.role === 'admin' ? '↓ Demote' : '↑ Promote'
                            }
                          </button>
                          <button
                            className={styles.deleteBtn}
                            disabled={isDeleting}
                            onClick={() => setConfirmDelete({ id: u.id, username: u.username })}
                            title="Delete user"
                          >
                            {isDeleting ? <span className={styles.btnSpinner}/> : <Icon.Trash />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CONFIRM DELETE ───────────────────────────────────────────────── */}
      {confirmDelete && (
        <ConfirmDialog
          msg={`Delete "${confirmDelete.username}"? This cannot be undone.`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── TOAST ────────────────────────────────────────────────────────── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}