'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PLAN_BADGE: Record<string, string> = {
  trial: 'badge-gray', starter: 'badge-gray', growth: 'badge-green', scale: 'badge-purple', pro: 'badge-gold',
};

interface Tenant { _id: string; businessName: string; email: string; phone: string; planId: string; isActive: boolean; ordersThisMonth: number; createdAt: string; category: string; }

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const LIMIT = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tenants', { params: { page, limit: LIMIT, search: search || undefined, plan: plan || undefined } });
      setTenants(res.data.tenants);
      setTotal(res.data.total);
    } catch { /**/ }
    setLoading(false);
  }, [page, search, plan]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-sub">{total} total tenants</p>
        </div>
      </div>

      {/* Filters */}
      <div className="table-filter-bar">
        <input
          className="admin-input"
          style={{ maxWidth: 280 }}
          placeholder="Search by name, email, phone…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="admin-input" style={{ maxWidth: 140 }} value={plan} onChange={e => { setPlan(e.target.value); setPage(1); }}>
          <option value="">All Plans</option>
          {['trial','starter','growth','scale','pro'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      <div className="admin-card">
        <div className="table-shell">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Business</th><th>Email</th><th>Phone</th><th>Plan</th>
              <th>Orders/mo</th><th>Status</th><th>Joined</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkRows rows={10} cols={8} /> : (
              <>
                {tenants.map(t => (
                  <tr key={t._id}>
                    <td><span style={{ fontWeight: 500, color: 'var(--ink)' }}>{t.businessName}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.email}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.phone}</td>
                    <td><span className={`badge ${PLAN_BADGE[t.planId] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{t.planId}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{t.ordersThisMonth}</td>
                    <td><span className={`badge ${t.isActive ? 'badge-green' : 'badge-red'}`}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{fmtDate(t.createdAt)}</td>
                    <td><Link href={`/superadmin/tenants/${t._id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🏢</div>
                      <div className="empty-state-title">No tenants found</div>
                      <div className="empty-state-sub">Try adjusting your search or filter</div>
                    </div>
                  </td></tr>
                )}
              </>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
