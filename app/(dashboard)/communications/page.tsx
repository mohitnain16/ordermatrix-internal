'use client';
import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { SkRows } from '../../../components/ui/Skeleton';

type Announcement = {
  _id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  targetPlans: string[];
  isActive: boolean;
  expiresAt: string | null;
  createdByEmail: string;
  createdAt: string;
};

const SEVERITY_BADGE: Record<string, string> = {
  info: 'badge-blue', warning: 'badge-gold', success: 'badge-green', error: 'badge-red',
};
const PLANS = ['all', 'trial', 'starter', 'growth', 'scale', 'pro'];

const emptyAnn = { title: '', message: '', type: 'banner', severity: 'info', targetPlans: [] as string[], expiresAt: '' };

export default function CommunicationsPage() {
  const [tab, setTab] = useState<'broadcast' | 'announcements'>('broadcast');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annForm, setAnnForm] = useState({ ...emptyAnn });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annLoading, setAnnLoading] = useState(false);
  const [annListLoading, setAnnListLoading] = useState(true);

  // Broadcast state
  const [broadcast, setBroadcast] = useState({ channel: 'email', message: '', subject: '', filterPlan: 'all', filterTrial: '' });
  const [preview, setPreview] = useState<{ count: number; tenants: any[] } | null>(null);
  const [bcLoading, setBcLoading] = useState(false);
  const [bcResult, setBcResult] = useState<any>(null);

  useEffect(() => { loadAnnouncements(); }, []);

  async function loadAnnouncements() {
    setAnnListLoading(true);
    try {
      const res = await api.get('/admin/communications/announcements');
      setAnnouncements(res.data.announcements);
    } catch { /**/ }
    setAnnListLoading(false);
  }

  async function previewBroadcast() {
    try {
      const res = await api.get('/admin/communications/broadcast/preview', {
        params: { filterPlan: broadcast.filterPlan, filterTrial: broadcast.filterTrial },
      });
      setPreview({ count: res.data.count, tenants: [] });
    } catch { /**/ }
  }

  async function sendBroadcast() {
    if (!broadcast.message) return;
    const count = preview?.count;
    const label = count !== undefined ? `${count} tenant${count !== 1 ? 's' : ''}` : 'all matching tenants';
    if (!confirm(`Send broadcast to ${label} via email? This cannot be undone.`)) return;
    setBcResult(null);
    setBcLoading(true);
    try {
      const res = await api.post('/admin/communications/broadcast', broadcast);
      setBcResult(res.data);
    } catch { /**/ }
    setBcLoading(false);
  }

  async function saveAnnouncement() {
    setAnnLoading(true);
    try {
      if (editingId) {
        await api.patch(`/admin/communications/announcements/${editingId}`, annForm);
      } else {
        await api.post('/admin/communications/announcements', annForm);
      }
      await loadAnnouncements();
      setShowAnnForm(false);
      setEditingId(null);
      setAnnForm({ ...emptyAnn });
    } catch { /**/ }
    setAnnLoading(false);
  }

  async function toggleAnnouncement(id: string, isActive: boolean) {
    try {
      await api.patch(`/admin/communications/announcements/${id}`, { isActive: !isActive });
      await loadAnnouncements();
    } catch { /**/ }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/admin/communications/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
    } catch { /**/ }
  }

  function editAnn(a: Announcement) {
    setAnnForm({ title: a.title, message: a.message, type: a.type, severity: a.severity, targetPlans: a.targetPlans, expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : '' });
    setEditingId(a._id);
    setShowAnnForm(true);
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Communications</h1>
        <p className="page-sub">Broadcast messages and in-app announcements</p>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {([
          { key: 'broadcast', label: 'Broadcast' },
          { key: 'announcements', label: `Announcements (${announcements.filter(a => a.isActive).length} active)` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`tab-btn${tab === t.key ? ' active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'broadcast' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          <div className="admin-card">
            <div className="card-header">
              <h3 className="card-title">Compose Broadcast</h3>
            </div>
            <div className="card-body">

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="form-label">Channel</label>
                <select className="admin-input" value={broadcast.channel} onChange={e => setBroadcast(b => ({ ...b, channel: e.target.value }))}>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="both">Email + WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="form-label">Filter by Plan</label>
                <select className="admin-input" value={broadcast.filterPlan} onChange={e => setBroadcast(b => ({ ...b, filterPlan: e.target.value }))}>
                  {PLANS.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p === 'all' ? 'All Tenants' : p}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Filter by Trial</label>
              <select className="admin-input" style={{ maxWidth: 260 }} value={broadcast.filterTrial} onChange={e => setBroadcast(b => ({ ...b, filterTrial: e.target.value }))}>
                <option value="">No filter</option>
                <option value="expiring">Trials expiring this week</option>
              </select>
            </div>

            {broadcast.channel !== 'whatsapp' && (
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Subject</label>
                <input className="admin-input" placeholder="Email subject line" value={broadcast.subject} onChange={e => setBroadcast(b => ({ ...b, subject: e.target.value }))} />
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Message</label>
              <textarea
                rows={6}
                className="admin-input"
                placeholder="Write your message here…"
                value={broadcast.message}
                onChange={e => setBroadcast(b => ({ ...b, message: e.target.value }))}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={previewBroadcast}>Preview Recipients</button>
              <button className="btn btn-primary" onClick={sendBroadcast} disabled={bcLoading || !broadcast.message || (preview !== null && preview.count === 0)}>
                {bcLoading ? <><span className="spinner" />Sending…</> : 'Send Broadcast'}
              </button>
            </div>
            {preview !== null && preview.count === 0 && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--red)' }}>
                No recipients match this segment — adjust filters before sending.
              </p>
            )}
            {broadcast.channel !== 'email' && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-4)' }}>
                WhatsApp broadcast is pending template approval — email only for now.
              </p>
            )}

            {bcResult && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: bcResult.failed > 0 && bcResult.emailSent === 0 ? 'rgba(239,68,68,0.08)' : 'rgba(52,211,153,0.1)', border: `1px solid ${bcResult.failed > 0 && bcResult.emailSent === 0 ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`, borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: bcResult.failed > 0 && bcResult.emailSent === 0 ? 'var(--red)' : 'var(--green)', marginBottom: bcResult.failed > 0 ? 4 : 0 }}>{bcResult.message}</div>
                {bcResult.failed > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {bcResult.failed} send{bcResult.failed !== 1 ? 's' : ''} failed — check server logs for details.
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          <div>
            <div className="admin-card">
              <div className="card-header">
                <h4 className="card-title">Audience</h4>
              </div>
              <div className="card-body">
                {preview ? (
                  <div className="stat-value mono" style={{ color: 'var(--accent)', marginBottom: 4 }}>{preview.count}</div>
                ) : (
                  <div className="stat-value mono" style={{ color: 'var(--ink-4)', marginBottom: 4 }}>—</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>tenants match current filter</div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={previewBroadcast}>Recalculate</button>
              </div>
            </div>
            <div className="admin-card" style={{ marginTop: 12 }}>
              <div className="card-header">
                <h4 className="card-title">Quick Segments</h4>
              </div>
              <div className="card-body">
                {[
                  { label: 'All Trials Expiring This Week', plan: 'all', trial: 'expiring' },
                  { label: 'All Paid Tenants', plan: 'all', trial: '' },
                  { label: 'Starter Plan', plan: 'starter', trial: '' },
                  { label: 'Growth Plan', plan: 'growth', trial: '' },
                ].map(seg => (
                  <button key={seg.label} className="btn btn-ghost btn-sm" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 6 }}
                    onClick={() => { setBroadcast(b => ({ ...b, filterPlan: seg.plan, filterTrial: seg.trial })); }}>
                    {seg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'announcements' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowAnnForm(true); setEditingId(null); setAnnForm({ ...emptyAnn }); }}>
              + New Announcement
            </button>
          </div>

          {showAnnForm && (
            <div className="admin-card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <h3 className="card-title">{editingId ? 'Edit' : 'New'} Announcement</h3>
              </div>
              <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="form-label">Title</label>
                  <input className="admin-input" placeholder="Announcement title" value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="admin-input" value={annForm.type} onChange={e => setAnnForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="banner">Banner</option>
                    <option value="modal">Modal</option>
                    <option value="toast">Toast</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Message</label>
                <textarea rows={3} className="admin-input" placeholder="Announcement body…" value={annForm.message} onChange={e => setAnnForm(f => ({ ...f, message: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label className="form-label">Severity</label>
                  <select className="admin-input" value={annForm.severity} onChange={e => setAnnForm(f => ({ ...f, severity: e.target.value }))}>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Target Plans</label>
                  <select className="admin-input" value={annForm.targetPlans[0] || ''} onChange={e => setAnnForm(f => ({ ...f, targetPlans: e.target.value ? [e.target.value] : [] }))}>
                    <option value="">All Plans</option>
                    {PLANS.slice(1).map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Expires At</label>
                  <input type="date" className="admin-input" value={annForm.expiresAt} onChange={e => setAnnForm(f => ({ ...f, expiresAt: e.target.value }))} />
                </div>
              </div>
              </div>
              <div className="card-footer">
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowAnnForm(false); setEditingId(null); }}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveAnnouncement} disabled={annLoading || !annForm.title || !annForm.message}>
                  {annLoading ? <><span className="spinner" />{editingId ? 'Saving…' : 'Publishing…'}</> : editingId ? 'Update' : 'Publish'}
                </button>
              </div>
            </div>
          )}

          <div className="admin-card">
            <table className="admin-table">
              <thead>
                <tr><th>Title</th><th>Type</th><th>Severity</th><th>Target</th><th>Expires</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {annListLoading ? <SkRows rows={5} cols={7} /> : announcements.map(a => (
                  <tr key={a._id}>
                    <td>
                      <div className="cell-main">{a.title}</div>
                      <div className="cell-sub text-truncate" style={{ maxWidth: 240 }}>{a.message}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{a.type}</td>
                    <td><span className={`badge ${SEVERITY_BADGE[a.severity] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{a.severity}</span></td>
                    <td style={{ fontSize: 12 }}>{a.targetPlans?.length > 0 ? a.targetPlans.join(', ') : 'All'}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{a.expiresAt ? new Date(a.expiresAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td>
                      <span className={`badge ${a.isActive ? 'badge-green' : 'badge-gray'}`}>{a.isActive ? 'Active' : 'Paused'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => editAnn(a)}>Edit</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleAnnouncement(a._id, a.isActive)}>
                          {a.isActive ? 'Pause' : 'Resume'}
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteAnnouncement(a._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!annListLoading && announcements.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📢</div>
                      <div className="empty-state-title">No announcements yet</div>
                      <div className="empty-state-sub">Create one to broadcast to tenants</div>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
