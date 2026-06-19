'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { getAdmin, hasRole } from '../../../../lib/auth';
import { SkRows } from '../../../../components/ui/Skeleton';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const toISODate = (d: string) => d ? new Date(d).toISOString().slice(0, 10) : '';

const STATUS_BADGE: Record<string, string> = {
  active: 'badge-green', cancelled: 'badge-red', past_due: 'badge-gold', expired: 'badge-gray', inactive: 'badge-gray',
};

const PLANS = ['starter', 'growth', 'pro'] as const;
const STATUSES = ['active', 'trialing', 'past_due', 'cancelled'] as const;
const CYCLES = ['monthly', 'annual'] as const;

type OverrideForm = {
  planId: string;
  billingPeriod: string;
  status: string;
  currentPeriodEnd: string;
  seats: number;
  reason: string;
};

const emptyOverride: OverrideForm = { planId: 'growth', billingPeriod: 'monthly', status: 'active', currentPeriodEnd: '', seats: 2, reason: '' };


export default function SubscriptionsPage() {
  const [subs, setSubs]     = useState<any[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [plan, setPlan]     = useState('');
  const [page, setPage]     = useState(1);
  const LIMIT = 30;

  const admin    = getAdmin();
  const canOverride = hasRole(admin, 'superadmin', 'ops_admin');

  const [overrideSub, setOverrideSub]   = useState<any | null>(null);
  const [overrideForm, setOverrideForm] = useState<OverrideForm>(emptyOverride);
  const [overriding, setOverriding]     = useState(false);
  const [toastMsg, setToastMsg]         = useState('');

  function toast(msg: string) { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3500); }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/subscriptions', { params: { page, limit: LIMIT, status: status || undefined, plan: plan || undefined } });
      setSubs(res.data.subscriptions);
      setTotal(res.data.total);
    } catch { /**/ }
    setLoading(false);
  }, [page, status, plan]);

  useEffect(() => { load(); }, [load]);

  function openOverride(sub: any) {
    setOverrideForm({
      planId:           sub.planId || 'growth',
      billingPeriod:    sub.billingCycle || 'monthly',
      status:           sub.status || 'active',
      currentPeriodEnd: toISODate(sub.currentPeriodEnd),
      seats:            sub.seats || 1,
      reason:           '',
    });
    setOverrideSub(sub);
  }

  async function handleOverride() {
    if (!overrideForm.reason.trim()) { toast('Internal reason is required'); return; }
    if (!overrideSub) return;
    setOverriding(true);
    try {
      await api.patch(`/admin/subscriptions/${overrideSub._id}/override`, {
        planId:          overrideForm.planId,
        billingPeriod:   overrideForm.billingPeriod,
        status:          overrideForm.status,
        currentPeriodEnd: overrideForm.currentPeriodEnd || undefined,
        seats:           overrideForm.seats,
        reason:          overrideForm.reason,
      });
      const planLabel = overrideForm.planId.charAt(0).toUpperCase() + overrideForm.planId.slice(1);
      toast(`Override applied — now on ${planLabel} (${overrideForm.status})`);
      setOverrideSub(null);
      load();
    } catch (e: any) {
      toast(e?.response?.data?.error || 'Override failed');
    }
    setOverriding(false);
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-fade-in">
      {toastMsg && <div className="toast toast-default">{toastMsg}</div>}

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="page-sub">{total} total subscriptions</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      <div className="table-filter-bar">
        <select className="admin-input" style={{ maxWidth: 140 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {['active','cancelled','past_due','expired'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="admin-input" style={{ maxWidth: 140 }} value={plan} onChange={e => { setPlan(e.target.value); setPage(1); }}>
          <option value="">All Plans</option>
          {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="admin-card">
        <div className="table-shell">
          <table className="admin-table">
            <thead>
              <tr><th>Tenant</th><th>Plan</th><th>Status</th><th>Cycle</th><th>Amount</th><th>Period End</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <SkRows rows={10} cols={7} /> : (
                <>
                  {subs.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className="cell-main">{s.tenantId?.businessName || '—'}</div>
                        <div className="cell-sub">{s.tenantId?.email}</div>
                      </td>
                      <td><span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{s.planId}</span></td>
                      <td><span className={`badge ${STATUS_BADGE[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                      <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{s.billingCycle || '—'}</td>
                      <td className="cell-mono" style={{ fontWeight: 600 }}>{s.amount ? fmt(s.amount) : '—'}</td>
                      <td className="cell-sub">{fmtDate(s.currentPeriodEnd)}</td>
                      <td>
                        <div className="gap-2" style={{ display: 'flex' }}>
                          {s.tenantId?._id && <Link href={`/superadmin/tenants/${s.tenantId._id}`} className="btn btn-ghost btn-sm">View →</Link>}
                          {canOverride && <button className="btn btn-ghost btn-sm" onClick={() => openOverride(s)}>Override</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {subs.length === 0 && (
                    <tr><td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">💳</div>
                        <div className="empty-state-title">No subscriptions found</div>
                      </div>
                    </td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex-center gap-2" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Override modal */}
      {overrideSub && (
        <div className="modal-backdrop" onClick={() => setOverrideSub(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 480 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Subscription Override</div>
                <div className="modal-sub">{overrideSub.tenantId?.businessName}</div>
              </div>
              <button onClick={() => setOverrideSub(null)} className="btn btn-ghost btn-sm btn-icon">✕</button>
            </div>
            <div className="modal-body stack-4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Plan</label>
                  <select className="admin-input" value={overrideForm.planId} onChange={e => setOverrideForm(f => ({ ...f, planId: e.target.value }))}>
                    {PLANS.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Billing Period</label>
                  <select className="admin-input" value={overrideForm.billingPeriod} onChange={e => setOverrideForm(f => ({ ...f, billingPeriod: e.target.value }))}>
                    {CYCLES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Status</label>
                  <select className="admin-input" value={overrideForm.status} onChange={e => setOverrideForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Seats</label>
                  <input type="number" min={1} max={100} className="admin-input" value={overrideForm.seats} onChange={e => setOverrideForm(f => ({ ...f, seats: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Current Period End</label>
                <input type="date" className="admin-input" value={overrideForm.currentPeriodEnd} onChange={e => setOverrideForm(f => ({ ...f, currentPeriodEnd: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Internal Reason <span style={{ color: 'var(--accent)' }}>*</span></label>
                <input className="admin-input" placeholder="e.g. Sales deal — 3 months free Growth" value={overrideForm.reason} onChange={e => setOverrideForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
              <div className="alert alert-warning">
                This is a permanent change. It will update both the Subscription and Tenant records immediately.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setOverrideSub(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleOverride} disabled={overriding}>
                {overriding ? <><span className="spinner" />Applying…</> : 'Apply Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
