'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

type FilterType = 'all' | 'expired-trials' | 'past-due';

export default function SupportIssuesPage() {
  const [issues, setIssues] = useState<{ expiredTrials: any[]; pastDue: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/support/issues');
      setIssues(res.data);
    } catch { /**/ }
    setLoading(false);
  }

  const expiredCount = issues?.expiredTrials?.length || 0;
  const pastDueCount = issues?.pastDue?.length || 0;
  const totalCount   = expiredCount + pastDueCount;

  const showTrials  = filter === 'all' || filter === 'expired-trials';
  const showPastDue = filter === 'all' || filter === 'past-due';

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Support Issues</h1>
          <p className="page-sub">Expired trials and past-due subscriptions requiring attention</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      {/* Summary counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Issues', value: totalCount, color: 'var(--ink)' },
          { label: 'Expired Trials', value: expiredCount, color: 'var(--red)' },
          { label: 'Past Due', value: pastDueCount, color: 'var(--gold)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {([
          { key: 'all',            label: `All (${totalCount})` },
          { key: 'expired-trials', label: `Expired Trials (${expiredCount})` },
          { key: 'past-due',       label: `Past Due (${pastDueCount})` },
        ] as const).map(f => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 12 }}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Expired Trials section */}
      {showTrials && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 10 }}>
            Expired Trials ({expiredCount})
          </div>
          {loading ? (
            <div className="admin-card">
              <table className="admin-table">
                <thead><tr><th>Business</th><th>Email</th><th>Phone</th><th>Trial Ended</th><th>Orders/mo</th><th></th></tr></thead>
                <tbody><SkRows rows={5} cols={6} /></tbody>
              </table>
            </div>
          ) : expiredCount > 0 ? (
            <div className="admin-card">
              <table className="admin-table">
                <thead><tr><th>Business</th><th>Email</th><th>Phone</th><th>Trial Ended</th><th>Orders/mo</th><th></th></tr></thead>
                <tbody>
                  {issues!.expiredTrials.map(t => (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 500 }}>{t.businessName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.email}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.phone || '—'}</td>
                      <td><span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>{fmtDate(t.trialEndsAt)}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{t.ordersThisMonth ?? '—'}</td>
                      <td><Link href={`/superadmin/tenants/${t._id}`} className="btn btn-ghost btn-sm">View Tenant →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '8px 0' }}>No expired trials ✓</div>
          )}
        </div>
      )}

      {/* Past Due section */}
      {showPastDue && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 10 }}>
            Past Due Subscriptions ({pastDueCount})
          </div>
          {loading ? (
            <div className="admin-card">
              <table className="admin-table">
                <thead><tr><th>Business</th><th>Email</th><th>Phone</th><th>Plan</th><th>Billing Cycle</th><th></th></tr></thead>
                <tbody><SkRows rows={5} cols={6} /></tbody>
              </table>
            </div>
          ) : pastDueCount > 0 ? (
            <div className="admin-card">
              <table className="admin-table">
                <thead><tr><th>Business</th><th>Email</th><th>Phone</th><th>Plan</th><th>Billing Cycle</th><th></th></tr></thead>
                <tbody>
                  {issues!.pastDue.map((s: any) => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 500 }}>{s.tenantId?.businessName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.tenantId?.email}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.tenantId?.phone || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{s.planId}</td>
                      <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{s.billingCycle || '—'}</td>
                      <td>
                        {s.tenantId?._id && (
                          <Link href={`/superadmin/tenants/${s.tenantId._id}`} className="btn btn-ghost btn-sm">View Tenant →</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '8px 0' }}>No past due subscriptions ✓</div>
          )}
        </div>
      )}
    </div>
  );
}
