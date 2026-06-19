'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

const fmtTs = (d: string) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-log', { params: { page, limit: LIMIT } });
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch { /**/ }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-sub">All admin mutations — {total} total entries</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      <div className="admin-card">
        <div className="table-shell">
        <table className="admin-table">
          <thead><tr><th>Admin</th><th>Action</th><th>Status</th><th>IP</th><th>Time</th></tr></thead>
          <tbody>
            {loading ? <SkRows rows={12} cols={5} /> : (
              <>
                {logs.map(l => (
                  <tr key={l._id}>
                    <td>
                      <div className="cell-main" style={{ fontSize: 12 }}>{l.actor?.name || '—'}</div>
                      <div className="cell-sub">{l.actorEmail}</div>
                    </td>
                    <td className="text-truncate cell-mono" style={{ fontSize: 11, maxWidth: 320 }}>
                      {l.action}
                    </td>
                    <td>
                      <span className={`badge ${l.statusCode < 300 ? 'badge-green' : l.statusCode < 500 ? 'badge-gold' : 'badge-red'}`}>
                        {l.statusCode}
                      </span>
                    </td>
                    <td className="cell-mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{l.ip}</td>
                    <td style={{ fontSize: 11, color: 'var(--ink-4)' }}>{fmtTs(l.timestamp)}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-title">No audit entries yet</div>
                    </div>
                  </td></tr>
                )}
              </>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="pagination-info">Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
