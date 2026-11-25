'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../../lib/api';
import { Sk } from '../../../../components/ui/Skeleton';

// Hands the signed-in admin over to the Pulse admin console (admin.pulse.ordermatrix.in).
// The API returns a one-time link valid for 30 seconds, so it is fetched on arrival and
// followed at once. Access (superadmin, ops_admin) comes from the /superadmin route guard.
export default function PulseAdminPage() {
  const [error, setError] = useState('');

  const open = useCallback(async () => {
    setError('');
    try {
      const res = await api.post('/admin/pulse/console-sso');
      window.location.assign(res.data.url);
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      setError(status === 503
        ? 'Pulse admin is not set up yet: PULSE_ADMIN_SSO_SECRET is missing on the API.'
        : 'Could not open Pulse admin. Try again.');
    }
  }, []);

  useEffect(() => { open(); }, [open]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Pulse Admin</h1>
        <p className="page-sub">Tenant invites and workspaces for OrderMatrix Pulse</p>
      </div>
      <div className="admin-card" style={{ padding: 24, maxWidth: 520 }}>
        {error ? (
          <>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--ink)' }}>{error}</p>
            <button className="btn btn-primary btn-sm" onClick={open}>Try again</button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-busy="true" aria-label="Opening Pulse admin">
            <Sk w="60%" h={16} />
            <Sk w="40%" h={12} />
          </div>
        )}
      </div>
    </div>
  );
}
