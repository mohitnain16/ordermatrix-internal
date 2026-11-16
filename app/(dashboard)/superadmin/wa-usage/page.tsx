'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { Sk, SkRows } from '../../../../components/ui/Skeleton';

interface Row {
  tenantId: string; businessName: string; email?: string; planId?: string;
  attempted: number; accepted: number; failed: number; delivered: number; read: number; deliveryRate: number;
  lastAt?: string; freeUsed: number; creditsLeft: number; creditsPurchased: number; amountPaid: number;
}
interface Totals { tenants: number; attempted: number; accepted: number; failed: number; delivered: number; read: number; creditsPurchased: number; amountPaid: number }

const LIMIT = 25;
const fmtDT = (d?: string) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const inr = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;

export default function WaUsagePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('attempted');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/wa-usage', { params: { page, limit: LIMIT, search: search || undefined, sort, from: from || undefined, to: to || undefined } });
      setRows(res.data.items); setTotal(res.data.total); setTotals(res.data.totals); setError('');
    } catch { setError('Failed to load WhatsApp usage'); }
    setLoading(false);
  }, [page, search, sort, from, to]);

  useEffect(() => { load(); }, [load]);
  const pages = Math.ceil(total / LIMIT);

  const stats: [string, string | number][] = totals ? [
    ['Tenants using WhatsApp', totals.tenants], ['Messages attempted', totals.attempted],
    ['Delivered', totals.delivered], ['Read', totals.read], ['Failed', totals.failed],
    ['Credits sold', `${totals.creditsPurchased} · ${inr(totals.amountPaid)}`],
  ] : [];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">WhatsApp Usage</h1>
          <p className="page-sub">Customer order notifications per tenant — usage, delivery and credits. Delivered/Read come from Meta delivery receipts.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        {!totals ? Array.from({ length: 6 }, (_, i) => (
          <div className="stat-card" key={i}><Sk w="50%" h={10} mb={10} /><Sk w="40%" h={26} /></div>
        )) : stats.map(([label, value]) => (
          <div className="stat-card" key={label}><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>
        ))}
      </div>

      <div className="table-filter-bar">
        <input className="admin-input" style={{ maxWidth: 260 }} placeholder="Search business or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <input className="admin-input" type="date" style={{ maxWidth: 150 }} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} aria-label="From date" />
        <input className="admin-input" type="date" style={{ maxWidth: 150 }} value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} aria-label="To date" />
        <select className="admin-input" style={{ maxWidth: 170 }} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="attempted">Most messages</option>
          <option value="delivered">Most delivered</option>
          <option value="failed">Most failed</option>
          <option value="creditsLeft">Most credits left</option>
          <option value="lastAt">Recently active</option>
        </select>
      </div>

      {error && <p style={{ color: 'var(--red, #c00)', marginBottom: 12 }}>{error}</p>}
      <div className="admin-card">
        <div className="table-shell">
          <table className="admin-table mobile-cards">
            <thead>
              <tr>
                <th>Business</th><th>Plan</th><th>Used</th><th>Delivered</th><th>Read</th><th>Failed</th>
                <th>Delivery %</th><th>Free used</th><th>Credits left</th><th>Credits bought</th><th>Last sent</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkRows rows={10} cols={12} /> : rows.length === 0 ? (
                <tr><td colSpan={12}>
                  <div className="empty-state">
                    <div className="empty-state-title">No WhatsApp activity</div>
                    <div className="empty-state-sub">Messages sent to customers will appear here per tenant</div>
                  </div>
                </td></tr>
              ) : rows.map((r) => (
                <tr key={r.tenantId}>
                  <td data-label="Business"><span className="cell-main">{r.businessName}</span><div className="cell-sub">{r.email}</div></td>
                  <td data-label="Plan"><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{r.planId || '—'}</span></td>
                  <td data-label="Used"><b>{r.attempted}</b></td>
                  <td data-label="Delivered">{r.delivered}</td>
                  <td data-label="Read">{r.read}</td>
                  <td data-label="Failed" style={{ color: r.failed ? 'var(--red, #c00)' : undefined }}>{r.failed}</td>
                  <td data-label="Delivery %">{r.accepted ? `${r.deliveryRate}%` : '—'}</td>
                  <td data-label="Free used">{r.freeUsed}</td>
                  <td data-label="Credits left">{r.creditsLeft}</td>
                  <td data-label="Credits bought">{r.creditsPurchased ? `${r.creditsPurchased} · ${inr(r.amountPaid)}` : '—'}</td>
                  <td data-label="Last sent" className="cell-sub">{fmtDT(r.lastAt)}</td>
                  <td><Link href={`/superadmin/wa-usage/${r.tenantId}`} className="btn btn-ghost btn-sm">Details →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span className="pagination-info">Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
