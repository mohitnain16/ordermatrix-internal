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
          <div className="modal-box" style={{ padding: 28, width: 440 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Create Coupon</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', display: 'block', marginBottom: 4 }}>CODE *</label>
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', display: 'block', marginBottom: 4 }}>TYPE *</label>
                <select
                  value={form.discountType}
                  onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percent' | 'flat' }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', boxSizing: 'border-box' }}
                >
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', display: 'block', marginBottom: 4 }}>VALUE *</label>
                <input
                  type="number" min={0}
                  value={form.discountValue}
                  onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  placeholder={form.discountType === 'percent' ? '20' : '500'}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', display: 'block', marginBottom: 4 }}>MAX USES</label>
                <input
                  type="number" min={1}
                  value={form.maxUses}
                  onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                  placeholder="Unlimited"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', display: 'block', marginBottom: 4 }}>APPLICABLE PLANS (comma-separated, empty = all)</label>
              <input
                value={form.applicablePlans}
                onChange={e => setForm(f => ({ ...f, applicablePlans: e.target.value }))}
                placeholder="starter, growth, scale"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', display: 'block', marginBottom: 4 }}>EXPIRES AT</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 7, fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{c.code}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--green)' }}>{discountLabel(c)}</td>
                  <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{c.applicablePlans.length ? c.applicablePlans.join(', ') : 'All plans'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
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
                      className={`btn btn-sm ${c.isActive ? 'btn-ghost' : 'btn-ghost'}`}
                      style={{ color: c.isActive ? 'var(--red)' : 'var(--green)', fontSize: 12 }}
                      onClick={() => toggleActive(c._id, c.isActive)}
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--ink-4)' }}>No coupons yet — create your first one</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
