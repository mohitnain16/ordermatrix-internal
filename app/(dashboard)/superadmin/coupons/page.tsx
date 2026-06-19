'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import { Sk, SkRows } from '../../../../components/ui/Skeleton';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

type Coupon = {
  _id: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  applicablePlans: string[];
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdByEmail?: string;
  createdAt: string;
};

const EMPTY_FORM = {
  code: '',
  discountType: 'percent' as 'percent' | 'flat',
  discountValue: '',
  applicablePlans: '',
  maxUses: '',
  expiresAt: '',
};


export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastErr, setToastErr] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data.coupons || []);
    } catch { /**/ }
    setLoading(false);
  }

  function toast(msg: string, err = false) {
    if (err) { setToastErr(msg); setTimeout(() => setToastErr(''), 4000); }
    else     { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); }
  }

  async function create() {
    if (!form.code.trim() || !form.discountValue) { toast('Code and discount value are required', true); return; }
    setSaving(true);
    try {
      await api.post('/admin/coupons', {
        code:           form.code.trim().toUpperCase(),
        discountType:   form.discountType,
        discountValue:  Number(form.discountValue),
        applicablePlans: form.applicablePlans.trim() ? form.applicablePlans.split(',').map(s => s.trim()).filter(Boolean) : [],
        maxUses:   form.maxUses  ? Number(form.maxUses)  : null,
        expiresAt: form.expiresAt || null,
      });
      toast('Coupon created');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e: any) {
      toast(e?.response?.data?.error || 'Failed to create coupon', true);
    }
    setSaving(false);
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await api.patch(`/admin/coupons/${id}`, { isActive: !isActive });
      setCoupons(cs => cs.map(c => c._id === id ? { ...c, isActive: !isActive } : c));
      toast(isActive ? 'Coupon deactivated' : 'Coupon activated');
    } catch { toast('Failed to update coupon', true); }
  }

  function discountLabel(c: Coupon) {
    return c.discountType === 'percent' ? `${c.discountValue}% off` : `${fmt(c.discountValue)} off`;
  }

  return (
    <div className="animate-fade-in">
      {toastMsg && <div className="toast toast-default">{toastMsg}</div>}
      {toastErr && <div className="toast toast-error">{toastErr}</div>}

      {showCreate && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ width: 440 }}>
            <div className="modal-header">
              <div className="modal-title">Create Coupon</div>
              <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }} className="btn btn-ghost btn-sm btn-icon">✕</button>
            </div>
            <div className="modal-body stack-4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">CODE *</label>
                  <input
                    className="admin-input"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="SAVE20"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div>
                  <label className="form-label">TYPE *</label>
                  <select
                    className="admin-input"
                    value={form.discountType}
                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percent' | 'flat' }))}
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">VALUE *</label>
                  <input
                    className="admin-input"
                    type="number" min={0}
                    value={form.discountValue}
                    onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                    placeholder={form.discountType === 'percent' ? '20' : '500'}
                  />
                </div>
                <div>
                  <label className="form-label">MAX USES</label>
                  <input
                    className="admin-input"
                    type="number" min={1}
                    value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">APPLICABLE PLANS (comma-separated, empty = all)</label>
                <input
                  className="admin-input"
                  value={form.applicablePlans}
                  onChange={e => setForm(f => ({ ...f, applicablePlans: e.target.value }))}
                  placeholder="starter, growth, scale"
                />
              </div>

              <div>
                <label className="form-label">EXPIRES AT</label>
                <input
                  className="admin-input"
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={create} disabled={saving}>
                {saving ? <><span className="spinner" />Creating…</> : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Coupons</h1>
          <p className="page-sub">Annual-plan discount codes — managed by superadmin</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ New Coupon</button>
      </div>

      <div className="admin-card">
        <div className="table-shell">
          {loading ? (
            <table className="admin-table">
              <thead><tr><th>Code</th><th>Discount</th><th>Used</th><th>Expires</th><th>Status</th><th>Action</th></tr></thead>
              <tbody><SkRows rows={5} cols={6} /></tbody>
            </table>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>Code</th><th>Discount</th><th>Plans</th><th>Used</th><th>Expires</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c._id}>
                    <td className="cell-mono" style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{c.code}</td>
                    <td className="cell-mono" style={{ fontWeight: 600, color: 'var(--green)' }}>{discountLabel(c)}</td>
                    <td className="cell-sub">{c.applicablePlans.length ? c.applicablePlans.join(', ') : 'All plans'}</td>
                    <td className="cell-mono">
                      {c.usedCount}{c.maxUses !== null ? `/${c.maxUses}` : ''}
                    </td>
                    <td style={{ fontSize: 12 }}>{fmtDate(c.expiresAt)}</td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: c.isActive ? 'var(--red)' : 'var(--green)' }}
                        onClick={() => toggleActive(c._id, c.isActive)}
                      >
                        {c.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-title">No coupons yet — create your first one</div>
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
