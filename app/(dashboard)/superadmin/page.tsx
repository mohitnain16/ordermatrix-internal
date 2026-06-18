'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { Sk, SkStatCard, SkRows, SkCardHeader } from '../../../components/ui/Skeleton';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

interface PulseData {
  totalTenants: number; activeTenants: number; trialTenants: number;
  newTenantsThisMonth: number; totalOrders: number; ordersToday: number;
  paidTenants: number; totalUsers: number; mrr: number; arr: number;
  planBreakdown: { _id: string; count: number }[];
  recentTenants: { _id: string; businessName: string; email: string; planId: string; createdAt: string; ordersThisMonth: number }[];
}

function StatCard({ label, value, sub, color = 'var(--ink)' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const PLAN_COLOR: Record<string, string> = {
  trial: '#9ca3af', starter: '#6b7280', growth: '#16a34a', scale: '#7c3aed', pro: '#b45309',
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

  if (loading) return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div><Sk w={180} h={22} mb={6} /><Sk w={260} h={13} /></div>
        <Sk w={70} h={30} r={7} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[0,1,2,3].map(i => <SkStatCard key={i} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[0,1,2,3].map(i => <SkStatCard key={i} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="admin-card">
          <SkCardHeader />
          <div className="card-body">
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <Sk w="48%" h={12} /><Sk w={24} h={12} />
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <SkCardHeader />
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ flex: 1 }}><Sk w="55%" h={13} mb={5} /><Sk w="38%" h={10} /></div>
              <Sk w={42} h={20} r={5} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!data) return (
    <div className="empty-state" style={{ padding: 80 }}>
      <div className="empty-state-icon">⚠</div>
      <div className="empty-state-title">Failed to load platform data</div>
      <div className="empty-state-sub">Check your connection and try again</div>
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={load}>Retry</button>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Platform Pulse</h1>
          <p className="page-sub">Real-time overview of all tenants and revenue</p>
        </div>
        <button onClick={load} className="btn btn-ghost btn-sm">Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Tenants"  value={data.totalTenants}  sub={`${data.activeTenants} active`}                 color="var(--ink)" />
        <StatCard label="MRR"            value={fmt(data.mrr)}      sub={`ARR ${fmt(data.arr)}`}                         color="var(--green)" />
        <StatCard label="Paid Tenants"   value={data.paidTenants}   sub={`${data.trialTenants} on trial`}                color="var(--blue)" />
        <StatCard label="Orders Today"   value={data.ordersToday}   sub={`${data.totalOrders.toLocaleString('en-IN')} total`} color="var(--accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="New This Month" value={data.newTenantsThisMonth}               color="var(--purple)" />
        <StatCard label="Total Users"    value={data.totalUsers}                        color="var(--ink-2)" />
        <StatCard label="Trial Tenants"  value={data.trialTenants}                      color="var(--amber)" />
        <StatCard label="Total Orders"   value={data.totalOrders.toLocaleString('en-IN')} color="var(--ink-3)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Plan Breakdown */}
        <div className="admin-card">
          <div className="card-header">
            <span className="card-title">Plan Breakdown</span>
          </div>
          <div className="card-body">
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
          <div className="card-header">
            <span className="card-title">Recent Signups</span>
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
