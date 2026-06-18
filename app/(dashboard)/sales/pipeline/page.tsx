'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

type SortKey = 'orderCount' | 'daysLeft' | 'activityScore';

const STATUS_OPTIONS = ['all', 'watching', 'contacted', 'converted', 'churned'] as const;
type StatusFilter = typeof STATUS_OPTIONS[number];

export default function SalesPipelinePage() {
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('orderCount');
  const [sortAsc, setSortAsc] = useState(false);
  const [noteModal, setNoteModal] = useState<{ tenantId: string; name: string; current: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/sales/pipeline');
      setPipeline(res.data.pipeline || []);
    } catch { /**/ }
    setLoading(false);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  function sortArrow(key: SortKey) {
    if (sortKey !== key) return <span style={{ color: 'var(--ink-4)', marginLeft: 2 }}>↕</span>;
    return <span style={{ color: 'var(--accent)', marginLeft: 2 }}>{sortAsc ? '↑' : '↓'}</span>;
  }

  async function saveNote() {
    if (!noteModal || !noteText.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/admin/sales/leads/${noteModal.tenantId}/note`, { followUpNote: noteText, status: 'contacted' });
      setPipeline(prev => prev.map(t =>
        t._id === noteModal.tenantId
          ? { ...t, lead: { ...(t.lead || {}), followUpNote: noteText, status: 'contacted' } }
          : t
      ));
      setNoteModal(null);
      setNoteText('');
    } catch { /**/ }
    setSaving(false);
  }

  const displayed = pipeline
    .filter(t => statusFilter === 'all' || (t.lead?.status || 'watching') === statusFilter)
    .sort((a, b) => {
      const va = sortKey === 'activityScore' ? (a.lead?.activityScore || 0) : (a[sortKey] || 0);
      const vb = sortKey === 'activityScore' ? (b.lead?.activityScore || 0) : (b[sortKey] || 0);
      return sortAsc ? va - vb : vb - va;
    });

  return (
    <div className="animate-fade-in">
      {noteModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ padding: 28, width: 400 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Follow-up Note</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-3)' }}>{noteModal.name}</p>
            {noteModal.current && (
              <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--surface-3)', borderRadius: 7, fontSize: 12, color: 'var(--ink-3)' }}>
                Current: {noteModal.current}
              </div>
            )}
            <textarea
              rows={4}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Note…"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setNoteModal(null); setNoteText(''); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveNote} disabled={saving || !noteText.trim()}>
                {saving ? <><span className="spinner" />Saving…</> : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Sales Pipeline</h1>
          <p className="page-sub">Trial tenants ranked by activity — {pipeline.length} total</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-4)', marginRight: 4 }}>Status:</span>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 12, textTransform: 'capitalize' }}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all'
              ? `All (${pipeline.length})`
              : `${s} (${pipeline.filter(t => (t.lead?.status || 'watching') === s).length})`}
          </button>
        ))}
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Business</th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('orderCount')}>
                Orders {sortArrow('orderCount')}
              </th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('daysLeft')}>
                Days Left {sortArrow('daysLeft')}
              </th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('activityScore')}>
                Score {sortArrow('activityScore')}
              </th>
              <th>Status</th>
              <th>Follow-up Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkRows rows={8} cols={7} /> : (
              <>
                {displayed.map(t => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.businessName}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{t.email}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>Joined {fmtDate(t.createdAt)}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: t.orderCount > 10 ? 'var(--green)' : 'var(--ink)' }}>
                      {t.orderCount}
                    </td>
                    <td>
                      <span className={`badge ${t.daysLeft <= 3 ? 'badge-red' : t.daysLeft <= 7 ? 'badge-gold' : 'badge-green'}`}>
                        {t.daysLeft}d
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: (t.lead?.activityScore || 0) >= 70 ? 'var(--green)' : (t.lead?.activityScore || 0) >= 40 ? 'var(--gold)' : 'var(--ink-4)' }}>
                      {t.lead?.activityScore ?? '—'}
                    </td>
                    <td>
                      <span className={`badge ${t.lead?.status === 'contacted' ? 'badge-blue' : t.lead?.status === 'converted' ? 'badge-green' : t.lead?.status === 'churned' ? 'badge-red' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                        {t.lead?.status || 'watching'}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      {t.lead?.followUpNote
                        ? <span style={{ fontSize: 12, color: 'var(--ink-3)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.lead.followUpNote}</span>
                        : <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setNoteModal({ tenantId: t._id, name: t.businessName, current: t.lead?.followUpNote || '' }); setNoteText(''); }}>
                          + Note
                        </button>
                        <Link href={`/superadmin/tenants/${t._id}`} className="btn btn-ghost btn-sm">View →</Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>
                    {pipeline.length === 0 ? 'No trial tenants in pipeline' : `No tenants with status "${statusFilter}"`}
                  </td></tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
