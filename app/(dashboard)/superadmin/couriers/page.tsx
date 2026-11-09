'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

type Courier = {
  _id: string;
  key: string;
  label: string;
  group: 'immediate' | 'delayed' | 'none';
  trackingUrlTemplate: string;
  sortOrder: number;
  isActive: boolean;
};

type FormState = {
  key: string;
  label: string;
  group: 'immediate' | 'delayed' | 'none';
  trackingUrlTemplate: string;
  sortOrder: number;
};

const EMPTY_FORM: FormState = {
  key: '',
  label: '',
  group: 'delayed',
  trackingUrlTemplate: '',
  sortOrder: 100,
};

const GROUP_LABELS: Record<string, string> = {
  immediate: 'Immediate (tracking required at dispatch)',
  delayed: 'Delayed (2-day tracking grace)',
  none: 'None (no tracking expected)',
};

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [toastErr, setToastErr] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null); // null = create
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/couriers');
      setCouriers(res.data.couriers || []);
    } catch { /**/ }
    setLoading(false);
  }

  function toast(msg: string, err = false) {
    if (err) { setToastErr(msg); setTimeout(() => setToastErr(''), 4000); }
    else     { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); }
  }

  function openCreate() {
    setEditKey(null);
    setForm(EMPTY_FORM);
    setFormErr('');
    setShowModal(true);
  }

  function openEdit(c: Courier) {
    setEditKey(c.key);
    setForm({
      key: c.key,
      label: c.label,
      group: c.group,
      trackingUrlTemplate: c.trackingUrlTemplate || '',
      sortOrder: c.sortOrder,
    });
    setFormErr('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditKey(null);
    setFormErr('');
  }

  async function save() {
    setSaving(true);
    setFormErr('');
    try {
      if (editKey) {
        const res = await api.put(`/admin/couriers/${editKey}`, {
          label: form.label,
          group: form.group,
          trackingUrlTemplate: form.trackingUrlTemplate,
          sortOrder: form.sortOrder,
        });
        setCouriers(cs => cs.map(c => c.key === editKey ? res.data.courier : c));
        toast('Courier updated');
      } else {
        const res = await api.post('/admin/couriers', form);
        setCouriers(cs => [...cs, res.data.courier].sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key)));
        toast('Courier created');
      }
      closeModal();
    } catch (e: any) {
      setFormErr(e?.response?.data?.error || 'Failed to save courier');
    }
    setSaving(false);
  }

  async function toggleActive(key: string, isActive: boolean) {
    try {
      if (isActive) {
        const res = await api.delete(`/admin/couriers/${key}`);
        setCouriers(cs => cs.map(c => c.key === key ? res.data.courier : c));
        toast('Courier deactivated');
      } else {
        const res = await api.put(`/admin/couriers/${key}`, { isActive: true });
        setCouriers(cs => cs.map(c => c.key === key ? res.data.courier : c));
        toast('Courier activated');
      }
    } catch (e: any) {
      toast(e?.response?.data?.error || 'Failed to update courier', true);
    }
  }

  return (
    <div className="animate-fade-in">
      {toastMsg && <div className="toast toast-default">{toastMsg}</div>}
      {toastErr && <div className="toast toast-error">{toastErr}</div>}

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Couriers</h1>
          <p className="page-sub">Platform-wide courier list — visible to all tenants in dispatch dropdowns</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Courier</button>
      </div>

      <div className="admin-card">
        <div className="table-shell">
          {loading ? (
            <table className="admin-table">
              <thead><tr><th>Key</th><th>Label</th><th>Group</th><th>Sort</th><th>Tracking URL</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody><SkRows rows={5} cols={7} /></tbody>
            </table>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Label</th>
                  <th>Group</th>
                  <th>Sort</th>
                  <th>Tracking URL</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {couriers.map(c => (
                  <tr key={c._id} style={{ opacity: c.isActive ? 1 : 0.5 }}>
                    <td className="cell-mono" style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{c.key}</td>
                    <td style={{ fontWeight: 500 }}>{c.label}</td>
                    <td>
                      <span className={`badge ${c.group === 'immediate' ? 'badge-orange' : c.group === 'none' ? 'badge-gray' : 'badge-blue'}`}>
                        {c.group}
                      </span>
                    </td>
                    <td className="cell-mono cell-sub">{c.sortOrder}</td>
                    <td className="cell-sub" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.trackingUrlTemplate || <span style={{ color: 'var(--ink-3)' }}>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: c.isActive ? 'var(--red)' : 'var(--green)' }}
                        onClick={() => toggleActive(c.key, c.isActive)}
                      >
                        {c.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {couriers.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-title">No couriers — run the seed script or add one</div>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editKey ? 'Edit Courier' : 'Add Courier'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!editKey && (
                <div className="form-group">
                  <label className="form-label">Key <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input
                    className="form-input"
                    placeholder="e.g. xpressbees (lowercase, underscores only)"
                    value={form.key}
                    onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  />
                  <span className="form-hint">Cannot be changed after creation</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Label <span style={{ color: 'var(--red)' }}>*</span></label>
                <input
                  className="form-input"
                  placeholder="e.g. Xpressbees"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Group <span style={{ color: 'var(--red)' }}>*</span></label>
                <select
                  className="form-input"
                  value={form.group}
                  onChange={e => setForm(f => ({ ...f, group: e.target.value as FormState['group'] }))}
                >
                  {Object.entries(GROUP_LABELS).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tracking URL Template</label>
                <input
                  className="form-input"
                  placeholder="https://example.com/track?id={{trackingNumber}}"
                  value={form.trackingUrlTemplate}
                  onChange={e => setForm(f => ({ ...f, trackingUrlTemplate: e.target.value }))}
                />
                <span className="form-hint">Use {'{{trackingNumber}}'} as placeholder</span>
              </div>

              <div className="form-group">
                <label className="form-label">Sort Order</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                />
                <span className="form-hint">Lower = appears first in dropdown</span>
              </div>

              {formErr && <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{formErr}</p>}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editKey ? 'Save Changes' : 'Create Courier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
