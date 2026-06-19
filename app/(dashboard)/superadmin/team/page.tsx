'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../../lib/api';
import { ROLE_COLOR } from '../../../../lib/auth';
import { SkRows } from '../../../../components/ui/Skeleton';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'badge-purple',
  ops_admin:  'badge-blue',
  sales:      'badge-green',
  support:    'badge-gold',
};

const ASSIGNABLE_ROLES = ['ops_admin', 'sales', 'support'] as const;
type AssignableRole = typeof ASSIGNABLE_ROLES[number];

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  ops_admin:  'Ops Admin',
  sales:      'Sales',
  support:    'Support',
};

type AdminMember = { _id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string };


export default function TeamPage() {
  const [team, setTeam]         = useState<AdminMember[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite]         = useState({ name: '', email: '', password: '', role: 'support' as AssignableRole });
  const [inviting, setInviting]     = useState(false);

  const [editTarget, setEditTarget] = useState<AdminMember | null>(null);
  const [editRole, setEditRole]     = useState<AssignableRole>('support');
  const [editing, setEditing]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/team');
      setTeam(res.data.team);
    } catch { /**/ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function toast(msg: string) { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3500); }

  async function handleInvite() {
    if (!invite.name.trim() || !invite.email.trim() || !invite.password.trim()) {
      toast('Name, email and password are required'); return;
    }
    if (invite.password.length < 8) {
      toast('Password must be at least 8 characters'); return;
    }
    setInviting(true);
    try {
      await api.post('/admin/team', invite);
      toast(`${invite.name} added to the team`);
      setShowInvite(false);
      setInvite({ name: '', email: '', password: '', role: 'support' });
      load();
    } catch (e: any) {
      toast(e?.response?.data?.error || 'Failed to create admin');
    }
    setInviting(false);
  }

  async function handleEditSave() {
    if (!editTarget) return;
    setEditing(true);
    try {
      await api.patch(`/admin/team/${editTarget._id}`, { role: editRole });
      toast('Role updated');
      setEditTarget(null);
      load();
    } catch { toast('Failed to update role'); }
    setEditing(false);
  }

  async function toggleActive(member: AdminMember) {
    if (!confirm(`${member.isActive ? 'Deactivate' : 'Reactivate'} ${member.name}?`)) return;
    try {
      await api.patch(`/admin/team/${member._id}`, { isActive: !member.isActive });
      toast(`${member.name} ${member.isActive ? 'deactivated' : 'reactivated'}`);
      load();
    } catch { toast('Failed to update'); }
  }

  return (
    <div className="animate-fade-in">
      {toastMsg && <div className="toast toast-default">{toastMsg}</div>}

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Admin Team</h1>
          <p className="page-sub">{team.length} admin account{team.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>+ Invite Admin</button>
      </div>

      <div className="admin-card">
        <div className="table-shell">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Added</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? <SkRows rows={6} cols={6} /> : (
                <>
                  {team.map(m => (
                    <tr key={m._id} style={{ opacity: m.isActive ? 1 : 0.5 }}>
                      <td className="cell-main">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: (ROLE_COLOR as Record<string,string>)[m.role] || '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          {m.name}
                        </div>
                      </td>
                      <td className="cell-mono">{m.email}</td>
                      <td><span className={`badge ${ROLE_BADGE[m.role] || 'badge-gray'}`}>{ROLE_LABEL[m.role] || m.role}</span></td>
                      <td><span className={`badge ${m.isActive ? 'badge-green' : 'badge-red'}`}>{m.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td className="cell-sub">{fmtDate(m.createdAt)}</td>
                      <td>
                        {m.role !== 'superadmin' && (
                          <div className="gap-2" style={{ display: 'flex' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditTarget(m); setEditRole(m.role as AssignableRole); }}>Edit Role</button>
                            <button className={`btn btn-sm ${m.isActive ? 'btn-danger' : 'btn-ghost'}`} onClick={() => toggleActive(m)}>
                              {m.isActive ? 'Deactivate' : 'Reactivate'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {team.length === 0 && (
                    <tr><td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🛡️</div>
                        <div className="empty-state-title">No admin accounts yet</div>
                      </div>
                    </td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="modal-backdrop" onClick={() => setShowInvite(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 420 }}>
            <div className="modal-header">
              <div className="modal-title">Invite Admin</div>
              <button onClick={() => setShowInvite(false)} className="btn btn-ghost btn-sm btn-icon">✕</button>
            </div>
            <div className="modal-body stack-4">
              <div>
                <label className="form-label">Name</label>
                <input className="admin-input" placeholder="Full name" value={invite.name} onChange={e => setInvite(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="admin-input" type="email" placeholder="admin@ordermatrix.in" value={invite.email} onChange={e => setInvite(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Temporary Password</label>
                <input className="admin-input" type="password" placeholder="Min 8 characters" minLength={8} value={invite.password} onChange={e => setInvite(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Role</label>
                <select className="admin-input" value={invite.role} onChange={e => setInvite(p => ({ ...p, role: e.target.value as AssignableRole }))}>
                  {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleInvite} disabled={inviting}>
                {inviting ? <><span className="spinner" />Creating…</> : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit role modal */}
      {editTarget && (
        <div className="modal-backdrop" onClick={() => setEditTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 360 }}>
            <div className="modal-header">
              <div className="modal-title">Edit Role — {editTarget.name}</div>
              <button onClick={() => setEditTarget(null)} className="btn btn-ghost btn-sm btn-icon">✕</button>
            </div>
            <div className="modal-body">
              <label className="form-label">Role</label>
              <select className="admin-input" value={editRole} onChange={e => setEditRole(e.target.value as AssignableRole)}>
                {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setEditTarget(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleEditSave} disabled={editing}>
                {editing ? <><span className="spinner" />Saving…</> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
