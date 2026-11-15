'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../../lib/api';
import { Sk, SkRows } from '../../../../components/ui/Skeleton';

interface TemplateRow { status: string; template: string; enabled: boolean }
interface Config { masterEnabled: boolean; templates: TemplateRow[] }

function Toggle({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', width: 40, height: 22, borderRadius: 999, border: 0, padding: 0,
        background: checked ? 'var(--green, #16a34a)' : 'var(--line, #d4d4d8)',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
        transition: 'background .15s', flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.25)', transition: 'left .15s',
        }}
      />
    </button>
  );
}

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
        <>
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="card-header flex-between">
              <div style={{ flex: 1 }}>
                <Sk w="220px" h={14} mb={8} />
                <Sk w="340px" h={11} />
              </div>
              <Sk w={40} h={22} r={999} />
            </div>
          </div>
          <div className="admin-card">
            <table className="admin-table">
              <thead>
                <tr><th>Order status</th><th>Template</th><th>Send</th></tr>
              </thead>
              <tbody>
                <SkRows n={7} cols={3} />
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="card-header flex-between">
              <div>
                <strong>Customer order notifications</strong>
                <p className="page-sub">Master switch. When off, no order message is sent for any status.</p>
              </div>
              <Toggle label="Customer order notifications" checked={cfg.masterEnabled} disabled={saving === 'master'} onChange={(v) => save('master', { masterEnabled: v })} />
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
                      <Toggle label={LABELS[t.status] || t.status} checked={t.enabled} disabled={saving === t.status} onChange={(v) => save(t.status, { statuses: { [t.status]: v } })} />
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
