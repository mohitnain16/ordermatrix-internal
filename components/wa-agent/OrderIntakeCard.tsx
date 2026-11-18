'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { SkRows } from '../ui/Skeleton';

type PulseTenant = { id: string; name: string; phone: string; phoneNumberId: string; active: boolean; orderIntake: boolean };

// Which Pulse WhatsApp number sellers message to create quick orders. Listed by number
// because that number's Pulse tenant may not be linked to any Ordermatrix tenant.
// One number at a time: switching one on switches the others off.
export default function OrderIntakeCard() {
  const [rows, setRows] = useState<PulseTenant[] | null>(null);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/wa-agent/order-intake');
      setRows(res.data.tenants || []);
      setError('');
    } catch {
      setRows([]);
      setError('Could not load WhatsApp numbers from Pulse.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(t: PulseTenant) {
    setSavingId(t.id);
    setError('');
    try {
      await api.patch(`/admin/wa-agent/order-intake/${t.id}`, { enabled: !t.orderIntake });
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Could not change the order intake number.');
    }
    setSavingId('');
  }

  const current = rows?.find((t) => t.orderIntake);

  return (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <div>
          <div className="card-title">Order intake number</div>
          <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>
            Sellers message this number to create quick orders. Only one number can be on.
            {rows && (current ? ` Currently: ${current.phone || current.name}.` : ' Currently off.')}
          </div>
        </div>
      </div>
      {error && <div role="alert" style={{ padding: '8px 16px', fontSize: 12, color: 'var(--red)' }}>{error}</div>}
      <div className="table-shell">
        <table className="admin-table">
          <thead>
            <tr><th>Pulse tenant</th><th>WhatsApp number</th><th>Order intake</th></tr>
          </thead>
          <tbody>
            {rows === null ? (
              <SkRows rows={2} cols={3} />
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} style={{ fontSize: 13, color: 'var(--ink-4)' }}>No Pulse tenants found.</td></tr>
            ) : rows.map((t) => (
              <tr key={t.id}>
                <td data-label="Pulse tenant">
                  <span className="cell-main">{t.name}</span>
                  {!t.active && <span className="badge badge-gray" style={{ marginLeft: 6, fontSize: 10 }}>inactive</span>}
                </td>
                <td data-label="WhatsApp number" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {t.phone || (t.phoneNumberId ? `ID ${t.phoneNumberId}` : 'No number connected')}
                </td>
                <td data-label="Order intake">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={t.orderIntake}
                    aria-label={`Order intake for ${t.name}`}
                    disabled={savingId !== '' || !t.phoneNumberId}
                    onClick={() => toggle(t)}
                    className={`btn btn-sm ${t.orderIntake ? 'btn-primary' : 'btn-outline'}`}
                    style={{ minWidth: 64 }}
                  >
                    {savingId === t.id ? 'Saving…' : t.orderIntake ? 'On' : 'Off'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
