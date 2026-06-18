'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../../lib/api';
import { getAdmin, hasRole } from '../../../../../lib/auth';
import { Sk, SkStatCard, SkDetailCard } from '../../../../../components/ui/Skeleton';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PLAN_BADGE: Record<string, string> = {
  trial: 'badge-gray', starter: 'badge-gray', growth: 'badge-green', scale: 'badge-purple', pro: 'badge-gold',
};

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const admin = getAdmin();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'overview' | 'subscription' | 'notes' | 'deliveries' | 'flags'>('overview');
  const [toastMsg, setToastMsg] = useState('');
  const [trialDays, setTrialDays] = useState(14);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [dlPage, setDlPage] = useState(1);
  const [dlTotal, setDlTotal] = useState(0);
  const [dlLoading, setDlLoading] = useState(false);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [flagsLoading, setFlagsLoading] = useState(false);

  useEffect(() => { load(); }, [tenantId]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'deliveries') loadDeliveries(1); }, [tab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'flags') loadFlags(); }, [tab]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/tenants/${tenantId}`);
      setData(res.data);
    } catch { /**/ }
    setLoading(false);
  }

  function toast(msg: string) { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); }

  async function toggleActive() {
    if (!data) return;
    try {
      await api.patch(`/admin/tenants/${tenantId}`, { isActive: !data.tenant.isActive });
      toast(data.tenant.isActive ? 'Tenant deactivated' : 'Tenant activated');
      load();
    } catch { toast('Failed to update'); }
  }

  async function extendTrial() {
    const days = Math.max(1, Math.min(90, trialDays));
    if (!confirm(`Extend trial by ${days} day${days === 1 ? '' : 's'}?`)) return;
    try {
      await api.patch(`/admin/subscriptions/extend-trial/${tenantId}`, { days });
      toast(`Trial extended by ${days} day${days === 1 ? '' : 's'}`);
      load();
    } catch { toast('Failed to extend trial'); }
  }

  async function impersonate() {
    try {
      const res = await api.post(`/admin/tenants/${tenantId}/impersonate`);
      const { token, user } = res.data;
      toast(`Impersonating ${user.email} — token copied`);
      navigator.clipboard?.writeText(token);
    } catch (e: any) { toast(e?.response?.data?.error || 'Failed to impersonate'); }
  }

  async function addNote() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api.post(`/admin/support/notes/${tenantId}`, { note });
      setNote('');
      toast('Note added');
      load();
    } catch { toast('Failed to add note'); }
    setSaving(false);
  }

  async function loadDeliveries(page: number) {
    setDlLoading(true);
    setDlPage(page);
    try {
      const res = await api.get(`/admin/delivery-logs?tenantId=${tenantId}&page=${page}&limit=20`);
      setDeliveries(res.data.logs || []);
      setDlTotal(res.data.total || 0);
    } catch { /**/ }
    setDlLoading(false);
  }

  async function loadFlags() {
    setFlagsLoading(true);
    try {
      const res = await api.get(`/admin/tenants/${tenantId}/flags`);
      setFlags(res.data.flags || {});
    } catch { /**/ }
    setFlagsLoading(false);
  }

  async function toggleFlag(flag: string, enabled: boolean) {
    const prev = { ...flags };
    setFlags(f => ({ ...f, [flag]: enabled }));
    try {
      await api.patch(`/admin/tenants/${tenantId}/flags`, { flag, enabled });
    } catch {
      setFlags(prev);
      toast('Failed to update flag');
    }
  }

  function timeAgo(d: string) {
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  function maskRecipient(s: string) {
    if (!s) return '—';
    return s.slice(0, 3) + '***';
  }

  if (loading) return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Sk w={80} h={11} mb={8} />
          <Sk w={220} h={24} mb={6} />
          <Sk w={200} h={13} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Sk w={90} h={32} r={7} /><Sk w={90} h={32} r={7} /><Sk w={100} h={32} r={7} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[0,1,2,3].map(i => <SkStatCard key={i} />)}
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        {[0,1,2].map(i => <div key={i} style={{ padding: '9px 16px' }}><Sk w={70} h={13} /></div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SkDetailCard rows={6} />
        <SkDetailCard rows={3} />
      </div>
    </div>
  );
  if (!data) return (
    <div className="empty-state" style={{ padding: 80 }}>
      <div className="empty-icon">🏢</div>
      <div className="empty-title">Tenant not found</div>
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => router.back()}>← Go back</button>
    </div>
  );

  const { tenant, subscription: sub, userCount, orderCount, notes } = data;
  const canEdit = hasRole(admin, 'superadmin', 'ops_admin');

  return (
    <div className="animate-fade-in">
      {toastMsg && <div className="toast toast-default">{toastMsg}</div>}

      {/* Header */}
      <div className="page-header">
        <div>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--ink-4)', fontSize: 13, cursor: 'pointer', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontFamily: 'inherit' }}>← Back to Tenants</button>
          <h1 className="page-title">{tenant.businessName}</h1>
          <p className="page-sub">{tenant.email} · {tenant.phone}</p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className={`btn btn-sm ${tenant.isActive ? 'btn-danger' : 'btn-ghost'}`} onClick={toggleActive}>
              {tenant.isActive ? 'Deactivate' : 'Activate'}
            </button>
            {tenant.planId === 'trial' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number" min={1} max={90} value={trialDays}
                  onChange={e => setTrialDays(Math.max(1, Math.min(90, parseInt(e.target.value) || 14)))}
                  style={{ width: 52, padding: '4px 6px', border: '1px solid var(--line)', borderRadius: 6, fontSize: 12, color: 'var(--ink)', background: 'var(--surface)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                />
                <button className="btn btn-ghost btn-sm" onClick={extendTrial}>+{trialDays}d Trial</button>
              </div>
            )}
            <button className="btn btn-ghost btn-sm" onClick={impersonate}>Impersonate</button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Plan', value: tenant.planId, badge: PLAN_BADGE[tenant.planId] || 'badge-gray' },
          { label: 'Users', value: userCount },
          { label: 'Total Orders', value: orderCount },
          { label: 'Orders This Month', value: tenant.ordersThisMonth },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            {s.badge
              ? <span className={`badge ${s.badge}`}>{s.value}</span>
              : <div className="stat-value">{s.value}</div>
            }
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {(['overview', 'subscription', 'notes', 'deliveries', ...(hasRole(admin, 'superadmin') ? ['flags'] : [])] as const).map((t: any) => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn${tab === t ? ' active' : ''}`} style={{ fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--accent)' : 'var(--ink-3)', borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`, textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="admin-card">
            <div className="card-header">
              <div className="card-title">Business Info</div>
            </div>
            <div className="card-body">
              {[
                ['Owner', tenant.ownerName],
                ['Category', tenant.category],
                ['Slug', tenant.slug],
                ['Joined', fmtDate(tenant.createdAt)],
                ['Trial Ends', fmtDate(tenant.trialEndsAt)],
                ['Status', tenant.isActive ? 'Active' : 'Inactive'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                  <span style={{ color: 'var(--ink-4)' }}>{k}</span>
                  <span className="cell-main">{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="admin-card">
            <div className="card-header">
              <div className="card-title">Plan Limits</div>
            </div>
            <div className="card-body">
              {[
                ['Orders/mo', tenant.planLimits?.orders === 0 ? 'Unlimited' : tenant.planLimits?.orders],
                ['Seats', tenant.planLimits?.seats],
                ['Features', (tenant.planLimits?.features || []).length + ' enabled'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                  <span style={{ color: 'var(--ink-4)' }}>{k}</span>
                  <span className="cell-main">{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'subscription' && (
        <div className="admin-card">
          {sub ? (
            <>
              <div className="card-header">
                <div className="card-title">Subscription</div>
              </div>
              <div className="card-body">
                {[
                  ['Plan', sub.planName],
                  ['Status', sub.status],
                  ['Cycle', sub.billingCycle],
                  ['Amount', sub.amount ? fmt(sub.amount) : '—'],
                  ['Seats', sub.seats],
                  ['Period Start', fmtDate(sub.currentPeriodStart)],
                  ['Period End', fmtDate(sub.currentPeriodEnd)],
                  ['Razorpay Sub ID', sub.razorpaySubId || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--ink-4)' }}>{k}</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 500, fontFamily: k?.toString().includes('ID') ? 'var(--font-mono)' : undefined, fontSize: k?.toString().includes('ID') ? 11 : 13 }}>{v?.toString() || '—'}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="card-body" style={{ textAlign: 'center', color: 'var(--ink-4)' }}>No active subscription — on trial</div>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div>
          {canEdit && (
            <div className="admin-card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a support note…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div className="card-footer">
                <button className="btn btn-primary btn-sm" onClick={addNote} disabled={saving}>
                  {saving ? <><span className="spinner" />Saving…</> : 'Add Note'}
                </button>
              </div>
            </div>
          )}
          <div className="admin-card">
            {(notes || []).length === 0
              ? <div className="card-body" style={{ textAlign: 'center', color: 'var(--ink-4)' }}>No notes yet</div>
              : (notes || []).map((n: any) => (
                  <div key={n._id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 6, lineHeight: 1.5 }}>{n.note}</div>
                    <div className="cell-sub">{n.addedByEmail} · {fmtDate(n.createdAt)}</div>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {tab === 'deliveries' && (
        <div>
          {dlLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : (
            <div className="admin-card">
              <div className="table-shell">
                <table className="admin-table">
                  <thead>
                    <tr><th>Time</th><th>Channel</th><th>Type</th><th>To</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d: any) => (
                      <tr key={d._id}>
                        <td style={{ fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>{timeAgo(d.sentAt)}</td>
                        <td><span className={`badge ${d.channel === 'email' ? 'badge-blue' : 'badge-green'}`} style={{ textTransform: 'capitalize' }}>{d.channel}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{d.messageType}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{maskRecipient(d.recipient)}</td>
                        <td>
                          <span className={`badge ${d.status === 'delivered' ? 'badge-green' : d.status === 'failed' ? 'badge-red' : d.status === 'bounced' ? 'badge-gold' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {deliveries.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No delivery logs yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {dlTotal > 20 && (
                <div className="pagination">
                  <span className="pagination-info">{(dlPage - 1) * 20 + 1}–{Math.min(dlPage * 20, dlTotal)} of {dlTotal}</span>
                  <div className="pagination-controls">
                    <button className="btn btn-ghost btn-sm" disabled={dlPage === 1} onClick={() => loadDeliveries(dlPage - 1)}>← Prev</button>
                    <button className="btn btn-ghost btn-sm" disabled={dlPage * 20 >= dlTotal} onClick={() => loadDeliveries(dlPage + 1)}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'flags' && hasRole(admin, 'superadmin') && (
        <div>
          {flagsLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : (
            <div className="admin-card">
              <div className="card-header">
                <div className="card-title">Feature Flags</div>
              </div>
              <div className="card-body">
                {['whatsapp_automation_early_access', 'analytics_starter_unlock', 'advance_bookings_trial', 'dedicated_onboarding'].map(flag => (
                  <div key={flag} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                    <div>
                      <div className="cell-main" style={{ fontFamily: 'var(--font-mono)' }}>{flag}</div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={flags[flag] === true}
                        onChange={e => toggleFlag(flag, e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12, color: flags[flag] ? 'var(--green)' : 'var(--ink-4)' }}>
                        {flags[flag] ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
