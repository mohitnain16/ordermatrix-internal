'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, GripVertical, Lock } from 'lucide-react';
import api from '../../../../../lib/api';

// ── Feature flags grouped for the multi-select UI ─────────────────────────────
// Keys mirror FEATURE_MATRIX in ordermatrix-api/src/config/pricing.js
const FLAG_GROUPS = [
  { group: 'Orders',    flags: ['orders_create_edit_track','orders_multi_item','orders_status_pipeline','pending_board','order_activity_timeline','order_internal_comments','advance_bookings'] },
  { group: 'Payments',  flags: ['upi_recording','payment_screenshot_upload','utr_duplicate_check','cod_tracking'] },
  { group: 'Customers', flags: ['customer_database','customer_order_history','customer_address_book','customer_source_attribution','customer_ltv_tracking','customer_returns_tracking'] },
  { group: 'Products',  flags: ['products_catalog_sku','products_cost_price','products_low_stock_alerts'] },
  { group: 'Invoices',  flags: ['invoices_gst','invoices_custom_branding','invoices_white_label','invoices_print_pdf'] },
  { group: 'Shipments', flags: ['shipments_dispatch','returns_with_reason'] },
  { group: 'WhatsApp',  flags: ['whatsapp_manual_share','whatsapp_automation','wa_conv_agent'] },
  { group: 'Analytics', flags: ['analytics_todays_pulse','analytics_basic_dashboard','analytics_revenue_trend','analytics_status_breakdown','analytics_payment_mode_split','analytics_top_customers','analytics_order_trend_chart','analytics_activity_feed'] },
  { group: 'Team',      flags: ['team_role_based_access','team_invitations','team_pending_invite_management'] },
  { group: 'Support',   flags: ['support_email','support_priority_response','support_dedicated_onboarding','support_early_feature_access'] },
  { group: 'Platform',  flags: ['platform_multilang_en_hi_pa','platform_mobile_friendly','platform_hosted_india','platform_data_export'] },
  { group: 'Search',    flags: ['globalSearch'] },
];

const FIELD_TYPES = ['text', 'number', 'select', 'date', 'boolean'] as const;

type FieldType = typeof FIELD_TYPES[number];

type FieldRow = {
  field: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string;
  showIn: string[];
};

type FormState = {
  key: string;
  label: string;
  icon: string;
  isActive: boolean;
  defaultFeatureFlags: string[];
  fieldSchema: FieldRow[];
  categories: string[];
  statusFlowRaw: string;
};

const EMPTY_FIELD_ROW: FieldRow = {
  field: '', label: '', type: 'text', required: false, options: '', showIn: [],
};

function emptyForm(): FormState {
  return {
    key: '', label: '', icon: '', isActive: true,
    defaultFeatureFlags: [], fieldSchema: [], categories: [], statusFlowRaw: '',
  };
}

function statusFlowError(raw: string): string | null {
  if (!raw.trim()) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return 'Invalid JSON'; }
  if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
    return 'Must be a JSON object';
  }
  const obj = parsed as Record<string, unknown>;
  const allKeys = new Set(Object.keys(obj));
  for (const [status, nexts] of Object.entries(obj)) {
    if (!Array.isArray(nexts)) return `"${status}": value must be an array`;
    for (const n of nexts as unknown[]) {
      if (typeof n !== 'string') return `"${status}": array items must be strings`;
      if (!allKeys.has(n)) return `"${status}" → "${n}" is not defined as a status key`;
    }
  }
  return null;
}

export default function VerticalFormPage({ params }: { params: Promise<{ key: string }> }) {
  const { key: routeKey } = use(params);
  const isNew = routeKey === 'new';
  const router = useRouter();

  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastErr, setToastErr] = useState('');
  const [sfError, setSfError] = useState<string | null>(null);
  const [tenantCount, setTenantCount] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isNew) fetchVertical();
  }, [routeKey]);

  async function fetchVertical() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/verticals/${routeKey}`);
      const v = res.data.vertical;
      setTenantCount(v.tenantCount || 0);
      setForm({
        key:                 v.key,
        label:               v.label,
        icon:                v.icon || '',
        isActive:            v.isActive,
        defaultFeatureFlags: v.defaultFeatureFlags || [],
        fieldSchema: (v.fieldSchema || []).map((f: any) => ({
          field:    f.field,
          label:    f.label,
          type:     f.type,
          required: f.required,
          options:  (f.options || []).join(', '),
          showIn:   f.showIn || [],
        })),
        categories: v.categories || [],
        statusFlowRaw: v.workflowOverrides?.statusFlow
          ? JSON.stringify(v.workflowOverrides.statusFlow, null, 2)
          : '',
      });
    } catch (e: any) {
      toast(e?.response?.data?.error || 'Failed to load vertical', true);
    }
    setLoading(false);
  }

  function toast(msg: string, err = false) {
    if (err) { setToastErr(msg); setTimeout(() => setToastErr(''), 5000); }
    else     { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); }
  }

  function validateForm(): boolean {
    if (!form.key.trim())   { toast('Key is required', true); return false; }
    if (!form.label.trim()) { toast('Label is required', true); return false; }
    if (!isNew && !/^[a-z][a-z0-9_]*$/.test(form.key)) {
      toast('Key must be lowercase letters, digits, and underscores only', true); return false;
    }
    const sfErr = statusFlowError(form.statusFlowRaw);
    if (sfErr) { setSfError(sfErr); toast('Fix status flow errors before saving', true); return false; }
    const names = form.fieldSchema.map(f => f.field).filter(Boolean);
    if (new Set(names).size !== names.length) {
      toast('Field schema has duplicate field names', true); return false;
    }
    return true;
  }

  function buildPayload() {
    let statusFlow: Record<string, string[]> | undefined;
    if (form.statusFlowRaw.trim()) {
      statusFlow = JSON.parse(form.statusFlowRaw);
    }
    return {
      label:               form.label.trim(),
      icon:                form.icon.trim() || undefined,
      isActive:            form.isActive,
      defaultFeatureFlags: form.defaultFeatureFlags,
      fieldSchema: form.fieldSchema
        .filter(f => f.field.trim())
        .map(f => ({
          field:    f.field.trim(),
          label:    f.label.trim() || f.field.trim(),
          type:     f.type,
          required: f.required,
          options:  f.type === 'select' ? f.options.split(',').map(s => s.trim()).filter(Boolean) : [],
          showIn:   f.showIn,
        })),
      categories:        form.categories.map(c => c.trim()).filter(Boolean),
      workflowOverrides: statusFlow ? { statusFlow } : {},
    };
  }

  async function handleSave() {
    if (!validateForm()) return;
    // Warn before saving changes to a live vertical
    if (!isNew && tenantCount > 0) {
      setConfirmOpen(true);
      return;
    }
    await doSave();
  }

  async function doSave() {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isNew) {
        await api.post('/admin/verticals', { ...payload, key: form.key.trim() });
        toast('Vertical created');
      } else {
        await api.put(`/admin/verticals/${routeKey}`, payload);
        toast('Vertical saved');
      }
      router.push('/superadmin/verticals');
    } catch (e: any) {
      toast(e?.response?.data?.error || 'Failed to save vertical', true);
    }
    setSaving(false);
  }

  // ── Field schema helpers ──────────────────────────────────────────────────────

  function addField() {
    setForm(f => ({ ...f, fieldSchema: [...f.fieldSchema, { ...EMPTY_FIELD_ROW }] }));
  }

  function removeField(i: number) {
    setForm(f => ({ ...f, fieldSchema: f.fieldSchema.filter((_, idx) => idx !== i) }));
  }

  function updateField(i: number, patch: Partial<FieldRow>) {
    setForm(f => ({
      ...f,
      fieldSchema: f.fieldSchema.map((row, idx) => idx === i ? { ...row, ...patch } : row),
    }));
  }

  function toggleShowIn(i: number, val: 'product' | 'order') {
    setForm(f => ({
      ...f,
      fieldSchema: f.fieldSchema.map((row, idx) => {
        if (idx !== i) return row;
        const next = row.showIn.includes(val)
          ? row.showIn.filter(s => s !== val)
          : [...row.showIn, val];
        return { ...row, showIn: next };
      }),
    }));
  }

  function addCategory() {
    setForm(f => ({ ...f, categories: [...f.categories, ''] }));
  }

  function removeCategory(i: number) {
    setForm(f => ({ ...f, categories: f.categories.filter((_, idx) => idx !== i) }));
  }

  function updateCategory(i: number, val: string) {
    setForm(f => ({ ...f, categories: f.categories.map((c, idx) => idx === i ? val : c) }));
  }

  function toggleFlag(flag: string) {
    setForm(f => ({
      ...f,
      defaultFeatureFlags: f.defaultFeatureFlags.includes(flag)
        ? f.defaultFeatureFlags.filter(k => k !== flag)
        : [...f.defaultFeatureFlags, flag],
    }));
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Loading…</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 840, paddingBottom: 48 }}>
      {toastMsg && <div className="toast toast-default">{toastMsg}</div>}
      {toastErr && <div className="toast toast-error">{toastErr}</div>}

      {/* Confirmation modal for editing live verticals */}
      {confirmOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 420 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: 'var(--amber)' }}>⚠ Affects {tenantCount} live tenant{tenantCount !== 1 ? 's' : ''}</div>
              <button onClick={() => setConfirmOpen(false)} className="btn btn-ghost btn-sm btn-icon">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                This vertical is currently used by <strong>{tenantCount} tenant{tenantCount !== 1 ? 's' : ''}</strong>.
                Changes to <strong>statusFlow</strong> or <strong>fieldSchema</strong> will affect their order processing and product forms immediately.
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>
                Make sure any removed statuses are not referenced by existing orders before saving.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={doSave} disabled={saving}>
                {saving ? <><span className="spinner" />Saving…</> : 'Save anyway'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">{isNew ? 'New Vertical' : `Edit — ${routeKey}`}</h1>
          <p className="page-sub">
            {isNew ? 'Create a new industry vertical' : `${tenantCount} tenant${tenantCount !== 1 ? 's' : ''} currently using this vertical`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/superadmin/verticals" className="btn btn-ghost btn-sm">Cancel</Link>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" />Saving…</> : isNew ? 'Create Vertical' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Section 1: Basic info ─────────────────────────────────────────────── */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div style={{ fontWeight: 600, fontSize: 13 }}>Basic Info</div></div>
        <div className="card-body stack-4">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="form-label">
                KEY {!isNew && <Lock size={10} style={{ display: 'inline', marginLeft: 4, opacity: 0.5 }} />}
              </label>
              <input
                className="admin-input"
                value={form.key}
                onChange={e => isNew && setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                readOnly={!isNew}
                placeholder="fashion"
                style={{ fontFamily: 'var(--font-mono)', opacity: isNew ? 1 : 0.6, cursor: isNew ? 'text' : 'not-allowed' }}
              />
              {isNew && <div className="input-hint">Lowercase letters, digits, underscores. Cannot be changed later.</div>}
            </div>
            <div>
              <label className="form-label">LABEL *</label>
              <input
                className="admin-input"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Fashion & Apparel"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="form-label">ICON (lucide-react name)</label>
              <input
                className="admin-input"
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="Shirt"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <div className="input-hint">e.g. Shirt, Smartphone, Package, ShoppingBag</div>
            </div>
            <div>
              <label className="form-label">STATUS</label>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, cursor: 'pointer' }}
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              >
                <div style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: form.isActive ? 'var(--green)' : 'var(--ink-4)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: form.isActive ? 18 : 2,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{form.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Default Feature Flags ─────────────────────────────────── */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div style={{ fontWeight: 600, fontSize: 13 }}>Default Feature Flags</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{form.defaultFeatureFlags.length} selected</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px 16px' }}>
            {FLAG_GROUPS.map(({ group, flags }) => (
              <div key={group}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.06em', marginBottom: 4, textTransform: 'uppercase' }}>
                  {group}
                </div>
                {flags.map(flag => (
                  <label key={flag} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.defaultFeatureFlags.includes(flag)}
                      onChange={() => toggleFlag(flag)}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{flag}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 3: Field Schema builder ──────────────────────────────────── */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Field Schema</div>
          <button className="btn btn-ghost btn-sm" onClick={addField} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={12} /> Add field
          </button>
        </div>
        <div className="card-body">
          {form.fieldSchema.length === 0 && (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-state-title">No custom fields — click "Add field" to define vertical-specific product or order fields</div>
            </div>
          )}
          {form.fieldSchema.map((row, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '16px 1fr 1fr 100px 60px 1fr 80px 28px',
              gap: 8, alignItems: 'center', padding: '8px 0',
              borderBottom: i < form.fieldSchema.length - 1 ? '1px solid var(--line-2)' : 'none',
            }}>
              {/* drag handle — decorative for v1 */}
              <GripVertical size={14} style={{ color: 'var(--ink-4)', cursor: 'grab' }} />

              <input
                className="admin-input"
                value={row.field}
                onChange={e => updateField(i, { field: e.target.value.replace(/\s/g, '_') })}
                placeholder="field_name"
                style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}
              />
              <input
                className="admin-input"
                value={row.label}
                onChange={e => updateField(i, { label: e.target.value })}
                placeholder="Display Label"
                style={{ fontSize: 12 }}
              />
              <select
                className="admin-input"
                value={row.type}
                onChange={e => updateField(i, { type: e.target.value as FieldType })}
                style={{ fontSize: 12 }}
              >
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-2)', cursor: 'pointer', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={row.required}
                  onChange={e => updateField(i, { required: e.target.checked })}
                  style={{ accentColor: 'var(--accent)' }}
                />
                req'd
              </label>

              <input
                className="admin-input"
                value={row.options}
                onChange={e => updateField(i, { options: e.target.value })}
                placeholder={row.type === 'select' ? 'a, b, c' : ''}
                disabled={row.type !== 'select'}
                title="Comma-separated options (only for select type)"
                style={{ fontSize: 11, opacity: row.type === 'select' ? 1 : 0.3 }}
              />

              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                {(['product', 'order'] as const).map(scope => (
                  <label key={scope} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={row.showIn.includes(scope)}
                      onChange={() => toggleShowIn(i, scope)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>{scope}</span>
                  </label>
                ))}
              </div>

              <button onClick={() => removeField(i)} className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--red)' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {form.fieldSchema.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr 1fr 100px 60px 1fr 80px 28px', gap: 8, marginTop: 4 }}>
              <span />
              <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>field name</span>
              <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>label</span>
              <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>type</span>
              <span style={{ fontSize: 10, color: 'var(--ink-4)', textAlign: 'center' }}>req</span>
              <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>options (select)</span>
              <span style={{ fontSize: 10, color: 'var(--ink-4)', textAlign: 'center' }}>show in</span>
              <span />
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: Categories ────────────────────────────────────────────── */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Categories</div>
          <button className="btn btn-ghost btn-sm" onClick={addCategory} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={12} /> Add category
          </button>
        </div>
        <div className="card-body">
          {form.categories.length === 0 && (
            <div className="empty-state" style={{ padding: '16px 0' }}>
              <div className="empty-state-title">No categories — click "Add category" to define product categories for this vertical</div>
            </div>
          )}
          {form.categories.map((cat, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input
                className="admin-input"
                value={cat}
                onChange={e => updateCategory(i, e.target.value)}
                placeholder="e.g. Tops, Bottoms, Accessories"
                style={{ flex: 1 }}
              />
              <button onClick={() => removeCategory(i)} className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--red)', flexShrink: 0 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 5: Status Flow (v1 — JSON textarea) ───────────────────────── */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            Status Flow
            <span style={{
              marginLeft: 8, fontSize: 10, padding: '2px 7px', borderRadius: 4,
              background: 'var(--amber-bg, #fff8ed)', color: 'var(--amber)',
              fontFamily: 'var(--font-mono)', fontWeight: 500,
            }}>v1 — JSON editor</span>
          </div>
        </div>
        <div className="card-body">
          <div className="input-hint" style={{ marginBottom: 10 }}>
            Maps each status key to the array of valid next statuses. Leave empty to use the platform default.
            A visual drag-and-drop builder is planned for v2.
          </div>
          <textarea
            className="admin-input"
            value={form.statusFlowRaw}
            onChange={e => {
              setForm(f => ({ ...f, statusFlowRaw: e.target.value }));
              setSfError(null);
            }}
            onBlur={() => setSfError(statusFlowError(form.statusFlowRaw))}
            rows={10}
            placeholder={`{\n  "pending": ["confirmed", "cancelled"],\n  "confirmed": ["shipped", "cancelled"],\n  "shipped": ["delivered"],\n  "delivered": [],\n  "cancelled": []\n}`}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical' }}
            spellCheck={false}
          />
          {sfError && (
            <div className="alert alert-danger" style={{ marginTop: 8, fontSize: 12 }}>
              {sfError}
            </div>
          )}
        </div>
      </div>

      {/* Bottom save bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
        <Link href="/superadmin/verticals" className="btn btn-ghost btn-sm">Cancel</Link>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner" />Saving…</> : isNew ? 'Create Vertical' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
