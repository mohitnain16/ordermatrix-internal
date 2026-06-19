'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Settings, UserCheck, ShieldOff } from 'lucide-react';
import api from '../../../../../lib/api';
import { getAdmin, hasRole } from '../../../../../lib/auth';
import { usePageTitle } from '../../../../../lib/page-title-context';
import { Sk, SkStatCard, SkDetailCard } from '../../../../../components/ui/Skeleton';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PLAN_BADGE: Record<string, string> = {
  trial: 'badge-gold', starter: 'badge-blue', growth: 'badge-green', scale: 'badge-purple', pro: 'badge-purple',
};

const STATUS_LABEL: Record<string, string> = {
  new: 'New', confirmed: 'Confirmed', processing: 'Processing',
  ready_to_dispatch: 'Ready', dispatched: 'Dispatched',
  delivered: 'Delivered', returned: 'Returned', rto: 'RTO', cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<string, string> = {
  new: 'badge-blue', confirmed: 'badge-accent', processing: 'badge-amber',
  ready_to_dispatch: 'badge-purple', dispatched: 'badge-accent',
  delivered: 'badge-green', returned: 'badge-amber', rto: 'badge-red', cancelled: 'badge-red',
};

const ALL_STATUSES = [
  'new', 'confirmed', 'processing', 'ready_to_dispatch', 'dispatched',
  'delivered', 'returned', 'rto', 'cancelled',
] as const;

function ConfirmModal({ action, onConfirm, onCancel, loading, trialDays, setTrialDays }: any) {
  const [verifyValue, setVerifyValue] = useState('');
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className={`modal-box modal-${action.level}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{action.title}</div>
            {action.detail && <div className="modal-sub">{action.detail}</div>}
          </div>
        </div>
        <div className="modal-body">
          <p className="confirm-message">{action.message}</p>
          {action.type === 'extendTrial' && (
            <div className="input-group" style={{ marginTop: 12 }}>
              <label className="input-label">Days to extend</label>
              <input
                type="number" className="admin-input" min={1} max={90}
                value={trialDays}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrialDays(Number(e.target.value))}
              />
            </div>
          )}
          {action.verifyText && (
            <div style={{ marginTop: 16 }}>
              <div className="verify-input-label">
                Type <strong>{action.verifyText}</strong> to confirm
              </div>
              <input
                className="admin-input"
                value={verifyValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerifyValue(e.target.value)}
                placeholder={action.verifyText}
                autoFocus
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button
            className={`btn btn-sm ${action.confirmClass}`}
            onClick={onConfirm}
            disabled={loading || (action.verifyText ? verifyValue !== action.verifyText : false)}
          >
            {loading ? <span className="spinner" /> : action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { setTitle } = usePageTitle();

  useEffect(() => { load(); }, [tenantId]);
  useEffect(() => {
    const name = data?.tenant?.businessName;
    if (name) setTitle(name);
    return () => setTitle(null);
  }, [data?.tenant?.businessName]);
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

  async function handleConfirm() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      switch (confirmAction.type) {
        case 'extendTrial':            await extendTrial(); break;
        case 'impersonate':            await impersonate(); break;
        case 'deactivate':
        case 'reactivate':             await toggleActive(); break;
      }
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[0,1,2,3,4].map(i => <SkStatCard key={i} />)}
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

  const { tenant, subscription: sub, userCount, orderCount, notes, lastActiveAt, ordersByStatus } = data;
  const canEdit = hasRole(admin, 'superadmin', 'ops_admin');

  const ACTIONS = {
    extendTrial: {
      type: 'extendTrial',
      title: 'Extend Trial',
      message: `Extend trial for ${tenant.businessName}?`,
      detail: 'Trial will be extended from today.',
      level: 'warning',
      verifyText: null,
      confirmLabel: 'Extend Trial',
      confirmClass: 'btn-primary',
    },
    impersonate: {
      type: 'impersonate',
      title: 'Impersonate Tenant',
      message: `You are about to log in as ${tenant.businessName}. All actions will be performed as this tenant.`,
      detail: 'Session expires in 15 minutes. This action is logged.',
      level: 'warning',
      verifyText: null,
      confirmLabel: 'Start Session',
      confirmClass: 'btn-primary',
    },
    deactivate: {
      type: 'deactivate',
      title: 'Deactivate Tenant',
      message: `This will immediately lock out all users of ${tenant.businessName}.`,
      detail: 'The tenant will lose access to their account until reactivated.',
      level: 'danger',
      verifyText: tenant.businessName,
      confirmLabel: 'Deactivate',
      confirmClass: 'btn-danger',
    },
    reactivate: {
      type: 'reactivate',
      title: 'Reactivate Tenant',
      message: `Reactivate ${tenant.businessName} and restore full access?`,
      detail: null,
      level: 'warning',
      verifyText: null,
      confirmLabel: 'Reactivate',
      confirmClass: 'btn-primary',
    },
  };

  return (
    <div className="animate-fade-in">
      {toastMsg && <div className="toast toast-default">{toastMsg}</div>}

      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
          loading={actionLoading}
          trialDays={trialDays}
          setTrialDays={setTrialDays}
        />
      )}

      {/* Back link */}
      <button
        onClick={() => router.back()}
        style={{ background: 'none', border: 'none', color: 'var(--ink-4)', fontSize: 13, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontFamily: 'inherit' }}
      >
        ← Back to Tenants
      </button>

      {/* A — Page header block */}
      <div className="tenant-header">
        <div className="tenant-name">{tenant.businessName}</div>
        <div className="tenant-meta">
          <span>{tenant.email}</span>
          <span>·</span>
          <span>{tenant.phone}</span>
          <span>·</span>
          <span>Joined {fmtDate(tenant.createdAt)}</span>
          <span className={`badge ${tenant.isActive ? 'badge-green' : 'badge-red'}`}>
            {tenant.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* B — Action bar */}
      {canEdit && (
        <div className="action-bar">
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmAction(ACTIONS.extendTrial)}>
            <Calendar size={14} style={{ marginRight: 5 }} />
            Extend Trial
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => toast('Override Plan — coming soon')}>
            <Settings size={14} style={{ marginRight: 5 }} />
            Override Plan
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setConfirmAction(ACTIONS.impersonate)}>
            <UserCheck size={14} style={{ marginRight: 5 }} />
            Impersonate
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setConfirmAction(tenant.isActive ? ACTIONS.deactivate : ACTIONS.reactivate)}
          >
            <ShieldOff size={14} style={{ marginRight: 5 }} />
            {tenant.isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      )}

      {/* C — Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Plan</div>
          <div className="stat-value" style={{ textTransform: 'capitalize', fontSize: 18 }}>{tenant.planId}</div>
          <span className={`badge ${PLAN_BADGE[tenant.planId] || 'badge-gray'}`}>{tenant.planId}</span>
        </div>
        {[
          { label: 'Users', value: userCount },
          { label: 'Total Orders', value: orderCount },
          { label: 'Orders This Month', value: tenant.ordersThisMonth },
          { label: 'Last Active', value: lastActiveAt ? timeAgo(lastActiveAt) : '—' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {(['overview', 'subscription', 'notes', 'deliveries', ...(hasRole(admin, 'superadmin') ? ['flags'] : [])] as const).map((t: any) => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn${tab === t ? ' active' : ''}`} style={{ textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

          {/* D — Order Activity grid */}
          <div className="admin-card">
            <div className="card-header">
              <div className="card-title">Order Activity</div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="order-activity-grid">
                {ALL_STATUSES.map(status => (
                  <div className="order-activity-cell" key={status}>
                    <span className={`order-activity-count${(ordersByStatus?.[status] ?? 0) === 0 ? ' zero' : ''}`}>
                      {ordersByStatus?.[status] ?? 0}
                    </span>
                    <span className={`badge ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
                  </div>
                ))}
              </div>
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
