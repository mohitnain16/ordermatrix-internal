'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (r: number) => '₹' + (r || 0).toLocaleString('en-IN');

const PLAN_BADGE: Record<string, string> = {
  trial: 'badge-gray', free: 'badge-gray', starter: 'badge-gray', growth: 'badge-green', pro: 'badge-gold',
};
const STATUS_BADGE: Record<string, string> = { live: 'badge-green', draft: 'badge-gray', paused: 'badge-red' };

interface Store {
  _id: string; businessName: string; planId: string;
  host: string | null; storeStatus: string;
  gmv30d: number; orders30d: number; lastOrderAt: string | null;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const LIMIT = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tenants/stores', { params: { page, limit: LIMIT, search: search || undefined, status: status || undefined } });
      setStores(res.data.stores);
      setTotal(res.data.total);
    } catch { /**/ }
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Stores</h1>
          <p className="page-sub">{total} storefront{total === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="table-filter-bar">
        <input
          className="admin-input"
          style={{ maxWidth: 280 }}
          placeholder="Search by name or email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="admin-input" style={{ maxWidth: 140 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {['live', 'draft', 'paused'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      <div className="admin-card">
        <div className="table-shell">
          <table className="admin-table mobile-cards">
            <thead>
              <tr>
                <th>Store</th><th>Host</th><th>Plan</th><th>Status</th>
                <th>GMV (30d)</th><th>Orders (30d)</th><th>Last order</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkRows rows={10} cols={8} /> : (
                <>
                  {stores.map(s => (
                    <tr key={s._id}>
                      <td data-label="Store"><span className="cell-main">{s.businessName}</span></td>
                      <td data-label="Host" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {s.host ? <a href={`https://${s.host}`} target="_blank" rel="noreferrer">{s.host}</a> : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                      </td>
                      <td data-label="Plan"><span className={`badge ${PLAN_BADGE[s.planId] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{s.planId}</span></td>
                      <td data-label="Status"><span className={`badge ${STATUS_BADGE[s.storeStatus] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{s.storeStatus}</span></td>
                      <td data-label="GMV (30d)" style={{ fontFamily: 'var(--font-mono)' }}>{fmtMoney(s.gmv30d)}</td>
                      <td data-label="Orders (30d)" style={{ fontFamily: 'var(--font-mono)' }}>{s.orders30d}</td>
                      <td data-label="Last order" className="cell-sub">{fmtDate(s.lastOrderAt)}</td>
                      <td><Link href={`/superadmin/tenants/${s._id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                    </tr>
                  ))}
                  {stores.length === 0 && (
                    <tr><td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🛍️</div>
                        <div className="empty-state-title">No stores found</div>
                        <div className="empty-state-sub">Tenants appear here once they have a storefront config</div>
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
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="pagination-info">Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
