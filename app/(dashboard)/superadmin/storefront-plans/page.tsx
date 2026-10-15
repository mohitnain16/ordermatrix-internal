'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/api';

type Caps = Record<string, Record<string, boolean | number>>;

const PLAN_ORDER = ['free', 'starter', 'growth', 'pro'];
// Capability key → human label + how to render the value.
const CAP_ROWS: { key: string; label: string; kind: 'bool' | 'num' }[] = [
  { key: 'enabled', label: 'Storefront enabled', kind: 'bool' },
  { key: 'customDomain', label: 'Custom domain', kind: 'bool' },
  { key: 'ownRazorpay', label: 'Own Razorpay keys', kind: 'bool' },
  { key: 'coupons', label: 'Coupons', kind: 'bool' },
  { key: 'combos', label: 'Combos', kind: 'bool' },
  { key: 'reviews', label: 'Reviews', kind: 'bool' },
  { key: 'merchantFeed', label: 'Merchant feed', kind: 'bool' },
  { key: 'maxProducts', label: 'Max products', kind: 'num' },
];

const PLAN_BADGE: Record<string, string> = { free: 'badge-gray', starter: 'badge-gray', growth: 'badge-green', pro: 'badge-gold' };

export default function StorefrontPlansPage() {
  const [caps, setCaps] = useState<Caps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await api.get('/admin/tenants/plan-caps'); setCaps(res.data.caps); }
      catch { /**/ }
      setLoading(false);
    })();
  }, []);

  const plans = caps ? PLAN_ORDER.filter(p => caps[p]) : [];

  const cell = (plan: string, row: typeof CAP_ROWS[number]) => {
    const v = caps?.[plan]?.[row.key];
    if (row.kind === 'num') return <span style={{ fontFamily: 'var(--font-mono)' }}>{(v as number)?.toLocaleString('en-IN') ?? '—'}</span>;
    return v ? <span className="badge badge-green" style={{ fontSize: 10 }}>✓</span> : <span style={{ color: 'var(--ink-4)' }}>—</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Store Plans</h1>
        <p className="page-sub">Storefront capabilities granted by each plan</p>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: 24, color: 'var(--ink-4)' }}>Loading…</div>
        ) : !caps ? (
          <div className="empty-state"><div className="empty-state-title">Could not load plan capabilities</div></div>
        ) : (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  {plans.map(p => (
                    <th key={p} style={{ textAlign: 'center' }}>
                      <span className={`badge ${PLAN_BADGE[p] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{p}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAP_ROWS.map(row => (
                  <tr key={row.key}>
                    <td className="cell-main">{row.label}</td>
                    {plans.map(p => <td key={p} style={{ textAlign: 'center' }}>{cell(p, row)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="page-sub" style={{ marginTop: 16 }}>
        Per-tenant overrides live on each tenant&rsquo;s <strong>Features</strong> tab (Tenants → a tenant → Features).
        This matrix is the plan baseline.
      </p>
    </div>
  );
}
