'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { SkRows } from '../../../components/ui/Skeleton';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
}

const PLAN_BADGE: Record<string, string> = {
  trial: 'badge-gray', starter: 'badge-gray', growth: 'badge-green', scale: 'badge-purple', pro: 'badge-gold',
};

export default function SupportPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [issues, setIssues] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [tab, setTab] = useState<'lookup' | 'issues'>('lookup');
  const [notesTenantId, setNotesTenantId] = useState<string | null>(null);
  const [notesTenantName, setNotesTenantName] = useState('');
  const [tenantNotes, setTenantNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  useEffect(() => { loadIssues(); }, []);

  async function loadIssues() {
    setIssuesLoading(true);
    try {
      const res = await api.get('/admin/support/issues');
      setIssues(res.data);
    } catch { /**/ }
    setIssuesLoading(false);
  }

  async function loadNotes(tenantId: string, tenantName: string) {
    if (notesTenantId === tenantId) { setNotesTenantId(null); return; }
    setNotesTenantId(tenantId);
    setNotesTenantName(tenantName);
    setNotesLoading(true);
    setTenantNotes([]);
    try {
      const res = await api.get(`/admin/support/notes/${tenantId}`);
      setTenantNotes(res.data.notes || []);
    } catch { /**/ }
    setNotesLoading(false);
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
              {searching ? <><span className="spinner" />Searching…</> : 'Search'}
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
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: notesTenantId === t._id ? 'var(--accent)' : undefined }}
                            onClick={() => loadNotes(t._id, t.businessName)}
                          >
                            {notesTenantId === t._id ? 'Hide Notes' : 'Notes'}
                          </button>
                          <Link href={`/superadmin/tenants/${t._id}`} className="btn btn-ghost btn-sm">View →</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Notes panel */}
          {notesTenantId && (
            <div className="admin-card" style={{ marginTop: 16 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Notes — {notesTenantName}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setNotesTenantId(null)}>✕</button>
              </div>
              {notesLoading ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
              ) : tenantNotes.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>No notes for this tenant</div>
              ) : (
                <div style={{ padding: '8px 0' }}>
                  {tenantNotes.map((n: any) => (
                    <div key={n._id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)' }}>{n.addedByEmail}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{timeAgo(n.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{n.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {results.length === 0 && query && !searching && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No results for "{query}"</div>
              <div className="empty-state-sub">Try a different name, email, or phone number</div>
            </div>
          )}
        </>
      )}

      {tab === 'issues' && issuesLoading && (
        <div className="admin-card">
          <table className="admin-table">
            <thead><tr><th>Business</th><th>Email</th><th>Trial Ended</th><th>Orders</th><th></th></tr></thead>
            <tbody><SkRows rows={5} cols={5} /></tbody>
          </table>
        </div>
      )}
      {tab === 'issues' && !issuesLoading && issues && (
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
