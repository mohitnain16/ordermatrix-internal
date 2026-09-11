'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../../lib/api';

interface Stats {
  messageCount: number;
  lastActivityAt: string | null;
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function WaAgentTenantPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/wa-agent/${tenantId}/stats`)
      .then(r => setStats(r.data))
      .catch(err => setStatsError(err.response?.data?.error || 'Could not load stats'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/superadmin/wa-agent" className="btn btn-ghost btn-sm">← Back</Link>
          <div>
            <h1 className="page-title">WA Agent — Tenant Stats</h1>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <span className="section-label">Connection Stats</span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {loading && <span className="cell-sub">Loading…</span>}
          {statsError && <span style={{ color: 'var(--red)', fontSize: 13 }}>{statsError}</span>}
          {stats && (
            <div style={{ display: 'flex', gap: 40 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL MESSAGES</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{stats.messageCount.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>LAST ACTIVITY</div>
                <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)' }}>{fmtDate(stats.lastActivityAt)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
