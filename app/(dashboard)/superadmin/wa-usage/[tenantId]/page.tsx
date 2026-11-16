'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '../../../../../lib/api';
import { Sk, SkRows } from '../../../../../components/ui/Skeleton';

interface Counts { attempted: number; accepted: number; failed: number; delivered: number; read: number }
interface Log {
  _id: string; orderId?: string; customerName?: string; phoneMasked?: string; orderStatus?: string; template?: string;
  status: 'sent' | 'failed'; deliveryStatus?: string; failureReason?: string; wamid?: string; createdAt: string; deliveredAt?: string; readAt?: string;
}
interface Detail {
  tenant: { _id: string; businessName: string; email?: string; phone?: string; planId?: string; freeUsed: number; creditsLeft: number; codConfirm: { enabled: boolean } };
  summary: Counts & { deliveryRate: number };
  byTemplate: (Counts & { template: string })[];
  byOrderStatus: (Counts & { orderStatus: string })[];
  topFailures: { reason: string; count: number; lastAt: string }[];
  daily: { date: string; attempted: number; delivered: number; failed: number }[];
  purchases: { packId: string; credits: number; amountInr: number; paymentId: string; at: string }[];
  logs: { items: Log[]; total: number; page: number; limit: number };
}

const fmtDT = (d?: string) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const inr = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;

function stateOf(l: Log): [string, string] {
  if (l.status === 'failed' || l.deliveryStatus === 'failed') return ['Failed', 'badge-red'];
  if (l.deliveryStatus === 'read') return ['Read', 'badge-green'];
  if (l.deliveryStatus === 'delivered') return ['Delivered', 'badge-green'];
  return ['Sent', 'badge-gray'];
}

function Breakdown({ title, rows, label }: { title: string; rows: (Counts & { key: string })[]; label: (k: string) => string }) {
  return (
    <div className="admin-card" style={{ flex: 1, minWidth: 300 }}>
      <div className="card-header"><strong>{title}</strong></div>
      <table className="admin-table">
        <thead><tr><th></th><th>Used</th><th>Delivered</th><th>Failed</th></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={4} className="cell-sub">No data</td></tr> : rows.map((r) => (
            <tr key={r.key}><td>{label(r.key)}</td><td>{r.attempted}</td><td>{r.delivered}</td><td>{r.failed}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WaUsageDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [d, setD] = useState<Detail | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/admin/wa-usage/${tenantId}`, { params: { page, limit: 25, status: status || undefined } });
      setD(res.data); setError('');
    } catch { setError('Failed to load tenant usage'); }
  }, [tenantId, page, status]);

  useEffect(() => { load(); }, [load]);
  const pages = d ? Math.max(1, Math.ceil(d.logs.total / d.logs.limit)) : 1;
  const max = d ? Math.max(1, ...d.daily.map((x) => x.attempted)) : 1;

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <Link href="/superadmin/wa-usage" className="cell-sub">← WhatsApp Usage</Link>
          {d ? (
            <>
              <h1 className="page-title">{d.tenant.businessName}</h1>
              <p className="page-sub">{d.tenant.email}{d.tenant.phone ? ` · ${d.tenant.phone}` : ''} · {d.tenant.planId} plan · COD confirmation {d.tenant.codConfirm.enabled ? 'on' : 'off'}</p>
            </>
          ) : <><Sk w="240px" h={22} mb={8} /><Sk w="360px" h={12} /></>}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>
      {error && <p style={{ color: 'var(--red, #c00)', marginBottom: 12 }}>{error}</p>}

      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        {!d ? Array.from({ length: 6 }, (_, i) => <div className="stat-card" key={i}><Sk w="50%" h={10} mb={10} /><Sk w="40%" h={26} /></div>) : ([
          ['Messages used', d.summary.attempted], ['Delivered', d.summary.delivered], ['Read', d.summary.read],
          ['Failed', d.summary.failed], ['Delivery rate', d.summary.accepted ? `${d.summary.deliveryRate}%` : '—'],
          ['Free used / credits left', `${d.tenant.freeUsed} / ${d.tenant.creditsLeft}`],
        ] as [string, string | number][]).map(([label, value]) => (
          <div className="stat-card" key={label}><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>
        ))}
      </div>

      {d && d.daily.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <div className="card-header"><strong>Last 30 days</strong></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90, padding: '8px 16px 12px' }}>
            {d.daily.map((x) => (
              <div key={x.date} title={`${x.date}: ${x.attempted} sent, ${x.delivered} delivered, ${x.failed} failed`}
                style={{ flex: 1, minWidth: 4, height: `${Math.max(6, (x.attempted / max) * 100)}%`, background: x.failed ? 'var(--red, #c00)' : 'var(--green, #16a34a)', opacity: 0.8, borderRadius: 2 }} />
            ))}
          </div>
        </div>
      )}

      {d && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <Breakdown title="By template" rows={d.byTemplate.map((r) => ({ ...r, key: r.template || '—' }))} label={(k) => k} />
          <Breakdown title="By order status" rows={d.byOrderStatus.map((r) => ({ ...r, key: r.orderStatus || '—' }))} label={(k) => k} />
        </div>
      )}

      {d && (d.topFailures.length > 0 || d.purchases.length > 0) && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          {d.topFailures.length > 0 && (
            <div className="admin-card" style={{ flex: 1, minWidth: 300 }}>
              <div className="card-header"><strong>Top failure reasons</strong></div>
              <table className="admin-table"><thead><tr><th>Reason</th><th>Count</th><th>Last</th></tr></thead>
                <tbody>{d.topFailures.map((f) => <tr key={f.reason}><td>{f.reason}</td><td>{f.count}</td><td className="cell-sub">{fmtDT(f.lastAt)}</td></tr>)}</tbody></table>
            </div>
          )}
          {d.purchases.length > 0 && (
            <div className="admin-card" style={{ flex: 1, minWidth: 300 }}>
              <div className="card-header"><strong>Credit purchases</strong></div>
              <table className="admin-table"><thead><tr><th>Pack</th><th>Credits</th><th>Paid</th><th>Date</th></tr></thead>
                <tbody>{d.purchases.map((p) => <tr key={p.paymentId}><td>{p.packId}</td><td>{p.credits}</td><td>{inr(p.amountInr)}</td><td className="cell-sub">{fmtDT(p.at)}</td></tr>)}</tbody></table>
            </div>
          )}
        </div>
      )}

      <div className="table-filter-bar">
        <strong style={{ marginRight: 8 }}>Message log</strong>
        <select className="admin-input" style={{ maxWidth: 140 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All</option><option value="sent">Accepted</option><option value="failed">Failed</option>
        </select>
      </div>
      <div className="admin-card">
        <div className="table-shell">
          <table className="admin-table mobile-cards">
            <thead><tr><th>Time</th><th>Order</th><th>Customer</th><th>Phone</th><th>Template</th><th>Status</th><th>Delivered at</th><th>Detail</th></tr></thead>
            <tbody>
              {!d ? <SkRows rows={8} cols={8} /> : d.logs.items.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-title">No messages</div></div></td></tr>
              ) : d.logs.items.map((l) => {
                const [label, cls] = stateOf(l);
                return (
                  <tr key={l._id}>
                    <td data-label="Time" className="cell-sub">{fmtDT(l.createdAt)}</td>
                    <td data-label="Order"><b>{l.orderId}</b><div className="cell-sub">{l.orderStatus}</div></td>
                    <td data-label="Customer">{l.customerName}</td>
                    <td data-label="Phone">{l.phoneMasked}</td>
                    <td data-label="Template" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{l.template}</td>
                    <td data-label="Status"><span className={`badge ${cls}`}>{label}</span></td>
                    <td data-label="Delivered at" className="cell-sub">{fmtDT(l.deliveredAt)}</td>
                    <td data-label="Detail" className="cell-sub" style={{ maxWidth: 260, wordBreak: 'break-all' }}>{l.failureReason || l.wamid || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {d && pages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span className="pagination-info">Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
