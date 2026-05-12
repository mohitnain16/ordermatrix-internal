'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { page, limit: LIMIT, search: search || undefined } });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch { /**/ }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);

  async function toggleUser(userId: string, isActive: boolean) {
    try {
      await api.patch(`/admin/users/${userId}`, { isActive: !isActive });
      load();
    } catch { /**/ }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">All Users</h1>
          <p className="page-sub">{total} users across all tenants</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input className="admin-input" style={{ maxWidth: 280 }} placeholder="Search by name or email…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Tenant</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {loading ? <SkRows rows={10} cols={7} /> : (
              <>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{u.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.email}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{u.tenantId?.businessName || '—'}</td>
                    <td><span className={`badge ${u.role === 'superadmin' ? 'badge-purple' : u.role === 'admin' ? 'badge-blue' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                    <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{fmtDate(u.createdAt)}</td>
                    <td>
                      <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-ghost'}`} onClick={() => toggleUser(u._id, u.isActive)}>
                        {u.isActive ? 'Ban' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👤</div>
                      <div className="empty-state-title">No users found</div>
                    </div>
                  </td></tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--ink-3)', display: 'flex', alignItems: 'center' }}>Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
