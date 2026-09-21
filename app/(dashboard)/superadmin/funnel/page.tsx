'use client';
import { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import { Sk } from '../../../../components/ui/Skeleton';
import { BarChart3 } from 'lucide-react';

interface FunnelRow {
  week: string;
  signups: number;
  activated: number;   // >= 10 orders in first 7 days
  capHit: number;      // hit 100-order cap
  converted: number;   // upgraded to paid
}

function pct(n: number, d: number) {
  if (!d) return '—';
  return `${Math.round((n / d) * 100)}%`;
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', width: 28, textAlign: 'right', flexShrink: 0 }}>
        {value}
      </span>
    </div>
  );
}

const STAGE_META = [
  { key: 'signups'   as const, label: 'Signups',           color: 'var(--blue)',   desc: 'New free tenants that week' },
  { key: 'activated' as const, label: '≥10 orders in 7d',  color: 'var(--accent)', desc: 'Placed ≥10 orders within first 7 days' },
  { key: 'capHit'    as const, label: 'Cap hit',            color: 'var(--amber)',  desc: 'Hit the 100-order free cap' },
  { key: 'converted' as const, label: 'Converted',          color: 'var(--green)',  desc: 'Upgraded to a paid plan' },
];

export default function FunnelPage() {
  const [rows, setRows]     = useState<FunnelRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/leads/funnel')
      .then(r => setRows(r.data.funnel))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxSignups = Math.max(...rows.map(r => r.signups), 1);

  // Totals across all weeks
  const totals = rows.reduce(
    (acc, r) => ({
      signups:   acc.signups   + r.signups,
      activated: acc.activated + r.activated,
      capHit:    acc.capHit    + r.capHit,
      converted: acc.converted + r.converted,
    }),
    { signups: 0, activated: 0, capHit: 0, converted: 0 },
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={20} color="var(--accent)" />
          <div>
            <h1 className="page-title">Conversion Funnel</h1>
            <p className="page-sub">Free plan journey — signups → activation → cap → paid · last 12 weeks</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          setLoading(true);
          api.get('/admin/leads/funnel').then(r => setRows(r.data.funnel)).catch(() => {}).finally(() => setLoading(false));
        }}>Refresh</button>
      </div>

      {/* Summary tiles */}
      {!loading && rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {STAGE_META.map(({ key, label, color, desc }) => {
            const count = totals[key];
            const convRate = key !== 'signups' ? pct(count, totals.signups) : null;
            return (
              <div key={key} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
                  {count}
                </div>
                {convRate && (
                  <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 4 }}>
                    {convRate} of signups
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>{desc}</div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: '20px 24px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <Sk w="30%" h={12} mb={8} />
              <Sk w="80%" h={8} mb={6} />
              <Sk w="60%" h={8} mb={6} />
              <Sk w="40%" h={8} mb={6} />
              <Sk w="20%" h={8} />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
          No data yet — funnel is built from real tenant and order records.
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Week of</th>
                  {STAGE_META.map(s => (
                    <th key={s.key} style={{ minWidth: 160 }}>
                      <span style={{ color: s.color }}>{s.label}</span>
                    </th>
                  ))}
                  <th style={{ minWidth: 120 }}>Signup → Paid</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.week}>
                    <td style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                      {row.week}
                    </td>
                    {STAGE_META.map(s => (
                      <td key={s.key}>
                        <Bar value={row[s.key]} max={maxSignups} color={s.color} />
                      </td>
                    ))}
                    <td>
                      <span
                        style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 99,
                          fontSize: 11, fontWeight: 700,
                          background: row.converted > 0 ? 'var(--green-soft)' : 'var(--neutral-soft)',
                          color: row.converted > 0 ? 'var(--green-text)' : 'var(--ink-4)',
                        }}
                      >
                        {pct(row.converted, row.signups)}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr style={{ background: 'var(--surface-2)' }}>
                  <td style={{ fontWeight: 700, fontSize: 12 }}>12-wk total</td>
                  {STAGE_META.map(s => (
                    <td key={s.key}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{totals[s.key]}</span>
                    </td>
                  ))}
                  <td>
                    <span
                      style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 99,
                        fontSize: 11, fontWeight: 700,
                        background: totals.converted > 0 ? 'var(--green-soft)' : 'var(--neutral-soft)',
                        color: totals.converted > 0 ? 'var(--green-text)' : 'var(--ink-4)',
                      }}
                    >
                      {pct(totals.converted, totals.signups)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
