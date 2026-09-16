'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';

interface OmTenant {
  _id: string;
  businessName: string;
  email: string;
  phone: string;
  planId: string;
  isActive: boolean;
  waAgentTenantId: string | null;
  createdAt: string;
}

interface ProvisionForm {
  name: string;
  phoneNumberId: string;
  whatsappBusinessAccountId: string;
  metaWhatsappToken: string;
  metaWebhookSecret: string;
  displayName: string;
}

interface BulkEntry {
  tenantId: string;
  name: string;
  phoneNumberId: string;
  whatsappBusinessAccountId: string;
  metaWhatsappToken: string;
  metaWebhookSecret?: string;
  businessInfo: { displayName: string };
  courierTemplates?: Record<string, string>;
}

interface BulkResult {
  tenantId: string;
  businessName?: string;
  success: boolean;
  skipped?: boolean;
  waAgentTenantId?: string;
  error?: string;
  warning?: string;
}

const EMPTY_FORM: ProvisionForm = {
  name: '',
  phoneNumberId: '',
  whatsappBusinessAccountId: '',
  metaWhatsappToken: '',
  metaWebhookSecret: '',
  displayName: '',
};

const BULK_SCHEMA_HINT = `[
  {
    "tenantId":                   "64abc...",
    "name":                       "Tenant Name",
    "phoneNumberId":              "1234567890",
    "whatsappBusinessAccountId":  "9876543210",
    "metaWhatsappToken":          "EAAx...",
    "metaWebhookSecret":          "",
    "businessInfo":               { "displayName": "Display Name" },
    "courierTemplates": {
      "default":    "dispatch_default",
      "delhivery":  "dispatch_delhivery",
      "shiprocket": "",
      "dtdc":       "",
      "ekart":      "",
      "bluedart":   ""
    }
  }
]`;

type BulkStep = 'idle' | 'editing' | 'reviewing' | 'done';

export default function WaAgentPage() {
  const [tenants, setTenants] = useState<OmTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<OmTenant | null>(null);
  const [form, setForm] = useState<ProvisionForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [bulkStep, setBulkStep] = useState<BulkStep>('idle');
  const [bulkJson, setBulkJson] = useState('');
  const [bulkParsed, setBulkParsed] = useState<BulkEntry[]>([]);
  const [bulkParseError, setBulkParseError] = useState('');
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/wa-agent/tenants');
      setTenants(res.data.tenants);
    } catch { /**/ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openProvision(tenant: OmTenant) {
    setForm({ ...EMPTY_FORM, name: tenant.businessName, displayName: tenant.businessName });
    setError('');
    setModal(tenant);
  }

  async function provision(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/wa-agent/provision', {
        tenantId: modal._id,
        name: form.name,
        phoneNumberId: form.phoneNumberId,
        whatsappBusinessAccountId: form.whatsappBusinessAccountId,
        metaWhatsappToken: form.metaWhatsappToken,
        metaWebhookSecret: form.metaWebhookSecret || undefined,
        businessInfo: { displayName: form.displayName },
      });
      setModal(null);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Provisioning failed');
    }
    setSaving(false);
  }

  function parseBulkJson() {
    setBulkParseError('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(bulkJson);
    } catch (err: any) {
      setBulkParseError('Invalid JSON: ' + err.message);
      return;
    }
    if (!Array.isArray(parsed)) { setBulkParseError('Input must be a JSON array'); return; }
    if (parsed.length === 0) { setBulkParseError('Array is empty'); return; }
    if (parsed.length > 50) { setBulkParseError('Maximum 50 entries per batch'); return; }

    const issues: string[] = [];
    const required = ['tenantId', 'name', 'phoneNumberId', 'whatsappBusinessAccountId', 'metaWhatsappToken'] as const;
    (parsed as any[]).forEach((entry, i) => {
      const missing = required.filter(f => !entry[f]);
      if (!entry.businessInfo?.displayName) missing.push('businessInfo.displayName' as any);
      if (missing.length > 0) issues.push(`Entry ${i + 1} (${entry.tenantId || 'no id'}): missing ${missing.join(', ')}`);
    });
    if (issues.length > 0) { setBulkParseError(issues.join('\n')); return; }

    setBulkParsed(parsed as BulkEntry[]);
    setBulkStep('reviewing');
  }

  async function runBulkProvision() {
    setBulkSaving(true);
    setBulkParseError('');
    try {
      const res = await api.post('/admin/wa-agent/bulk-provision', { tenants: bulkParsed });
      setBulkResults(res.data.results);
      setBulkStep('done');
      load();
    } catch (err: any) {
      setBulkParseError(err.response?.data?.error || 'Bulk provision request failed');
    }
    setBulkSaving(false);
  }

  function resetBulk() {
    setBulkStep('idle');
    setBulkJson('');
    setBulkParsed([]);
    setBulkParseError('');
    setBulkResults([]);
  }

  const provisioned = tenants.filter(t => t.waAgentTenantId).length;
  const tenantMap = Object.fromEntries(tenants.map(t => [t._id, t]));

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">WhatsApp Agent</h1>
          <p className="page-sub">{provisioned} of {tenants.length} tenants provisioned</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {bulkStep !== 'idle' ? (
            <button className="btn btn-ghost btn-sm" onClick={resetBulk}>← Back to list</button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setBulkStep('editing'); setBulkParseError(''); }}>
                Bulk Provision
              </button>
            </>
          )}
        </div>
      </div>

      {bulkStep !== 'idle' && (
        <div className="animate-fade-in">

          {bulkStep === 'editing' && (
            <div className="admin-card">
              <div className="card-header">
                <div className="card-title">Bulk Provision — JSON Payload</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <details style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                  <summary style={{ cursor: 'pointer', marginBottom: 6 }}>Schema reference (expand)</summary>
                  <pre style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '10px 12px', overflowX: 'auto', fontSize: 11, lineHeight: 1.6, marginTop: 8 }}>{BULK_SCHEMA_HINT}</pre>
                </details>
                <textarea
                  className="admin-input"
                  rows={16}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical' }}
                  placeholder="Paste JSON array here…"
                  value={bulkJson}
                  onChange={e => { setBulkJson(e.target.value); setBulkParseError(''); }}
                />
                {bulkParseError && (
                  <pre style={{ color: 'var(--red)', fontSize: 12, background: 'var(--surface-2)', borderRadius: 6, padding: '8px 10px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>{bulkParseError}</pre>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" onClick={parseBulkJson} disabled={!bulkJson.trim()}>
                    Parse & Review →
                  </button>
                </div>
              </div>
            </div>
          )}

          {bulkStep === 'reviewing' && (
            <div className="admin-card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">{bulkParsed.length} tenant{bulkParsed.length !== 1 ? 's' : ''} queued</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setBulkStep('editing')} disabled={bulkSaving}>Edit JSON</button>
                  <button className="btn btn-primary btn-sm" onClick={runBulkProvision} disabled={bulkSaving}>
                    {bulkSaving ? <><span className="spinner" /> Provisioning…</> : 'Provision Batch'}
                  </button>
                </div>
              </div>
              <div className="table-shell">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Phone Number ID</th>
                      <th>WABA ID</th>
                      <th>Templates</th>
                      <th>Will</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkParsed.map((entry, i) => {
                      const matched = tenantMap[entry.tenantId];
                      const alreadyProvisioned = !!matched?.waAgentTenantId;
                      const templateCount = Object.values(entry.courierTemplates || {}).filter(Boolean).length;
                      return (
                        <tr key={i}>
                          <td>
                            <span className="cell-main">{matched?.businessName || entry.name}</span>
                            {!matched && <span className="badge badge-gray" style={{ marginLeft: 6, fontSize: 10 }}>id not in list</span>}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{entry.phoneNumberId}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{entry.whatsappBusinessAccountId}</td>
                          <td>
                            {templateCount > 0
                              ? <span className="badge badge-green">{templateCount} set</span>
                              : <span className="badge badge-gray">none</span>}
                          </td>
                          <td>
                            {alreadyProvisioned
                              ? <span className="badge badge-gray">Skip (already provisioned)</span>
                              : <span className="badge badge-green">Provision</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {bulkParseError && (
                <div style={{ padding: '0 16px 12px', color: 'var(--red)', fontSize: 12 }}>{bulkParseError}</div>
              )}
            </div>
          )}

          {bulkStep === 'done' && (() => {
            const succeeded = bulkResults.filter(r => r.success).length;
            const skipped  = bulkResults.filter(r => r.skipped).length;
            const failed   = bulkResults.filter(r => !r.success && !r.skipped).length;
            return (
              <div className="admin-card">
                <div className="card-header">
                  <div className="card-title">
                    Results — {succeeded} succeeded · {skipped} skipped · {failed} failed
                  </div>
                </div>
                <div className="table-shell">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tenant</th>
                        <th>Result</th>
                        <th>WA Agent ID</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResults.map((r, i) => (
                        <tr key={i}>
                          <td><span className="cell-main">{r.businessName || r.tenantId}</span></td>
                          <td>
                            {r.success
                              ? <span className="badge badge-green">{r.warning ? 'Partial' : 'Success'}</span>
                              : r.skipped
                              ? <span className="badge badge-gray">Skipped</span>
                              : <span className="badge badge-gray" style={{ color: 'var(--red)' }}>Failed</span>}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{r.waAgentTenantId || '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{r.warning || r.error || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {bulkStep === 'idle' && (
        <div className="admin-card">
          <div className="table-shell">
            <table className="admin-table mobile-cards">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>WA Agent Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? <SkRows rows={8} cols={5} /> : (
                  <>
                    {tenants.map(t => (
                      <tr key={t._id}>
                        <td data-label="Business"><span className="cell-main">{t.businessName}</span></td>
                        <td data-label="Email" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.email}</td>
                        <td data-label="Plan"><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{t.planId}</span></td>
                        <td data-label="WA Status">
                          {t.waAgentTenantId
                            ? <span className="badge badge-green">Connected</span>
                            : <span className="badge badge-gray">Not Provisioned</span>}
                        </td>
                        <td>
                          {t.waAgentTenantId
                            ? <Link href={`/superadmin/wa-agent/${t._id}`} className="btn btn-ghost btn-sm">Stats →</Link>
                            : <button className="btn btn-ghost btn-sm" onClick={() => openProvision(t)}>Provision</button>}
                        </td>
                      </tr>
                    ))}
                    {tenants.length === 0 && (
                      <tr><td colSpan={5}>
                        <div className="empty-state">
                          <div className="empty-state-icon">💬</div>
                          <div className="empty-state-title">No tenants found</div>
                        </div>
                      </td></tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Provision WA Agent</h2>
                <p className="modal-sub">{modal.businessName}</p>
              </div>
            </div>
            <form onSubmit={provision}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="input-group">
                  <label className="form-label">Agent Name</label>
                  <input className="admin-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label className="form-label">Business Display Name</label>
                  <input className="admin-input" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label className="form-label">Phone Number ID</label>
                  <input className="admin-input" placeholder="Meta phone_number_id" value={form.phoneNumberId} onChange={e => setForm(f => ({ ...f, phoneNumberId: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label className="form-label">WhatsApp Business Account ID</label>
                  <input className="admin-input" placeholder="Meta waba_id" value={form.whatsappBusinessAccountId} onChange={e => setForm(f => ({ ...f, whatsappBusinessAccountId: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label className="form-label">Meta WhatsApp Token</label>
                  <input className="admin-input" type="password" placeholder="EAAx..." value={form.metaWhatsappToken} onChange={e => setForm(f => ({ ...f, metaWhatsappToken: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label className="form-label">
                    Webhook Verify Token <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input className="admin-input" value={form.metaWebhookSecret} onChange={e => setForm(f => ({ ...f, metaWebhookSecret: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Provisioning…' : 'Provision'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
