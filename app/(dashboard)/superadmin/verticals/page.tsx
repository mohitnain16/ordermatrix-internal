'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

type Vertical = {
  _id: string;
  key: string;
  label: string;
  icon?: string;
  isActive: boolean;
  tenantCount: number;
  fieldSchema: unknown[];
  defaultFeatureFlags: string[];
};

export default function VerticalsPage() {
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [toastErr, setToastErr] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/verticals');
      setVerticals(res.data.verticals || []);
    } catch { /**/ }
    setLoading(false);
  }

  function toast(msg: string, err = false) {
    if (err) { setToastErr(msg); setTimeout(() => setToastErr(''), 4000); }
    else     { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); }
  }

  async function toggleActive(key: string, isActive: boolean) {
    const v = verticals.find(v => v.key === key);
    if (!v) return;
    const willDeactivate = isActive;
    if (willDeactivate && v.tenantCount > 0) {
      const ok = window.confirm(
        `This vertical is used by ${v.tenantCount} tenant(s).\n\nDeactivating hides it from the signup picker but does NOT affect existing tenants.\n\nContinue?`
      );
      if (!ok) return;
    }
    try {
      await api.put(`/admin/verticals/${key}`, { isActive: !isActive });
      setVerticals(vs => vs.map(v => v.key === key ? { ...v, isActive: !isActive } : v));
      toast(isActive ? 'Vertical deactivated' : 'Vertical activated');
    } catch (e: any) {
      toast(e?.response?.data?.error || 'Failed to update vertical', true);
    }
  }

  return (
    <div className="animate-fade-in">
      {toastMsg && <div className="toast toast-default">{toastMsg}</div>}
      {toastErr && <div className="toast toast-error">{toastErr}</div>}

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Verticals</h1>
          <p className="page-sub">Industry verticals — fieldSchema, status flows, and default feature flags</p>
        </div>
        <Link href="/superadmin/verticals/new" className="btn btn-primary btn-sm">+ New Vertical</Link>
      </div>

      <div className="admin-card">
        <div className="table-shell">
          {loading ? (
            <table className="admin-table">
              <thead><tr><th>Key</th><th>Label</th><th>Icon</th><th>Fields</th><th>Flags</th><th>Tenants</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody><SkRows rows={4} cols={8} /></tbody>
            </table>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Label</th>
                  <th>Icon</th>
                  <th>Fields</th>
                  <th>Flags</th>
                  <th>Tenants</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {verticals.map(v => (
                  <tr key={v._id}>
                    <td className="cell-mono" style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{v.key}</td>
                    <td style={{ fontWeight: 500 }}>{v.label}</td>
                    <td className="cell-sub cell-mono">{v.icon || '—'}</td>
                    <td className="cell-mono">{v.fieldSchema.length}</td>
                    <td className="cell-mono">{v.defaultFeatureFlags.length}</td>
                    <td className="cell-mono" style={{ color: v.tenantCount > 0 ? 'var(--ink)' : 'var(--ink-3)' }}>
                      {v.tenantCount}
                    </td>
                    <td>
                      <span className={`badge ${v.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/superadmin/verticals/${v.key}`} className="btn btn-ghost btn-sm">Edit</Link>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: v.isActive ? 'var(--red)' : 'var(--green)' }}
                        onClick={() => toggleActive(v.key, v.isActive)}
                      >
                        {v.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {verticals.length === 0 && (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-title">No verticals yet — create your first one</div>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
