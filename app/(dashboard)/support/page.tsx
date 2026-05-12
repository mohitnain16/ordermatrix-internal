'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

const PLAN_BADGE: Record<string, string> = {
  trial: 'badge-gray', starter: 'badge-gray', growth: 'badge-green', scale: 'badge-purple', pro: 'badge-gold',
};

export default function SupportPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [issues, setIssues] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'lookup' | 'issues'>('lookup');

  useEffect(() => { loadIssues(); }, []);

  async function loadIssues() {
    try {
      const res = await api.get('/admin/support/issues');
      setIssues(res.data);
    } catch { /**/ }
  }

  async function search() {
    if (!query.trim() || query.length < 2) return;
    setSearching(true);
    try {
      const res = await api.get('/admin/support/lookup', { params: { q: query } });
      setResults(res.data.tenants);
    } catch { /**/ }
    setSearching(false);
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Support</h1>
        <p className="page-sub">Tenant lookup, active issues, and notes</p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
        {(['lookup', 'issues'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--accent)' : 'var(--ink-3)', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 }}>
            {t === 'lookup' ? 'Tenant Lookup' : `Issues ${issues ? `(${(issues.expiredTrials?.length || 0) + (issues.pastDue?.length || 0)})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'lookup' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              className="admin-input"
              style={{ maxWidth: 360 }}
              placeholder="Search tenant by name, email, phone…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
            <button className="btn btn-primary" onClick={search} disabled={searching}>
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="admin-card">
              <table className="admin-table">
                <thead><tr><th>Business</th><th>Email</th><th>Phone</th><th>Plan</th><th>Orders/mo</th><th></th></tr></thead>
                <tbody>
                  {results.map(t => (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{t.businessName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.email}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.phone}</td>
                      <td><span className={`badge ${PLAN_BADGE[t.planId] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{t.planId}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{t.ordersThisMonth}</td>
                      <td><Link href={`/superadmin/tenants/${t._id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {results.length === 0 && query && !searching && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No results for "{query}"</div>
          )}
        </>
      )}

      {tab === 'issues' && issues && (
        <div>
          {/* Expired Trials */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 12 }}>
              Expired Trials ({issues.expiredTrials?.length || 0})
            </div>
            {issues.expiredTrials?.length > 0 ? (
              <div className="admin-card">
                <table className="admin-table">
                  <thead><tr><th>Business</th><th>Email</th><th>Trial Ended</th><th>Orders</th><th></th></tr></thead>
                  <tbody>
                    {issues.expiredTrials.map((t: any) => (
                      <tr key={t._id}>
                        <td style={{ fontWeight: 500 }}>{t.businessName}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.email}</td>
                        <td style={{ fontSize: 12, color: 'var(--red)' }}>{fmtDate(t.trialEndsAt)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{t.ordersThisMonth}</td>
                        <td><Link href={`/superadmin/tenants/${t._id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>No expired trials ✓</div>}
          </div>

          {/* Past Due */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>
              Past Due Subscriptions ({issues.pastDue?.length || 0})
            </div>
            {issues.pastDue?.length > 0 ? (
              <div className="admin-card">
                <table className="admin-table">
                  <thead><tr><th>Business</th><th>Email</th><th>Plan</th><th></th></tr></thead>
                  <tbody>
                    {issues.pastDue.map((s: any) => (
                      <tr key={s._id}>
                        <td style={{ fontWeight: 500 }}>{s.tenantId?.businessName}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.tenantId?.email}</td>
                        <td style={{ textTransform: 'capitalize' }}>{s.planId}</td>
                        <td>
                          {s.tenantId?._id && <Link href={`/superadmin/tenants/${s.tenantId._id}`} className="btn btn-ghost btn-sm">View →</Link>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>No past due subscriptions ✓</div>}
          </div>
        </div>
      )}
    </div>
  );
}
