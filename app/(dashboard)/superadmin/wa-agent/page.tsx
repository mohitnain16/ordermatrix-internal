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

const EMPTY_FORM: ProvisionForm = {
  name: '',
  phoneNumberId: '',
  whatsappBusinessAccountId: '',
  metaWhatsappToken: '',
  metaWebhookSecret: '',
  displayName: '',
};

export default function WaAgentPage() {
  const [tenants, setTenants] = useState<OmTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<OmTenant | null>(null);
  const [form, setForm] = useState<ProvisionForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const provisioned = tenants.filter(t => t.waAgentTenantId).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">WhatsApp Agent</h1>
          <p className="page-sub">{provisioned} of {tenants.length} tenants provisioned</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

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

      {/* Provision modal */}
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
