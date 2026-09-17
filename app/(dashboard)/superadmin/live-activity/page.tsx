'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../../lib/api';
import { Sk } from '../../../../components/ui/Skeleton';

function SkRows({ n = 4 }: { n?: number }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{
    Array.from({ length: n }, (_, i) => <Sk key={i} h={18} mb={0} />)
  }</div>;
}

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

interface RouteMinutes {
  route: string;
  minutes: number;
}

interface UserActivity {
  userId: string;
  userName: string;
  userEmail: string;
  routes: RouteMinutes[];
  totalMinutes: number;
}

interface ActivityData {
  date: string;
  users: UserActivity[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusDot(lastSeenAt: string) {
  const ageMs = Date.now() - new Date(lastSeenAt).getTime();
  const color = ageMs < 2 * 60 * 1000 ? 'var(--green)' : 'var(--gold)';
  const label = ageMs < 2 * 60 * 1000 ? 'Online' : 'Away';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span style={{ fontSize: 12, color }}>{label}</span>
    </span>
  );
}

function ago(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function OnlineNow({ online, loading, lastRefresh }: {
  online: OnlineUser[];
  loading: boolean;
  lastRefresh: Date | null;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Online Now</h2>
        <span className="badge badge-blue">{online.length}</span>
        {lastRefresh && (
          <span style={{ fontSize: 12, color: 'var(--ink-4)', marginLeft: 'auto' }}>
            Refreshes every 30 s · last {ago(lastRefresh.toISOString())}
          </span>
        )}
      </div>

      {loading && !online.length ? (
        <SkRows n={5} />
      ) : online.length === 0 ? (
        <p style={{ color: 'var(--ink-4)', fontSize: 14 }}>No users active in the last 5 minutes.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Tenant</th>
                <th>User</th>
                <th>Current Page</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {online.map(u => (
                <tr key={`${u.tenantId}-${u.userId}`}>
                  <td>{statusDot(u.lastSeenAt)}</td>
                  <td style={{ fontWeight: 500 }}>{u.tenantName}</td>
                  <td>
                    <div>{u.userName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{u.userEmail}</div>
                  </td>
                  <td>
                    <code style={{ fontSize: 12, background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>
                      {u.currentRoute || '/'}
                    </code>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--ink-3)' }}>{ago(u.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ActivityBreakdown({ tenantOptions }: { tenantOptions: { id: string; name: string }[] }) {
  const [tenantId, setTenantId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/presence/activity/${tenantId}?date=${date}`);
      setData(res.data);
    } catch {
      setError('Failed to load activity data.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, date]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Time Breakdown by Tenant</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          className="input"
          style={{ minWidth: 220 }}
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
        >
          <option value="">— Select tenant —</option>
          {tenantOptions.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <input
          type="date"
          className="input"
          value={date}
          max={todayStr()}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {!tenantId && (
        <p style={{ color: 'var(--ink-4)', fontSize: 14 }}>Select a tenant to view their activity breakdown.</p>
      )}

      {tenantId && loading && <SkRows n={4} />}

      {tenantId && !loading && error && (
        <p style={{ color: 'var(--red)', fontSize: 14 }}>{error}</p>
      )}

      {tenantId && !loading && data && data.users.length === 0 && (
        <p style={{ color: 'var(--ink-4)', fontSize: 14 }}>No activity recorded for this tenant on {data.date}.</p>
      )}

      {tenantId && !loading && data && data.users.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {data.users.map(u => (
            <div key={u.userId.toString()} className="card">
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.userName}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{u.userEmail}</div>
                </div>
                <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>
                  {u.totalMinutes} min total
                </span>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th style={{ textAlign: 'right' }}>Time (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.routes.map(r => (
                      <tr key={r.route}>
                        <td>
                          <code style={{ fontSize: 12, background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>
                            {r.route || '/'}
                          </code>
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.minutes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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

      // Build tenant options from online users + keep existing ones
      setTenantOptions(prev => {
        const map = new Map(prev.map(t => [t.id, t.name]));
        users.forEach(u => map.set(u.tenantId, u.tenantName));
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
      });
    } catch {
      // silent — stale data is better than an error flash on a polling page
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnline();
    intervalRef.current = setInterval(fetchOnline, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchOnline]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Live Activity</h1>
        <p className="page-subtitle">Real-time tenant user presence and page-level time tracking.</p>
      </div>

      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {(['online', 'activity'] as TabId[]).map(t => (
          <button
            key={t}
            className={`tab-btn${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'online' ? 'Online Now' : 'Time Breakdown'}
          </button>
        ))}
      </div>

      {tab === 'online' && (
        <OnlineNow online={online} loading={loading} lastRefresh={lastRefresh} />
      )}
      {tab === 'activity' && (
        <ActivityBreakdown tenantOptions={tenantOptions} />
      )}
    </div>
  );
}
