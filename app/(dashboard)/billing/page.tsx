'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { SkRows } from '../../../components/ui/Skeleton';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

export default function BillingOpsPage() {
  const [tab, setTab] = useState<'failed' | 'seats' | 'dunning' | 'invoices'>('failed');
  const [failed, setFailed] = useState<any[]>([]);
  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dunningModal, setDunningModal] = useState<any>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [invQuery, setInvQuery] = useState('');
  const [invResults, setInvResults] = useState<any[]>([]);
  const [invSearching, setInvSearching] = useState(false);
  const [invTenant, setInvTenant] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invPage, setInvPage] = useState(1);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [f, s] = await Promise.all([
        api.get('/admin/billing-ops/failed-payments'),
        api.get('/admin/billing-ops/seat-usage'),
      ]);
      setFailed(f.data.failures);
      setSeats(s.data.tenants);
    } catch { /**/ }
    setLoading(false);
  }

  async function retry(tenantId: string) {
    try {
      await api.post(`/admin/billing-ops/failed-payments/${tenantId}/retry`);
      setActionMsg('Retry logged');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { /**/ }
  }

  async function resolve(tenantId: string) {
    try {
      await api.post(`/admin/billing-ops/failed-payments/${tenantId}/resolve`);
      setFailed(prev => prev.filter(f => f.tenant?._id !== tenantId));
      setActionMsg('Marked resolved');
      setTimeout(() => setActionMsg(''), 3000);
    } catch { /**/ }
  }

  async function searchTenants() {
    if (!invQuery.trim() || invQuery.length < 2) return;
    setInvSearching(true);
    setInvResults([]);
    try {
      const res = await api.get('/admin/support/lookup', { params: { q: invQuery } });
      setInvResults(res.data.tenants || []);
    } catch { /**/ }
    setInvSearching(false);
  }

  async function loadInvoices(tenant: any) {
    setInvTenant(tenant);
    setInvResults([]);
    setInvQuery('');
    setInvLoading(true);
    setInvoices([]);
    setInvPage(1);
    try {
      const res = await api.get(`/admin/billing-ops/invoices/${tenant._id}`);
      setInvoices(res.data.invoices || []);
    } catch { /**/ }
    setInvLoading(false);
  }

  async function sendDunning(tenantId: string, day: number, channel: string) {
    try {
      await api.post(`/admin/billing-ops/dunning/${tenantId}`, { day, channel });
      setDunningModal(null);
      setActionMsg(`Dunning day-${day} via ${channel} logged`);
      setTimeout(() => setActionMsg(''), 4000);
    } catch { /**/ }
  }

  return (
    <div className="animate-fade-in">
      {dunningModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Send Dunning</h3>
              <p className="modal-sub">{dunningModal.name}</p>
            </div>
            <div className="modal-body">
              <div className="form-label">Day sequence</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[1, 3, 7].map(day => (
                  <div key={day} style={{ flex: 1, minWidth: 100 }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 6 }}>Day {day}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => sendDunning(dunningModal.tenantId, day, 'email')} style={{ justifyContent: 'center' }}>Email</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => sendDunning(dunningModal.tenantId, day, 'whatsapp')} style={{ justifyContent: 'center' }}>WhatsApp</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setDunningModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {actionMsg && <div className="toast toast-success">{actionMsg}</div>}

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Billing Ops</h1>
          <p className="page-sub">Failed payments, dunning, seat utilization</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadAll}>Refresh</button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Failed Payments', value: failed.length, color: 'var(--red)' },
          { label: 'Amount at Risk', value: fmt(failed.reduce((s, f) => s + (f.amount || 0), 0)), color: 'var(--gold)' },
          { label: 'At Seat Limit (80%+)', value: seats.length, color: 'var(--purple)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value mono" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {([
          { key: 'failed',   label: `Failed Payments (${failed.length})` },
          { key: 'dunning',  label: 'Dunning' },
          { key: 'seats',    label: `Seat Usage (${seats.length})` },
          { key: 'invoices', label: 'Invoices' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`tab-btn${tab === t.key ? ' active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'failed' || tab === 'dunning') && (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Business</th><th>Plan</th><th>Amount</th><th>Retries</th><th>Failed</th>
                {tab === 'dunning' && <th>Dunning Sent</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkRows rows={6} cols={tab === 'dunning' ? 7 : 6} /> : (
                <>
                  {failed.map((f: any) => (
                    <tr key={f.subscriptionId}>
                      <td>
                        <div className="cell-main">{f.tenant?.businessName}</div>
                        <div className="cell-sub">{f.tenant?.email}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{f.planId}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--red)' }}>{fmt(f.amount)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{f.retryCount}</td>
                      <td className="cell-sub">{fmtDate(f.failedAt)}</td>
                      {tab === 'dunning' && (
                        <td>
                          {f.dunningSent?.length > 0 ? (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {f.dunningSent.map((d: any, i: number) => (
                                <span key={i} className="badge badge-blue" style={{ fontSize: 10 }}>D{d.day} {d.channel}</span>
                              ))}
                            </div>
                          ) : <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>None sent</span>}
                        </td>
                      )}
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {tab === 'dunning' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setDunningModal({ tenantId: f.tenant?._id, name: f.tenant?.businessName })}>Dunning</button>
                          )}
                          {tab === 'failed' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => retry(f.tenant?._id)}>Retry</button>
                          )}
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--green)' }} onClick={() => resolve(f.tenant?._id)}>Resolve</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {failed.length === 0 && (
                    <tr><td colSpan={tab === 'dunning' ? 7 : 6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">✓</div>
                        <div className="empty-state-title">No failed payments</div>
                      </div>
                    </td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'seats' && (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr><th>Business</th><th>Plan</th><th>Seats Used</th><th>Limit</th><th>Usage</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? <SkRows rows={6} cols={6} /> : (
                <>
                  {seats.map((t: any) => (
                    <tr key={t._id}>
                      <td><div className="cell-main">{t.businessName}</div><div className="cell-sub">{t.email}</div></td>
                      <td style={{ textTransform: 'capitalize' }}>{t.planId}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{t.seatsUsed}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{t.seatsLimit}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 80, height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(t.usagePct, 100)}%`, height: '100%', background: t.usagePct >= 100 ? 'var(--red)' : t.usagePct >= 90 ? 'var(--gold)' : 'var(--green)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: t.usagePct >= 100 ? 'var(--red)' : t.usagePct >= 90 ? 'var(--gold)' : 'var(--ink)' }}>{t.usagePct}%</span>
                        </div>
                      </td>
                      <td><Link href={`/superadmin/tenants/${t._id}`} className="btn btn-ghost btn-sm">Upsell →</Link></td>
                    </tr>
                  ))}
                  {seats.length === 0 && (
                    <tr><td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">✓</div>
                        <div className="empty-state-title">No tenants near seat limit</div>
                      </div>
                    </td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'invoices' && (() => {
        const PAGE_SIZE = 20;
        const totalInvPages = Math.ceil(invoices.length / PAGE_SIZE);
        const invSlice = invoices.slice((invPage - 1) * PAGE_SIZE, invPage * PAGE_SIZE);
        return (
          <div>
            {/* Tenant search */}
            {!invTenant ? (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <input
                    className="admin-input"
                    style={{ maxWidth: 360 }}
                    placeholder="Search tenant by name or email…"
                    value={invQuery}
                    onChange={e => setInvQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchTenants()}
                  />
                  <button className="btn btn-primary btn-sm" onClick={searchTenants} disabled={invSearching}>
                    {invSearching ? <><span className="spinner" />…</> : 'Search'}
                  </button>
                </div>
                {invResults.length > 0 && (
                  <div className="admin-card">
                    <table className="admin-table">
                      <thead><tr><th>Business</th><th>Email</th><th>Plan</th><th></th></tr></thead>
                      <tbody>
                        {invResults.map((t: any) => (
                          <tr key={t._id}>
                            <td className="cell-main">{t.businessName}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.email}</td>
                            <td style={{ textTransform: 'capitalize' }}>{t.planId}</td>
                            <td><button className="btn btn-ghost btn-sm" onClick={() => loadInvoices(t)}>View Invoices →</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {invResults.length === 0 && !invSearching && invQuery && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No tenants found for "{invQuery}"</div>
                )}
                {!invQuery && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>Search for a tenant to view their invoice history</div>
                )}
              </>
            ) : (
              <>
                {/* Tenant selected header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{invTenant.businessName}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>{invTenant.email}</span>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setInvTenant(null); setInvoices([]); }}>← Change tenant</button>
                </div>
                {invLoading ? (
                  <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
                ) : (
                  <div className="admin-card">
                    <table className="admin-table">
                      <thead>
                        <tr><th>#</th><th>Date</th><th>Plan</th><th>Cycle</th><th>Amount</th><th>Status</th><th>Payment ID</th></tr>
                      </thead>
                      <tbody>
                        {invSlice.map((inv: any) => (
                          <tr key={inv.invoiceNo}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{inv.invoiceNo}</td>
                            <td style={{ fontSize: 12 }}>{fmtDate(inv.paidAt)}</td>
                            <td style={{ textTransform: 'capitalize' }}>{inv.planName || inv.planId}</td>
                            <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{inv.billingCycle}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--green)' }}>{fmt(inv.amount)}</td>
                            <td>
                              <span className={`badge ${inv.status === 'active' ? 'badge-green' : inv.status === 'cancelled' ? 'badge-red' : inv.status === 'past_due' ? 'badge-gold' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                                {inv.status}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)' }}>{inv.razorpayPaymentId ? inv.razorpayPaymentId.slice(0, 16) + '…' : '—'}</td>
                          </tr>
                        ))}
                        {invoices.length === 0 && (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No invoice records found</td></tr>
                        )}
                      </tbody>
                    </table>
                    {totalInvPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--line)', fontSize: 13, color: 'var(--ink-4)' }}>
                        <span>{(invPage - 1) * PAGE_SIZE + 1}–{Math.min(invPage * PAGE_SIZE, invoices.length)} of {invoices.length}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" disabled={invPage === 1} onClick={() => setInvPage(p => p - 1)}>← Prev</button>
                          <button className="btn btn-ghost btn-sm" disabled={invPage >= totalInvPages} onClick={() => setInvPage(p => p + 1)}>Next →</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}
