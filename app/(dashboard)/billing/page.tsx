'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

export default function BillingOpsPage() {
  const [tab, setTab] = useState<'failed' | 'seats' | 'dunning'>('failed');
  const [failed, setFailed] = useState<any[]>([]);
  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dunningModal, setDunningModal] = useState<any>(null);
  const [actionMsg, setActionMsg] = useState('');

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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: 420, boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Send Dunning</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ink-3)' }}>{dunningModal.name}</p>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 10 }}>Day sequence</div>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setDunningModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {actionMsg && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--green)', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 300 }}>
          {actionMsg}
        </div>
      )}

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
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        {([
          { key: 'failed', label: `Failed Payments (${failed.length})` },
          { key: 'dunning', label: 'Dunning' },
          { key: 'seats', label: `Seat Usage (${seats.length})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? 'var(--accent)' : 'var(--ink-3)', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
      ) : (
        <>
          {(tab === 'failed' || tab === 'dunning') && (
            <div className="admin-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Retries</th>
                    <th>Failed</th>
                    {tab === 'dunning' && <th>Dunning Sent</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {failed.map((f: any) => (
                    <tr key={f.subscriptionId}>
                      <td style={{ fontWeight: 500 }}>
                        {f.tenant?.businessName}
                        <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{f.tenant?.email}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{f.planId}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--red)' }}>{fmt(f.amount)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{f.retryCount}</td>
                      <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{fmtDate(f.failedAt)}</td>
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
                            <button className="btn btn-ghost btn-sm" onClick={() => setDunningModal({ tenantId: f.tenant?._id, name: f.tenant?.businessName })}>
                              Dunning
                            </button>
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
                    <tr><td colSpan={tab === 'dunning' ? 7 : 6} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No failed payments ✓</td></tr>
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
                  {seats.map((t: any) => (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 500 }}>{t.businessName}<div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{t.email}</div></td>
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
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No tenants near seat limit ✓</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
