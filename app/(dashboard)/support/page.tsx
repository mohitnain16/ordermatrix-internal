'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

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
  const [searching, setSearching] = useState(false);
  const [notesTenantId, setNotesTenantId] = useState<string | null>(null);
  const [notesTenantName, setNotesTenantName] = useState('');
  const [tenantNotes, setTenantNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

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

      <div className="tab-bar">
        <span className="tab-btn active">Tenant Lookup</span>
        <Link href="/support/issues" className="tab-btn">Issues</Link>
      </div>

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
                      <td className="cell-main">{t.businessName}</td>
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
              <div className="card-header flex-between">
                <span className="card-title">Notes — {notesTenantName}</span>
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
    </div>
  );
}
