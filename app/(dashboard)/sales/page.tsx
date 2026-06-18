'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { Sk, SkStatCard, SkRows } from '../../../components/ui/Skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
const fmtL = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`;
  return `₹${n}`;
};

type TrendPoint = { date: string; mrr: number; arr: number; activeCount: number };

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const mrr = payload.find((p: any) => p.dataKey === 'mrr')?.value ?? 0;
  const arr = payload.find((p: any) => p.dataKey === 'arr')?.value ?? 0;
  const activeCount = payload[0]?.payload?.activeCount ?? 0;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--ink-3)' }}>{label ? fmtDate(label) : ''}</div>
      <div style={{ color: 'var(--accent)', marginBottom: 2 }}>MRR: {fmt(mrr)}</div>
      <div style={{ color: 'var(--blue)', marginBottom: 4 }}>ARR: {fmt(arr)}</div>
      <div style={{ color: 'var(--ink-4)' }}>Active paid: {activeCount}</div>
    </div>
  );
}

export default function SalesPage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pipeline' | 'revenue'>('pipeline');
  const [noteModal, setNoteModal] = useState<{ tenantId: string; name: string } | null>(null);
  const [noteText, setNoteText] = useState('');

  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<30 | 90 | 180>(30);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => { load(); }, []);
  useEffect(() => { loadTrend(trendPeriod); }, [trendPeriod]);

  async function load() {
    setLoading(true);
    try {
      const [rev, pipe] = await Promise.all([
        api.get('/admin/sales/revenue'),
        api.get('/admin/sales/pipeline'),
      ]);
      setRevenue(rev.data);
      setPipeline(pipe.data.pipeline);
    } catch { /**/ }
    setLoading(false);
  }

  async function loadTrend(period: number) {
    setTrendLoading(true);
    try {
      const res = await api.get(`/admin/sales/revenue/trend?period=${period}`);
      setTrend(res.data.trend || []);
    } catch { /**/ }
    setTrendLoading(false);
  }

  async function saveNote(tenantId: string) {
    if (!noteText.trim()) return;
    try {
      await api.patch(`/admin/sales/leads/${tenantId}/note`, { followUpNote: noteText, status: 'contacted' });
      setNoteModal(null);
      setNoteText('');
    } catch { /**/ }
  }

  if (loading) return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><Sk w={60} h={22} mb={6} /><Sk w={280} h={13} /></div>
        <Sk w={70} h={30} r={7} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[0,1,2,3,4].map(i => <SkStatCard key={i} />)}
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        <div style={{ padding: '9px 18px' }}><Sk w={100} h={13} /></div>
        <div style={{ padding: '9px 18px' }}><Sk w={110} h={13} /></div>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Business</th><th>Email</th><th>Orders</th><th>Days Left</th><th>Lead Status</th><th>Action</th></tr></thead>
          <tbody><SkRows rows={8} cols={6} /></tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {noteModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ padding: 28, width: 400 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Add Follow-up Note</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-3)' }}>{noteModal.name}</p>
            <textarea rows={4} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Note…" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setNoteModal(null); setNoteText(''); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => saveNote(noteModal.tenantId)}>Save Note</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="page-sub">Pipeline, revenue metrics, and lead follow-up</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      {/* Revenue KPIs */}
      {revenue && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'MRR', value: fmt(revenue.mrr), color: 'var(--green)' },
            { label: 'ARR', value: fmt(revenue.arr), color: 'var(--blue)' },
            { label: 'Paid Tenants', value: revenue.totalPaid, color: 'var(--purple)' },
            { label: 'New This Month', value: revenue.newThisMonth, color: 'var(--accent)' },
            { label: 'Churn This Month', value: revenue.cancelledThisMonth, color: 'var(--red)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Trend */}
      <div className="admin-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Revenue Trend</h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {([30, 90, 180] as const).map(p => (
              <button key={p} onClick={() => setTrendPeriod(p)}
                className={`btn btn-sm ${trendPeriod === p ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 12, padding: '4px 12px' }}>
                {p}d
              </button>
            ))}
          </div>
        </div>

        {trendLoading ? (
          <div style={{ height: 260, background: 'var(--surface-3)', borderRadius: 8 }} />
        ) : trend.length < 2 ? (
          <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📈</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>Trend data builds up over time — check back tomorrow</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ top: 4, right: 16, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: 'var(--ink-4)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={fmtL} tick={{ fontSize: 11, fill: 'var(--ink-4)' }} tickLine={false} axisLine={false} width={56} />
              <Tooltip content={<TrendTooltip />} />
              <Line type="monotone" dataKey="mrr" name="MRR" stroke="var(--accent)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="arr" name="ARR" stroke="var(--blue)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'flex-end' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-4)' }}>
            <span style={{ width: 16, height: 2, background: 'var(--accent)', display: 'inline-block', borderRadius: 1 }} /> MRR
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-4)' }}>
            <span style={{ width: 16, height: 0, borderBottom: '2px dashed var(--blue)', display: 'inline-block' }} /> ARR
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        {(['pipeline', 'revenue'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--accent)' : 'var(--ink-3)', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', marginBottom: -1 }}>
            {t === 'pipeline' ? 'Trial Pipeline' : 'Plan Breakdown'}
          </button>
        ))}
      </div>

      {tab === 'pipeline' && (
        <div className="admin-card">
          <table className="admin-table">
            <thead><tr><th>Business</th><th>Email</th><th>Orders</th><th>Days Left</th><th>Lead Status</th><th>Action</th></tr></thead>
            <tbody>
              {pipeline.map(t => (
                <tr key={t._id}>
                  <td>
                    <Link href={`/superadmin/tenants/${t._id}`} style={{ fontWeight: 500, color: 'var(--accent)', textDecoration: 'none' }}>{t.businessName}</Link>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{fmtDate(t.createdAt)}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t.email}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: t.orderCount > 10 ? 'var(--green)' : 'var(--ink)' }}>{t.orderCount}</td>
                  <td>
                    <span className={`badge ${t.daysLeft <= 3 ? 'badge-red' : t.daysLeft <= 7 ? 'badge-gold' : 'badge-green'}`}>
                      {t.daysLeft}d
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.lead?.status === 'contacted' ? 'badge-blue' : t.lead?.status === 'converted' ? 'badge-green' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                      {t.lead?.status || 'watching'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setNoteModal({ tenantId: t._id, name: t.businessName })}>+ Note</button>
                  </td>
                </tr>
              ))}
              {pipeline.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No trial tenants</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'revenue' && revenue && (
        <div className="admin-card">
          <table className="admin-table">
            <thead><tr><th>Plan</th><th>Tenants</th><th>Total Revenue</th></tr></thead>
            <tbody>
              {(revenue.planBreakdown || []).map((p: any) => (
                <tr key={p._id}>
                  <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{p._id}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{p.count}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--green)' }}>{fmt(p.revenue || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
