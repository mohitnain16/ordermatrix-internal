'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../../lib/api';

interface TemplateRow { status: string; template: string; enabled: boolean }
interface Config { masterEnabled: boolean; templates: TemplateRow[] }

const LABELS: Record<string, string> = {
  new: 'Order placed',
  confirmed: 'Order confirmed',
  processing: 'Packed',
  ready_to_dispatch: 'Out for delivery',
  dispatched: 'Dispatched / shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function WaTemplatesPage() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/wa-templates');
      setCfg(res.data);
      setError('');
    } catch {
      setError('Failed to load template settings');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(key: string, body: object) {
    setSaving(key);
    try {
      const res = await api.put('/admin/wa-templates', body);
      setCfg(res.data);
      setError('');
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">WhatsApp Templates</h1>
          <p className="page-sub">Choose which order-status messages are sent to customers. Changes apply within ~30 seconds.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      {error && <p style={{ color: 'var(--red, #c00)', marginBottom: 12 }}>{error}</p>}
      {!cfg ? (
        <p>Loading…</p>
      ) : (
        <>
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="card-header flex-between">
              <div>
                <strong>Customer order notifications</strong>
                <p className="page-sub">Master switch. When off, no order message is sent for any status.</p>
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={cfg.masterEnabled}
                  disabled={saving === 'master'}
                  onChange={(e) => save('master', { masterEnabled: e.target.checked })}
                />
                {cfg.masterEnabled ? 'On' : 'Off'}
              </label>
            </div>
          </div>

          <div className="admin-card">
            <table className="admin-table">
              <thead>
                <tr><th>Order status</th><th>Template</th><th>Send</th></tr>
              </thead>
              <tbody>
                {cfg.templates.map((t) => (
                  <tr key={t.status}>
                    <td><span className="cell-main">{LABELS[t.status] || t.status}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.template}</td>
                    <td>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={t.enabled}
                          disabled={saving === t.status}
                          onChange={(e) => save(t.status, { statuses: { [t.status]: e.target.checked } })}
                        />
                        {t.enabled ? 'On' : 'Off'}
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
