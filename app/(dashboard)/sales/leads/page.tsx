'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

const TEMPLATE_LABEL: Record<string, string> = {
  'instagram-order-tracker': 'Instagram',
  'whatsapp-order-tracker':  'WhatsApp',
};

const VOLUME_LABEL: Record<string, string> = {
  'under-50':  '<50/mo',
  '50-200':    '50–200/mo',
  '200-500':   '200–500/mo',
  '500-plus':  '500+/mo',
};

export default function LeadCapturesPage() {
  const [stats, setStats] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [skip, setSkip] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const LIMIT = 50;

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        api.get('/admin/lead-captures/stats'),
        api.get('/admin/lead-captures', { params: { limit: LIMIT, skip: 0, templateType: templateFilter || undefined, search: search.trim() || undefined } }),
      ]);
      setStats(s.data);
      setResults(r.data.results || []);
      setTotal(r.data.total || 0);
      setSkip(0);
    } catch { /**/ }
    setLoading(false);
  }

  async function loadPage(newSkip: number) {
    setLoading(true);
    try {
      const res = await api.get('/admin/lead-captures', { params: { limit: LIMIT, skip: newSkip, templateType: templateFilter || undefined, search: search.trim() || undefined } });
      setResults(res.data.results || []);
      setTotal(res.data.total || 0);
      setSkip(newSkip);
    } catch { /**/ }
    setLoading(false);
  }

  async function applyFilters() {
    setLoading(true);
    try {
      const res = await api.get('/admin/lead-captures', { params: { limit: LIMIT, skip: 0, templateType: templateFilter || undefined, search: search.trim() || undefined } });
      setResults(res.data.results || []);
      setTotal(res.data.total || 0);
      setSkip(0);
    } catch { /**/ }
    setLoading(false);
  }

  async function toggleConverted(id: string, current: boolean) {
    setTogglingId(id);
    try {
      await api.patch(`/admin/lead-captures/${id}`, { converted: !current });
      setResults(prev => prev.map(r => r._id === id ? { ...r, converted: !current } : r));
    } catch { /**/ }
    setTogglingId(null);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(skip / LIMIT) + 1;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Lead Captures</h1>
        <p className="page-sub">Template downloads from the landing page</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Leads', value: stats.total, color: 'var(--ink)' },
            { label: 'Last 7 Days', value: stats.last7Days, color: 'var(--accent)' },
            { label: 'Last 30 Days', value: stats.last30Days, color: 'var(--blue)' },
            { label: 'Instagram', value: stats.byTemplate?.['instagram-order-tracker'] || 0, color: 'var(--purple)' },
            { label: 'WhatsApp', value: stats.byTemplate?.['whatsapp-order-tracker'] || 0, color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Volume breakdown */}
      {stats?.byVolume && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-4)' }}>Monthly Volume:</span>
            {Object.entries(stats.byVolume).map(([k, v]: any) => (
              <span key={k} style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {VOLUME_LABEL[k] || k}: <strong style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{v}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="table-filter-bar">
        <input
          className="admin-input"
          style={{ maxWidth: 280 }}
          placeholder="Search email or business name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyFilters()}
        />
        <select
          className="admin-input"
          style={{ width: 160 }}
          value={templateFilter}
          onChange={e => { setTemplateFilter(e.target.value); }}
        >
          <option value="">All templates</option>
          <option value="instagram-order-tracker">Instagram</option>
          <option value="whatsapp-order-tracker">WhatsApp</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={applyFilters}>Filter</button>
        <button className="btn btn-ghost btn-sm" onClick={loadAll}>Reset</button>
      </div>

      <div className="admin-card">
        <div className="table-shell">
          <table className="admin-table">
            <thead>
              <tr><th>Email</th><th>Business</th><th>Template</th><th>Volume</th><th>Date</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? <SkRows rows={8} cols={7} /> : (
                <>
                  {results.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.email}</td>
                      <td style={{ fontWeight: 500 }}>{r.businessName || <span style={{ color: 'var(--ink-4)' }}>—</span>}</td>
                      <td>
                        <span className={`badge ${r.templateType === 'instagram-order-tracker' ? 'badge-purple' : 'badge-green'}`}>
                          {TEMPLATE_LABEL[r.templateType] || r.templateType}
                        </span>
                      </td>
                      <td className="cell-sub">{VOLUME_LABEL[r.monthlyOrderVolume] || r.monthlyOrderVolume || '—'}</td>
                      <td className="cell-sub">{fmtDate(r.createdAt)}</td>
                      <td>
                        <span className={`badge ${r.converted ? 'badge-green' : 'badge-gray'}`}>
                          {r.converted ? 'Converted' : 'Lead'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={togglingId === r._id}
                          style={{ color: r.converted ? 'var(--ink-3)' : 'var(--green)' }}
                          onClick={() => toggleConverted(r._id, r.converted)}
                        >
                          {togglingId === r._id ? '…' : r.converted ? 'Unmark' : 'Mark Converted'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                    <tr><td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-title">No lead captures found</div>
                      </div>
                    </td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--ink-4)' }}>
            <span>{skip + 1}–{Math.min(skip + LIMIT, total)} of {total}</span>
            <div className="pagination-controls">
              <button className="btn btn-ghost btn-sm" disabled={skip === 0} onClick={() => loadPage(skip - LIMIT)}>← Prev</button>
              <span style={{ padding: '4px 8px' }}>{currentPage} / {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={skip + LIMIT >= total} onClick={() => loadPage(skip + LIMIT)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
