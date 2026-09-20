'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Copy, Check } from 'lucide-react';
import api from '../../../../../lib/api';
import { getAdmin, hasRole } from '../../../../../lib/auth';

type TabId = 'connection' | 'settings' | 'products' | 'portal-users' | 'payment-rules';

const TABS: { id: TabId; label: string }[] = [
  { id: 'connection',    label: 'Connection'    },
  { id: 'settings',     label: 'Agent Settings' },
  { id: 'products',     label: 'Products'       },
  { id: 'portal-users', label: 'Portal Users'   },
  { id: 'payment-rules',label: 'Payment Rules'  },
];

const PORTAL_BASE = 'https://wa.ordermatrix.in';

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } as any) : '—';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <button onClick={copy} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', minWidth: 0 }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

interface ConfirmState {
  title: string;
  message: string;
  detail?: string;
  verifyText?: string;
  confirmLabel: string;
  confirmClass: string;
  level: 'danger' | 'warning';
  onConfirm: () => Promise<void>;
}

function ConfirmModal({ state, onCancel }: { state: ConfirmState; onCancel: () => void }) {
  const [verify, setVerify] = useState('');
  const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true);
    try { await state.onConfirm(); } finally { setLoading(false); }
  }
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className={`modal-box modal-${state.level}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{state.title}</div>
            {state.detail && <div className="modal-sub">{state.detail}</div>}
          </div>
        </div>
        <div className="modal-body">
          <p className="confirm-message">{state.message}</p>
          {state.verifyText && (
            <div style={{ marginTop: 16 }}>
              <div className="verify-input-label">Type <strong>{state.verifyText}</strong> to confirm</div>
              <input className="admin-input" value={verify} onChange={e => setVerify(e.target.value)} placeholder={state.verifyText} autoFocus />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button
            className={`btn btn-sm ${state.confirmClass}`}
            onClick={run}
            disabled={loading || (state.verifyText ? verify !== state.verifyText : false)}
          >
            {loading ? <span className="spinner" /> : state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WaAgentDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const admin = getAdmin();
  const canEdit = hasRole(admin, 'superadmin', 'ops_admin');

  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('connection');
  const loadedTabs = useRef<Set<TabId>>(new Set());
  const [toast, setToast] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  // Connection tab
  const [tokenForm, setTokenForm] = useState<any>(null);
  const [tokenSaving, setTokenSaving] = useState(false);

  // Settings tab
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<any>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Products tab
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productForm, setProductForm] = useState<any>(null); // null=closed, {}=new, {...}=edit
  const [productSaving, setProductSaving] = useState(false);

  // Portal Users tab
  const [portalUsers, setPortalUsers] = useState<any[]>([]);
  const [portalUsersLoading, setPortalUsersLoading] = useState(false);
  const [newUserForm, setNewUserForm] = useState<any>(null);
  const [newUserSaving, setNewUserSaving] = useState(false);
  const [oneTimePassword, setOneTimePassword] = useState<{ name: string; password: string } | null>(null);

  // Payment Rules tab
  const [paymentRules, setPaymentRules] = useState<any>(null);
  const [paymentRulesLoading, setPaymentRulesLoading] = useState(false);
  const [paymentRulesDraft, setPaymentRulesDraft] = useState<any>(null);
  const [paymentRulesSaving, setPaymentRulesSaving] = useState(false);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  function firstVisit(t: TabId, fn: () => void) {
    if (!loadedTabs.current.has(t)) { loadedTabs.current.add(t); fn(); }
  }

  const loadDetail = useCallback(async () => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/wa-agent/${tenantId}`);
      setDetail(res.data);
    } catch { setDetail(null); }
    setDetailLoading(false);
  }, [tenantId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  useEffect(() => {
    if (tab === 'settings')      firstVisit('settings',      loadSettings);
    if (tab === 'products')      firstVisit('products',      loadProducts);
    if (tab === 'portal-users')  firstVisit('portal-users',  loadPortalUsers);
    if (tab === 'payment-rules') firstVisit('payment-rules', loadPaymentRules);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const res = await api.get(`/admin/wa-agent/${tenantId}/settings`);
      setSettings(res.data);
    } catch { setSettings(null); }
    setSettingsLoading(false);
  }

  async function saveSettings() {
    if (!settingsDraft) return;
    setSettingsSaving(true);
    try {
      await api.patch(`/admin/wa-agent/${tenantId}/settings`, settingsDraft);
      setSettings(settingsDraft);
      setSettingsDraft(null);
      showToast('Settings saved');
    } catch (e: any) { showToast(e?.response?.data?.error || 'Save failed'); }
    setSettingsSaving(false);
  }

  async function loadProducts() {
    setProductsLoading(true);
    try {
      const res = await api.get(`/admin/wa-agent/${tenantId}/products`);
      setProducts(res.data.products || res.data || []);
    } catch { setProducts([]); }
    setProductsLoading(false);
  }

  async function saveProduct() {
    if (!productForm) return;
    setProductSaving(true);
    try {
      const isEdit = !!productForm._id;
      if (isEdit) {
        await api.patch(`/admin/wa-agent/${tenantId}/products/${productForm._id}`, productForm);
      } else {
        await api.post(`/admin/wa-agent/${tenantId}/products`, productForm);
      }
      setProductForm(null);
      showToast(isEdit ? 'Product updated' : 'Product created');
      await loadProducts();
    } catch (e: any) { showToast(e?.response?.data?.error || 'Save failed'); }
    setProductSaving(false);
  }

  async function deleteProduct(productId: string, name: string) {
    setConfirm({
      title: 'Delete Product',
      message: `Delete "${name}"? This cannot be undone.`,
      verifyText: name,
      confirmLabel: 'Delete',
      confirmClass: 'btn-danger',
      level: 'danger',
      onConfirm: async () => {
        await api.delete(`/admin/wa-agent/${tenantId}/products/${productId}`);
        setConfirm(null);
        showToast('Product deleted');
        await loadProducts();
      },
    });
  }

  async function loadPortalUsers() {
    setPortalUsersLoading(true);
    try {
      const res = await api.get(`/admin/wa-agent/${tenantId}/portal-users`);
      setPortalUsers(res.data.users || res.data || []);
    } catch { setPortalUsers([]); }
    setPortalUsersLoading(false);
  }

  async function createPortalUser() {
    if (!newUserForm) return;
    setNewUserSaving(true);
    try {
      const res = await api.post(`/admin/wa-agent/${tenantId}/portal-users`, newUserForm);
      const { password, name } = res.data;
      setNewUserForm(null);
      showToast('Portal user created');
      if (password) setOneTimePassword({ name: name || newUserForm.name, password });
      await loadPortalUsers();
    } catch (e: any) { showToast(e?.response?.data?.error || 'Create failed'); }
    setNewUserSaving(false);
  }

  async function resetPassword(userId: string, userName: string) {
    try {
      const res = await api.patch(`/admin/wa-agent/${tenantId}/portal-users/${userId}/reset-password`, {});
      const { password } = res.data;
      showToast('Password reset');
      if (password) setOneTimePassword({ name: userName, password });
    } catch (e: any) { showToast(e?.response?.data?.error || 'Reset failed'); }
  }

  async function disableUser(userId: string, userName: string) {
    setConfirm({
      title: 'Disable Portal User',
      message: `Disable "${userName}"? They will lose access to the portal immediately.`,
      verifyText: userName,
      confirmLabel: 'Disable',
      confirmClass: 'btn-danger',
      level: 'danger',
      onConfirm: async () => {
        await api.patch(`/admin/wa-agent/${tenantId}/portal-users/${userId}/disable`, {});
        setConfirm(null);
        showToast('User disabled');
        await loadPortalUsers();
      },
    });
  }

  async function loadPaymentRules() {
    setPaymentRulesLoading(true);
    try {
      const res = await api.get(`/admin/wa-agent/${tenantId}/payment-rules`);
      setPaymentRules(res.data);
    } catch { setPaymentRules(null); }
    setPaymentRulesLoading(false);
  }

  async function savePaymentRules() {
    if (!paymentRulesDraft) return;
    setPaymentRulesSaving(true);
    try {
      await api.patch(`/admin/wa-agent/${tenantId}/payment-rules`, paymentRulesDraft);
      setPaymentRules(paymentRulesDraft);
      setPaymentRulesDraft(null);
      showToast('Payment rules saved');
    } catch (e: any) { showToast(e?.response?.data?.error || 'Save failed'); }
    setPaymentRulesSaving(false);
  }

  async function rotateToken() {
    if (!tokenForm) return;
    setTokenSaving(true);
    try {
      await api.patch(`/admin/wa-agent/${tenantId}/token`, tokenForm);
      setTokenForm(null);
      showToast('Token updated');
      await loadDetail();
    } catch (e: any) { showToast(e?.response?.data?.error || 'Token update failed'); }
    setTokenSaving(false);
  }

  if (detailLoading) return (
    <div className="animate-fade-in" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
  );

  if (!detail) return (
    <div className="animate-fade-in">
      <Link href="/superadmin/wa-agent" className="btn btn-ghost btn-sm" style={{ marginBottom: 16, display: 'inline-flex' }}>← Back</Link>
      <div className="empty-state" style={{ padding: 60 }}>
        <div className="empty-icon">💬</div>
        <div className="empty-title">Agent not found or not provisioned</div>
      </div>
    </div>
  );

  const portalUrl = detail.portalUrl || PORTAL_BASE;

  return (
    <div className="animate-fade-in">
      {toast && <div className="toast toast-default">{toast}</div>}
      {confirm && <ConfirmModal state={confirm} onCancel={() => setConfirm(null)} />}

      {/* One-time password modal */}
      {oneTimePassword && (
        <div className="modal-backdrop" onClick={() => setOneTimePassword(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">One-time Password</div>
                <div className="modal-sub">Show this to {oneTimePassword.name} — it will not be shown again</div>
              </div>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', flex: 1 }}>{oneTimePassword.password}</span>
                <CopyButton text={oneTimePassword.password} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setOneTimePassword(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <Link href="/superadmin/wa-agent" className="btn btn-ghost btn-sm" style={{ marginBottom: 8, display: 'inline-flex' }}>
        ← WhatsApp Agent
      </Link>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{detail.businessName || detail.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>Portal URL</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)' }}>{portalUrl}</span>
            <CopyButton text={portalUrl} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`badge ${detail.status === 'active' ? 'badge-green' : detail.status === 'suspended' ? 'badge-red' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
            {detail.status || 'unknown'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', padding: '9px 16px', fontSize: 13, cursor: 'pointer',
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-4)',
              borderBottom: tab === t.id ? '2px solid var(--ink)' : '2px solid transparent',
              fontWeight: tab === t.id ? 600 : 400, whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Connection tab ── */}
      {tab === 'connection' && (
        <div className="admin-card">
          <div className="card-header">
            <div className="card-title">Connection</div>
            {canEdit && !tokenForm && (
              <button className="btn btn-outline btn-sm" onClick={() => setTokenForm({ metaWhatsappToken: '', phoneNumberId: '', whatsappBusinessAccountId: '' })}>
                Rotate Token
              </button>
            )}
          </div>
          <div className="card-body">
            {[
              ['Phone Number ID',        detail.phoneNumberId            ],
              ['WABA ID',               detail.whatsappBusinessAccountId],
              ['Status',                detail.status                   ],
              ['Last Webhook',          fmtDate(detail.lastWebhookAt)   ],
              ['Connected At',          fmtDate(detail.createdAt)       ],
              ['Messages (30d)',        detail.messageCount30d ?? '—'  ],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 12, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                <span style={{ color: 'var(--ink-4)' }}>{k}</span>
                <span style={{ fontFamily: ['Phone Number ID', 'WABA ID'].includes(k as string) ? 'var(--font-mono)' : undefined, fontSize: ['Phone Number ID', 'WABA ID'].includes(k as string) ? 12 : 13, color: 'var(--ink)', fontWeight: 500 }}>
                  {v?.toString() || '—'}
                </span>
              </div>
            ))}

            {tokenForm && canEdit && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>Rotate Credentials</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {([
                    ['Access Token *', 'metaWhatsappToken',          'password', 'New system user access token (EAAx…)'],
                    ['Phone Number ID', 'phoneNumberId',              'text',     'Leave blank to keep current'],
                    ['WABA ID',         'whatsappBusinessAccountId',  'text',     'Leave blank to keep current'],
                  ] as [string, string, string, string][]).map(([label, field, type, placeholder]) => (
                    <div key={field} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{label}</span>
                      <input
                        className="admin-input" type={type}
                        style={{ fontSize: 12, padding: '4px 8px', fontFamily: field !== 'metaWhatsappToken' ? 'var(--font-mono)' : undefined }}
                        placeholder={placeholder}
                        value={tokenForm[field] || ''}
                        onChange={e => setTokenForm((f: any) => ({ ...f, [field]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setTokenForm(null)} disabled={tokenSaving}>Cancel</button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setConfirm({
                      title: 'Rotate Token',
                      message: `Update the WhatsApp credentials for ${detail.businessName || detail.name}?`,
                      detail: 'The agent will immediately use the new token for all outbound messages.',
                      verifyText: detail.businessName || detail.name,
                      confirmLabel: 'Rotate Token',
                      confirmClass: 'btn-primary',
                      level: 'warning',
                      onConfirm: async () => { setConfirm(null); await rotateToken(); },
                    })}
                    disabled={tokenSaving || !tokenForm.metaWhatsappToken}
                  >
                    {tokenSaving ? <><span className="spinner" />Saving…</> : 'Apply'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Agent Settings tab ── */}
      {tab === 'settings' && (
        <div className="admin-card">
          <div className="card-header">
            <div className="card-title">Agent Settings</div>
            {canEdit && settings && !settingsDraft && (
              <button className="btn btn-outline btn-sm" onClick={() => setSettingsDraft({ ...settings })}>Edit</button>
            )}
          </div>
          <div className="card-body">
            {settingsLoading && <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>}
            {!settingsLoading && !settings && <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>No settings found</div>}
            {!settingsLoading && settings && !settingsDraft && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(settings).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--ink-4)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v ?? '—')}</span>
                  </div>
                ))}
              </div>
            )}
            {settingsDraft && canEdit && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.keys(settingsDraft).map(k => {
                  const val = settingsDraft[k];
                  return (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-4)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                      {typeof val === 'boolean' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input type="checkbox" checked={settingsDraft[k]} onChange={e => setSettingsDraft((d: any) => ({ ...d, [k]: e.target.checked }))} />
                          <span style={{ fontSize: 12 }}>{settingsDraft[k] ? 'Enabled' : 'Disabled'}</span>
                        </label>
                      ) : (
                        <input
                          className="admin-input"
                          style={{ fontSize: 12, padding: '4px 8px' }}
                          value={settingsDraft[k] ?? ''}
                          onChange={e => setSettingsDraft((d: any) => ({ ...d, [k]: e.target.value }))}
                        />
                      )}
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSettingsDraft(null)} disabled={settingsSaving}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={saveSettings} disabled={settingsSaving}>
                    {settingsSaving ? <><span className="spinner" />Saving…</> : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Products tab ── */}
      {tab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {canEdit && !productForm && (
              <button className="btn btn-primary btn-sm" onClick={() => setProductForm({ name: '', description: '', price: '', active: true })}>
                + Add Product
              </button>
            )}
          </div>

          {productForm && canEdit && (
            <div className="admin-card">
              <div className="card-header">
                <div className="card-title">{productForm._id ? 'Edit Product' : 'New Product'}</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Name *', 'name', 'text'],
                  ['Description', 'description', 'text'],
                  ['Price', 'price', 'number'],
                ].map(([label, field, type]) => (
                  <div key={field} className="input-group">
                    <label className="input-label">{label}</label>
                    <input className="admin-input" type={type} value={productForm[field] ?? ''} onChange={e => setProductForm((f: any) => ({ ...f, [field]: e.target.value }))} />
                  </div>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!productForm.active} onChange={e => setProductForm((f: any) => ({ ...f, active: e.target.checked }))} />
                  Active
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setProductForm(null)} disabled={productSaving}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={saveProduct} disabled={productSaving || !productForm.name?.trim()}>
                    {productSaving ? <><span className="spinner" />Saving…</> : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="admin-card">
            {productsLoading ? (
              <div className="card-body" style={{ textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>
            ) : (
              <div className="table-shell">
                <table className="admin-table">
                  <thead><tr><th>Name</th><th>Description</th><th>Price</th><th>Status</th>{canEdit && <th></th>}</tr></thead>
                  <tbody>
                    {products.map((p: any) => (
                      <tr key={p._id || p.productId}>
                        <td className="cell-main">{p.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--ink-4)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.price != null ? `₹${p.price}` : '—'}</td>
                        <td><span className={`badge ${p.active ? 'badge-green' : 'badge-gray'}`}>{p.active ? 'Active' : 'Inactive'}</span></td>
                        {canEdit && (
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => setProductForm({ ...p })}>Edit</button>
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteProduct(p._id || p.productId, p.name)}>Delete</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={canEdit ? 5 : 4} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-4)' }}>No products yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Portal Users tab ── */}
      {tab === 'portal-users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {canEdit && !newUserForm && (
              <button className="btn btn-primary btn-sm" onClick={() => setNewUserForm({ name: '', email: '', role: 'admin' })}>
                + Create User
              </button>
            )}
          </div>

          {newUserForm && canEdit && (
            <div className="admin-card">
              <div className="card-header"><div className="card-title">New Portal User</div></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="input-group">
                    <label className="input-label">Name *</label>
                    <input className="admin-input" value={newUserForm.name} onChange={e => setNewUserForm((f: any) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email *</label>
                    <input className="admin-input" type="email" value={newUserForm.email} onChange={e => setNewUserForm((f: any) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Role</label>
                  <select className="admin-input" value={newUserForm.role} onChange={e => setNewUserForm((f: any) => ({ ...f, role: e.target.value }))}>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-4)', margin: 0 }}>A one-time password will be generated and shown once after creation.</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setNewUserForm(null)} disabled={newUserSaving}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={createPortalUser} disabled={newUserSaving || !newUserForm.name?.trim() || !newUserForm.email?.trim()}>
                    {newUserSaving ? <><span className="spinner" />Creating…</> : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="admin-card">
            {portalUsersLoading ? (
              <div className="card-body" style={{ textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>
            ) : (
              <div className="table-shell">
                <table className="admin-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th>{canEdit && <th></th>}</tr></thead>
                  <tbody>
                    {portalUsers.map((u: any) => (
                      <tr key={u._id || u.userId}>
                        <td className="cell-main">{u.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.email}</td>
                        <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{u.role || '—'}</span></td>
                        <td><span className={`badge ${u.active !== false ? 'badge-green' : 'badge-red'}`}>{u.active !== false ? 'Active' : 'Disabled'}</span></td>
                        {canEdit && (
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => resetPassword(u._id || u.userId, u.name)}>Reset PW</button>
                              {u.active !== false && (
                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => disableUser(u._id || u.userId, u.name)}>Disable</button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {portalUsers.length === 0 && (
                      <tr><td colSpan={canEdit ? 5 : 4} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-4)' }}>No portal users yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Payment Rules tab ── */}
      {tab === 'payment-rules' && (
        <div className="admin-card">
          <div className="card-header">
            <div className="card-title">Payment Rules</div>
            {canEdit && paymentRules && !paymentRulesDraft && (
              <button className="btn btn-outline btn-sm" onClick={() => setPaymentRulesDraft({ ...paymentRules })}>Edit</button>
            )}
          </div>
          <div className="card-body">
            {paymentRulesLoading && <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>}
            {!paymentRulesLoading && !paymentRules && <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>No payment rules found</div>}
            {!paymentRulesLoading && paymentRules && !paymentRulesDraft && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(paymentRules).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--ink-4)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{typeof v === 'boolean' ? (v ? 'Enabled' : 'Disabled') : String(v ?? '—')}</span>
                  </div>
                ))}
              </div>
            )}
            {paymentRulesDraft && canEdit && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.keys(paymentRulesDraft).map(k => {
                  const val = paymentRulesDraft[k];
                  return (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-4)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                      {typeof val === 'boolean' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input type="checkbox" checked={paymentRulesDraft[k]} onChange={e => setPaymentRulesDraft((d: any) => ({ ...d, [k]: e.target.checked }))} />
                          <span style={{ fontSize: 12 }}>{paymentRulesDraft[k] ? 'Enabled' : 'Disabled'}</span>
                        </label>
                      ) : (
                        <input
                          className="admin-input"
                          type={typeof val === 'number' ? 'number' : 'text'}
                          style={{ fontSize: 12, padding: '4px 8px' }}
                          value={paymentRulesDraft[k] ?? ''}
                          onChange={e => setPaymentRulesDraft((d: any) => ({ ...d, [k]: typeof val === 'number' ? Number(e.target.value) : e.target.value }))}
                        />
                      )}
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPaymentRulesDraft(null)} disabled={paymentRulesSaving}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={savePaymentRules} disabled={paymentRulesSaving}>
                    {paymentRulesSaving ? <><span className="spinner" />Saving…</> : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
