'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_BADGE: Record<string, string> = {
  active: 'badge-green', cancelled: 'badge-red', past_due: 'badge-gold', expired: 'badge-gray', inactive: 'badge-gray',
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 30;

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

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="page-sub">{total} total subscriptions</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select className="admin-input" style={{ maxWidth: 140 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {['active','cancelled','past_due','expired'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="admin-input" style={{ maxWidth: 140 }} value={plan} onChange={e => { setPlan(e.target.value); setPage(1); }}>
          <option value="">All Plans</option>
          {['founding','starter','growth','pro'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Tenant</th><th>Plan</th><th>Status</th><th>Cycle</th><th>Amount</th><th>Period End</th><th>Action</th></tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{s.tenantId?.businessName || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{s.tenantId?.email}</div>
                  </td>
                  <td><span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{s.planId}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                  <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{s.billingCycle || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.amount ? fmt(s.amount) : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{fmtDate(s.currentPeriodEnd)}</td>
                  <td>
                    {s.tenantId?._id && (
                      <Link href={`/superadmin/tenants/${s.tenantId._id}`} className="btn btn-ghost btn-sm">View →</Link>
                    )}
                  </td>
                </tr>
              ))}
              {subs.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No subscriptions</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--ink-3)', display: 'flex', alignItems: 'center' }}>Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
