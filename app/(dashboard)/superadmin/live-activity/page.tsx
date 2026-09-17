'use client';
import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

// ── Types ──────────────────────────────────────────────────────────────────────

interface OnlineUser {
  tenantId: string;
  tenantName: string;
  userId: string;
  userName: string;
  userEmail: string;
  currentRoute: string;
  lastSeenAt: string;
}

interface RouteMinutes { route: string; minutes: number; }
interface UserActivity {
  userId: string; userName: string; userEmail: string;
  routes: RouteMinutes[]; totalMinutes: number;
}
interface ActivityData { date: string; users: UserActivity[]; }

// ── Helpers ────────────────────────────────────────────────────────────────────

function msAgo(d: string) { return Date.now() - new Date(d).getTime(); }

function ago(d: string) {
  const s = Math.floor(msAgo(d) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function fmtTs(d: string) {
  return d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

// ── SortHeader — no shared component exists; candidate for extraction ──────────

type SortDir = 'asc' | 'desc';
type OnlineSortKey = 'tenantName' | 'userName' | 'lastSeenAt';

function SortTh({ label, col, active, dir, onSort }: {
  label: string; col: OnlineSortKey; active: boolean; dir: SortDir;
  onSort: (c: OnlineSortKey) => void;
}) {
  return (
    <th onClick={() => onSort(col)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label}
      <span style={{ marginLeft: 4, fontSize: 10, opacity: active ? 1 : 0.3 }}>
        {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────────

function StatusBadge({ lastSeenAt }: { lastSeenAt: string }) {
  const online = msAgo(lastSeenAt) < 2 * 60 * 1000;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: online ? 'var(--green)' : 'var(--gold)',
      }} />
      <span className={`badge ${online ? 'badge-green' : 'badge-gold'}`}>
        {online ? 'Online' : 'Away'}
      </span>
    </span>
  );
}

// ── MiniBar ────────────────────────────────────────────────────────────────────

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--surface-2)', display: 'inline-block', flexShrink: 0 }}>
        <span style={{ display: 'block', width: `${pct}%`, height: '100%', borderRadius: 3, background: 'var(--blue)' }} />
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, minWidth: 28 }}>{value}</span>
    </span>
  );
}

// ── OnlineNow ──────────────────────────────────────────────────────────────────

function OnlineNow({ online, loading, lastRefresh, onRefresh }: {
  online: OnlineUser[]; loading: boolean; lastRefresh: Date | null; onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<OnlineSortKey>('lastSeenAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (col: OnlineSortKey) => {
    if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(col); setSortDir('asc'); }
  };

  const filtered = online
    .filter(u => {
      if (!search) return true;
      const q = search.toLowerCase();
      return u.tenantName.toLowerCase().includes(q)
        || u.userName.toLowerCase().includes(q)
        || u.userEmail.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'lastSeenAt') cmp = new Date(a.lastSeenAt).getTime() - new Date(b.lastSeenAt).getTime();
      else if (sortKey === 'tenantName') cmp = a.tenantName.localeCompare(b.tenantName);
      else if (sortKey === 'userName') cmp = a.userName.localeCompare(b.userName);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  return (
    <>
      <div className="table-filter-bar">
        <input
          className="admin-input"
          style={{ maxWidth: 280 }}
          placeholder="Search tenant or user…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>
          {online.length} user{online.length !== 1 ? 's' : ''} active in last 5 min
        </span>
        {lastRefresh && (
          <span style={{ fontSize: 12, color: 'var(--ink-4)', marginLeft: 'auto' }}>
            Auto-refreshes every 30 s · {ago(lastRefresh.toISOString())}
          </span>
        )}
        <button className="btn btn-ghost btn-sm" onClick={onRefresh}>Refresh</button>
      </div>

      <div className="admin-card">
        <div className="table-shell">
          <table className="admin-table">
            <thead>
              <tr>
                <SortTh label="Tenant"    col="tenantName" active={sortKey === 'tenantName'} dir={sortDir} onSort={handleSort} />
                <SortTh label="User"      col="userName"   active={sortKey === 'userName'}   dir={sortDir} onSort={handleSort} />
                <th>Status</th>
                <th>Current Page</th>
                <SortTh label="Last Seen" col="lastSeenAt" active={sortKey === 'lastSeenAt'} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {loading && !online.length ? (
                <SkRows rows={6} cols={5} />
              ) : (
                <>
                  {filtered.map(u => (
                    <tr key={`${u.tenantId}-${u.userId}`}>
                      <td><span className="cell-main">{u.tenantName}</span></td>
                      <td>
                        <div className="cell-main">{u.userName}</div>
                        <div className="cell-sub">{u.userEmail}</div>
                      </td>
                      <td><StatusBadge lastSeenAt={u.lastSeenAt} /></td>
                      <td>
                        <code className="cell-mono" style={{ fontSize: 12, background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4 }}>
                          {u.currentRoute || '/'}
                        </code>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 12 }}>{ago(u.lastSeenAt)}</div>
                        <div className="cell-sub">{fmtTs(u.lastSeenAt)}</div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📡</div>
                        <div className="empty-state-title">
                          {online.length === 0 ? 'No users currently online' : 'No results for that search'}
                        </div>
                        <div className="empty-state-sub">
                          {online.length === 0
                            ? 'Active users appear here within 30 s of opening the tenant app.'
                            : 'Try clearing your search.'}
                        </div>
                      </div>
                    </td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── ActivityBreakdown ─────────────────────────────────────────────────────────

function ActivityBreakdown({ tenantOptions }: { tenantOptions: { id: string; name: string }[] }) {
  const [tenantId, setTenantId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true); setError('');
    try {
      const res = await api.get(`/admin/presence/activity/${tenantId}?date=${date}`);
      setData(res.data);
    } catch { setError('Failed to load activity data.'); } finally { setLoading(false); }
  }, [tenantId, date]);

  useEffect(() => { load(); }, [load]);

  const maxMinutes = data ? Math.max(1, ...data.users.flatMap(u => u.routes.map(r => r.minutes))) : 1;

  return (
    <>
      <div className="table-filter-bar">
        <select className="admin-input" style={{ minWidth: 220 }} value={tenantId} onChange={e => setTenantId(e.target.value)}>
          <option value="">— Select tenant —</option>
          {tenantOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input type="date" className="admin-input" value={date} max={todayStr()} onChange={e => setDate(e.target.value)} />
      </div>

      {!tenantId && (
        <div className="admin-card">
          <div className="empty-state" style={{ padding: '40px 0' }}>
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">Select a tenant above</div>
            <div className="empty-state-sub">Time-on-page breakdown will appear here.</div>
          </div>
        </div>
      )}

      {tenantId && (
        <div className="admin-card">
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr><th>User</th><th>Page</th><th>Time (min)</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkRows rows={6} cols={3} />
                ) : error ? (
                  <tr><td colSpan={3} style={{ padding: '20px 16px', color: 'var(--red)', fontSize: 14 }}>{error}</td></tr>
                ) : !data || data.users.length === 0 ? (
                  <tr><td colSpan={3}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <div className="empty-state-title">No activity recorded for {data?.date ?? date}</div>
                      <div className="empty-state-sub">Try selecting a different date.</div>
                    </div>
                  </td></tr>
                ) : (
                  data.users.map((u, uIdx) => (
                    <Fragment key={u.userId}>
                      {u.routes.map((r, rIdx) => (
                        <tr key={r.route}>
                          {/* User cell spans all route rows + the subtotal row */}
                          {rIdx === 0 && (
                            <td rowSpan={u.routes.length + 1} style={{ verticalAlign: 'top', paddingTop: 14 }}>
                              <div className="cell-main">{u.userName}</div>
                              <div className="cell-sub">{u.userEmail}</div>
                            </td>
                          )}
                          <td>
                            <code className="cell-mono" style={{ fontSize: 12, background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4 }}>
                              {r.route || '/'}
                            </code>
                          </td>
                          <td><MiniBar value={r.minutes} max={maxMinutes} /></td>
                        </tr>
                      ))}
                      {/* Subtotal row — user-cell is still occupied by rowSpan above */}
                      <tr style={{ background: 'var(--surface-2)' }}>
                        <td style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>Total</td>
                        <td><span className="badge badge-blue">{u.totalMinutes} min</span></td>
                      </tr>
                      {/* Spacer row between users */}
                      {uIdx < data.users.length - 1 && (
                        <tr aria-hidden="true"><td colSpan={3} style={{ height: 10, padding: 0, background: 'transparent' }} /></tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type TabId = 'online' | 'activity';

export default function LiveActivityPage() {
  const [tab, setTab] = useState<TabId>('online');
  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [tenantOptions, setTenantOptions] = useState<{ id: string; name: string }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOnline = useCallback(async () => {
    try {
      const res = await api.get('/admin/presence');
      const users: OnlineUser[] = res.data.online || [];
      setOnline(users);
      setLastRefresh(new Date());
      // Accumulate tenant options from seen online users so the activity tab
      // keeps its dropdown populated even after users go offline.
      setTenantOptions(prev => {
        const map = new Map(prev.map(t => [t.id, t.name]));
        users.forEach(u => map.set(u.tenantId, u.tenantName));
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
      });
    } catch { /**/ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchOnline();
    intervalRef.current = setInterval(fetchOnline, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchOnline]);

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Live Activity</h1>
          <p className="page-sub">Real-time tenant user presence and page-level time tracking.</p>
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: 20 }}>
        <button className={`tab-btn${tab === 'online' ? ' active' : ''}`} onClick={() => setTab('online')}>
          Online Now
          {online.length > 0 && <span className="badge badge-green" style={{ marginLeft: 6 }}>{online.length}</span>}
        </button>
        <button className={`tab-btn${tab === 'activity' ? ' active' : ''}`} onClick={() => setTab('activity')}>
          Time Breakdown
        </button>
      </div>

      {tab === 'online' && (
        <OnlineNow online={online} loading={loading} lastRefresh={lastRefresh} onRefresh={fetchOnline} />
      )}
      {tab === 'activity' && (
        <ActivityBreakdown tenantOptions={tenantOptions} />
      )}
    </div>
  );
}
