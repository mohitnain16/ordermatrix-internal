'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

export default function SalesPage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pipeline' | 'revenue'>('pipeline');
  const [noteModal, setNoteModal] = useState<{ tenantId: string; name: string } | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [rev, pipe] = await Promise.all([
        api.get('/admin/sales/revenue'),
        api.get('/admin/sales/pipeline'),
      ]);
      setRevenue(rev.data);
      setPipeline(pipe.data.pipeline);
    } catch { /**/ }
    setLoading(false);
  }

  async function saveNote(tenantId: string) {
    if (!noteText.trim()) return;
    try {
      await api.patch(`/admin/sales/leads/${tenantId}/note`, { followUpNote: noteText, status: 'contacted' });
      setNoteModal(null);
      setNoteText('');
    } catch { /**/ }
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-4)' }}>Loading sales data…</div>;

  return (
    <div className="animate-fade-in">
      {noteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: 400, boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Add Follow-up Note</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-3)' }}>{noteModal.name}</p>
            <textarea rows={4} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Note…" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setNoteModal(null); setNoteText(''); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => saveNote(noteModal.tenantId)}>Save Note</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="page-sub">Pipeline, revenue metrics, and lead follow-up</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      {/* Revenue KPIs */}
      {revenue && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'MRR', value: fmt(revenue.mrr), color: 'var(--green)' },
            { label: 'ARR', value: fmt(revenue.arr), color: 'var(--blue)' },
            { label: 'Paid Tenants', value: revenue.totalPaid, color: 'var(--purple)' },
            { label: 'New This Month', value: revenue.newThisMonth, color: 'var(--accent)' },
            { label: 'Churn This Month', value: revenue.cancelledThisMonth, color: 'var(--red)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        {(['pipeline', 'revenue'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--accent)' : 'var(--ink-3)', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', marginBottom: -1 }}>
            {t === 'pipeline' ? 'Trial Pipeline' : 'Plan Breakdown'}
          </button>
        ))}
      </div>

      {tab === 'pipeline' && (
        <div className="admin-card">
          <table className="admin-table">
            <thead><tr><th>Business</th><th>Email</th><th>Orders</th><th>Days Left</th><th>Lead Status</th><th>Action</th></tr></thead>
            <tbody>
              {pipeline.map(t => (
                <tr key={t._id}>
                  <td>
                    <Link href={`/superadmin/tenants/${t._id}`} style={{ fontWeight: 500, color: 'var(--accent)', textDecoration: 'none' }}>{t.businessName}</Link>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{fmtDate(t.createdAt)}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t.email}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: t.orderCount > 10 ? 'var(--green)' : 'var(--ink)' }}>{t.orderCount}</td>
                  <td>
                    <span className={`badge ${t.daysLeft <= 3 ? 'badge-red' : t.daysLeft <= 7 ? 'badge-gold' : 'badge-green'}`}>
                      {t.daysLeft}d
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.lead?.status === 'contacted' ? 'badge-blue' : t.lead?.status === 'converted' ? 'badge-green' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                      {t.lead?.status || 'watching'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setNoteModal({ tenantId: t._id, name: t.businessName })}>+ Note</button>
                  </td>
                </tr>
              ))}
              {pipeline.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No trial tenants</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'revenue' && revenue && (
        <div className="admin-card">
          <table className="admin-table">
            <thead><tr><th>Plan</th><th>Tenants</th><th>Total Revenue</th></tr></thead>
            <tbody>
              {(revenue.planBreakdown || []).map((p: any) => (
                <tr key={p._id}>
                  <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{p._id}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{p.count}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--green)' }}>{fmt(p.revenue || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
