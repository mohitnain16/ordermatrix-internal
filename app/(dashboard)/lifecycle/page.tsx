'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { SkRows } from '../../../components/ui/Skeleton';

type Tenant = {
  _id: string;
  businessName: string;
  email: string;
  planId: string;
  health: number;
  ordersWeek: number;
  totalOrders: number;
  lastActive: string | null;
  teamCount: number;
  daysSinceActive: number;
  churnRisk: boolean;
  onboarding: { profileComplete: boolean; firstOrder: boolean; whatsappConnected: boolean; teamAdded: boolean };
  onboardingScore: number;
};

const PLAN_BADGE: Record<string, string> = {
  trial: 'badge-gray', starter: 'badge-gray', growth: 'badge-green', scale: 'badge-purple', pro: 'badge-gold',
};

function healthColor(score: number) {
  if (score >= 70) return 'var(--green)';
  if (score >= 40) return 'var(--gold)';
  return 'var(--red)';
}

function HealthBar({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: healthColor(score), borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: healthColor(score), fontFamily: 'var(--font-mono)', minWidth: 28 }}>{score}</span>
    </div>
  );
}

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: done ? 'var(--green)' : 'var(--ink-4)', marginRight: 8 }}>
      <span style={{ fontSize: 12 }}>{done ? '✓' : '○'}</span>{label}
    </span>
  );
}

export default function LifecyclePage() {
  const [tab, setTab] = useState<'onboarding' | 'health' | 'churn'>('onboarding');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/lifecycle');
      setTenants(res.data.tenants);
    } catch { /**/ }
    setLoading(false);
  }

  const churnList = tenants.filter(t => t.churnRisk);
  const incompleteOnboarding = tenants.filter(t => t.onboardingScore < 4);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Tenant Lifecycle</h1>
          <p className="page-sub">Onboarding, health scores, churn risk</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Incomplete Onboarding', value: incompleteOnboarding.length, color: 'var(--gold)' },
          { label: 'Churn Risk (Paid)', value: churnList.length, color: 'var(--red)' },
          { label: 'Healthy (70+)', value: tenants.filter(t => t.health >= 70).length, color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        {([
          { key: 'onboarding', label: `Onboarding (${incompleteOnboarding.length} incomplete)` },
          { key: 'health', label: 'Health Scores' },
          { key: 'churn', label: `Churn Risk (${churnList.length})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? 'var(--accent)' : 'var(--ink-3)', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'onboarding' && (
        <div className="admin-card">
          <table className="admin-table">
            <thead><tr><th>Business</th><th>Plan</th><th>Steps</th><th>Score</th><th></th></tr></thead>
            <tbody>
              {loading ? <SkRows rows={8} cols={5} /> : (
                <>
                  {incompleteOnboarding.map(t => (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 500 }}>{t.businessName}<div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{t.email}</div></td>
                      <td><span className={`badge ${PLAN_BADGE[t.planId] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{t.planId}</span></td>
                      <td>
                        <Step done={t.onboarding.profileComplete} label="Profile" />
                        <Step done={t.onboarding.firstOrder} label="Order" />
                        <Step done={t.onboarding.whatsappConnected} label="WhatsApp" />
                        <Step done={t.onboarding.teamAdded} label="Team" />
                      </td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: t.onboardingScore === 4 ? 'var(--green)' : t.onboardingScore >= 2 ? 'var(--gold)' : 'var(--red)' }}>{t.onboardingScore}/4</span></td>
                      <td><Link href={`/superadmin/tenants/${t._id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                    </tr>
                  ))}
                  {incompleteOnboarding.length === 0 && (
                    <tr><td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🎉</div>
                        <div className="empty-state-title">All tenants completed onboarding</div>
                      </div>
                    </td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'health' && (
        <div className="admin-card">
          <table className="admin-table">
            <thead><tr><th>Business</th><th>Plan</th><th>Health</th><th>Orders/wk</th><th>Last Active</th><th>WhatsApp</th><th></th></tr></thead>
            <tbody>
              {loading ? <SkRows rows={8} cols={7} /> : (
                [...tenants].sort((a, b) => a.health - b.health).map(t => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 500 }}>{t.businessName}</td>
                    <td><span className={`badge ${PLAN_BADGE[t.planId] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{t.planId}</span></td>
                    <td style={{ minWidth: 160 }}><HealthBar score={t.health} /></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{t.ordersWeek}</td>
                    <td style={{ fontSize: 12, color: t.daysSinceActive > 7 ? 'var(--red)' : 'var(--ink-3)' }}>{t.lastActive ? `${t.daysSinceActive}d ago` : 'Never'}</td>
                    <td><span style={{ fontSize: 13 }}>{t.onboarding.whatsappConnected ? '✓' : '—'}</span></td>
                    <td><Link href={`/superadmin/tenants/${t._id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'churn' && (
        <div className="admin-card">
          <table className="admin-table">
            <thead><tr><th>Business</th><th>Plan</th><th>Days Inactive</th><th>Orders/wk</th><th>Health</th><th></th></tr></thead>
            <tbody>
              {loading ? <SkRows rows={8} cols={6} /> : (
                <>
                  {churnList.sort((a, b) => b.daysSinceActive - a.daysSinceActive).map(t => (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 500 }}>{t.businessName}<div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{t.email}</div></td>
                      <td><span className={`badge ${PLAN_BADGE[t.planId] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{t.planId}</span></td>
                      <td><span className={`badge ${t.daysSinceActive >= 14 ? 'badge-red' : 'badge-gold'}`}>{t.daysSinceActive}d</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{t.ordersWeek}</td>
                      <td><HealthBar score={t.health} /></td>
                      <td><Link href={`/superadmin/tenants/${t._id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                    </tr>
                  ))}
                  {churnList.length === 0 && (
                    <tr><td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">✓</div>
                        <div className="empty-state-title">No paid tenants at churn risk</div>
                      </div>
                    </td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
