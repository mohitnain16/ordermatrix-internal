'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

const fmtTs = (d: string) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

interface OrderRow { orderId: string; tenantName: string; status: string; createdAt: string }

// Platform-wide order list — IDs only, no order details by design.
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'all' | 'deleted'>('all');
  const [deleted, setDeleted] = useState<{ orderId: string; tenantName: string; deletedBy: string; trashedAt: string }[]>([]);
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders', { params: { page, limit: LIMIT, q: q || undefined } });
      setOrders(res.data.orders);
      setTotal(res.data.total);
    } catch { /**/ }
    setLoading(false);
  }, [page, q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (tab !== 'deleted') return;
    api.get('/admin/orders/deleted').then(r => setDeleted(r.data.orders)).catch(() => {});
  }, [tab]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">{total.toLocaleString('en-IN')} orders generated across all tenants</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="field-input"
            placeholder="Search order ID…"
            value={q}
            onChange={e => { setPage(1); setQ(e.target.value); }}
            style={{ width: 220 }}
          />
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={`btn btn-sm ${tab === 'all' ? '' : 'btn-ghost'}`} onClick={() => setTab('all')}>All orders</button>
        <button className={`btn btn-sm ${tab === 'deleted' ? '' : 'btn-ghost'}`} onClick={() => setTab('deleted')}>Deleted</button>
      </div>

      {tab === 'deleted' ? (
        <div className="admin-card">
          <div className="table-shell">
            <table className="admin-table">
              <thead><tr><th>Order ID</th><th>Tenant</th><th>Deleted by</th><th>Deleted at</th></tr></thead>
              <tbody>
                {deleted.map(o => (
                  <tr key={o.orderId}>
                    <td className="cell-mono" style={{ fontSize: 12 }}>{o.orderId}</td>
                    <td>{o.tenantName}</td>
                    <td>{o.deletedBy}</td>
                    <td style={{ fontSize: 11, color: 'var(--ink-4)' }}>{fmtTs(o.trashedAt)}</td>
                  </tr>
                ))}
                {deleted.length === 0 && (
                  <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-title">No deleted orders</div></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
      <div className="admin-card">
        <div className="table-shell">
          <table className="admin-table">
            <thead><tr><th>Order ID</th><th>Tenant</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {loading ? <SkRows rows={12} cols={4} /> : (
                <>
                  {orders.map(o => (
                    <tr key={o.orderId}>
                      <td className="cell-mono" style={{ fontSize: 12 }}>{o.orderId}</td>
                      <td>{o.tenantName}</td>
                      <td style={{ textTransform: 'capitalize' }}>{String(o.status).replace(/_/g, ' ')}</td>
                      <td style={{ fontSize: 11, color: 'var(--ink-4)' }}>{fmtTs(o.createdAt)}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={4}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <div className="empty-state-title">No orders found</div>
                      </div>
                    </td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {tab === 'all' && pages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="pagination-info">Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
