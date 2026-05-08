'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

interface PulseData {
  totalTenants: number; activeTenants: number; trialTenants: number;
  newTenantsThisMonth: number; totalOrders: number; ordersToday: number;
  paidTenants: number; totalUsers: number; mrr: number; arr: number;
  planBreakdown: { _id: string; count: number }[];
  recentTenants: { _id: string; businessName: string; email: string; planId: string; createdAt: string; ordersThisMonth: number }[];
}

function StatCard({ label, value, sub, color = '#e8593a' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const PLAN_COLOR: Record<string, string> = {
  trial: '#9ca3af', founding: '#b45309', starter: '#2563eb', growth: '#16a34a', pro: '#7c3aed',
};

export default function PulsePage() {
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/pulse');
      setData(res.data);
    } catch { /**/ }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-4)' }}>Loading platform pulse…</div>;
  if (!data) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--red)' }}>Failed to load data</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Platform Pulse</h1>
          <p className="page-sub">Real-time overview of all tenants and revenue</p>
        </div>
        <button onClick={load} className="btn btn-ghost btn-sm">Refresh</button>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Tenants" value={data.totalTenants} sub={`${data.activeTenants} active`} color="var(--ink)" />
        <StatCard label="MRR" value={fmt(data.mrr)} sub={`ARR ${fmt(data.arr)}`} color="var(--green)" />
        <StatCard label="Paid Tenants" value={data.paidTenants} sub={`${data.trialTenants} on trial`} color="var(--blue)" />
        <StatCard label="Orders Today" value={data.ordersToday} sub={`${data.totalOrders.toLocaleString('en-IN')} total`} color="var(--accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="New This Month" value={data.newTenantsThisMonth} color="var(--purple)" />
        <StatCard label="Total Users" value={data.totalUsers} color="var(--ink-2)" />
        <StatCard label="Trial Tenants" value={data.trialTenants} color="var(--gold)" />
        <StatCard label="Total Orders" value={data.totalOrders.toLocaleString('en-IN')} color="var(--ink-3)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Plan Breakdown */}
        <div className="admin-card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>Plan Breakdown</div>
          <div style={{ padding: '12px 18px' }}>
            {data.planBreakdown.map(p => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLAN_COLOR[p._id] || '#9ca3af' }} />
                  <span style={{ fontSize: 13, color: 'var(--ink-2)', textTransform: 'capitalize' }}>{p._id}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tenants */}
        <div className="admin-card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>Recent Signups</span>
            <Link href="/superadmin/tenants" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div>
            {data.recentTenants.map(t => (
              <Link key={t._id} href={`/superadmin/tenants/${t._id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid var(--line)', textDecoration: 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{t.businessName}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{t.email} · {fmtDate(t.createdAt)}</div>
                </div>
                <span className={`badge badge-${t.planId === 'trial' ? 'gray' : t.planId === 'pro' ? 'purple' : 'blue'}`} style={{ textTransform: 'capitalize' }}>
                  {t.planId}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
