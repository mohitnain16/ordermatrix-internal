'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../../lib/api';
import { SkRows } from '../../../../components/ui/Skeleton';
import { Flame, Phone, CheckCircle2, Circle, ExternalLink, ArrowUpDown } from 'lucide-react';

type LeadReason = 'approaching_cap' | 'locked_tab' | 'samples_exhausted';

interface Lead {
  _id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  ordersThisMonth: number;
  sampleUsed: number;
  lockedTabClicks: number;
  leadFlag: { reason: LeadReason; flaggedAt: string; ordersAtFlag: number };
  leadContacted: { contacted: boolean; contactedAt?: string };
  createdAt: string;
  lastActive: string | null;
  waLink: string | null;
}

const REASON_LABEL: Record<LeadReason, string> = {
  approaching_cap:    '≥80 orders',
  locked_tab:         '3+ locked clicks',
  samples_exhausted:  'Samples used up',
};

const REASON_COLOR: Record<LeadReason, string> = {
  approaching_cap:   'var(--accent)',
  locked_tab:        'var(--amber)',
  samples_exhausted: 'var(--blue)',
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function HotLeadsPage() {
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort]       = useState<'ordersThisMonth' | 'createdAt' | 'leadFlag.flaggedAt'>('ordersThisMonth');
  const [order, setOrder]     = useState<'asc' | 'desc'>('desc');
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/leads', { params: { sort, order } });
      setLeads(res.data.leads);
    } catch { /**/ }
    setLoading(false);
  }, [sort, order]);

  useEffect(() => { load(); }, [load]);

  function cycleSort(field: typeof sort) {
    if (sort === field) {
      setOrder(o => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setSort(field);
      setOrder('desc');
    }
  }

  async function toggleContacted(lead: Lead) {
    const next = !lead.leadContacted?.contacted;
    setToggling(t => ({ ...t, [lead._id]: true }));
    try {
      await api.put(`/admin/leads/${lead._id}/contacted`, { contacted: next });
      setLeads(ls =>
        ls.map(l =>
          l._id === lead._id
            ? { ...l, leadContacted: { contacted: next, contactedAt: next ? new Date().toISOString() : undefined } }
            : l,
        ),
      );
    } catch { /**/ }
    setToggling(t => ({ ...t, [lead._id]: false }));
  }

  const SortBtn = ({ field, label }: { field: typeof sort; label: string }) => (
    <button
      onClick={() => cycleSort(field)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none',
        border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 11,
        fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: sort === field ? 'var(--ink)' : 'var(--ink-3)',
        padding: 0,
      }}
    >
      {label}
      <ArrowUpDown size={11} />
    </button>
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Flame size={20} color="var(--accent)" />
          <div>
            <h1 className="page-title">Hot Leads</h1>
            <p className="page-sub">Free tenants with a conversion signal</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '16px 20px' }}>
          <SkRows rows={8} />
        </div>
      ) : leads.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
          No hot leads right now. The daily cron flags tenants at 03:30 IST.
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th><SortBtn field="ordersThisMonth" label="Orders used" /></th>
                  <th>Signal</th>
                  <th><SortBtn field="leadFlag.flaggedAt" label="Flagged" /></th>
                  <th><SortBtn field="createdAt" label="Signed up" /></th>
                  <th>Last active</th>
                  <th>Phone</th>
                  <th>WhatsApp</th>
                  <th>Contacted</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  const contacted = lead.leadContacted?.contacted;
                  const reason = lead.leadFlag?.reason as LeadReason;
                  return (
                    <tr
                      key={lead._id}
                      style={{ opacity: contacted ? 0.55 : 1, transition: 'opacity 0.15s' }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>
                          {lead.businessName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                          {lead.ownerName} · {lead.email}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              width: 60, height: 6, borderRadius: 3,
                              background: 'var(--surface-2)', overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%', borderRadius: 3,
                                width: `${Math.min(100, (lead.ordersThisMonth / 100) * 100)}%`,
                                background: lead.ordersThisMonth >= 100
                                  ? 'var(--red)'
                                  : lead.ordersThisMonth >= 80
                                  ? 'var(--accent)'
                                  : 'var(--amber)',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
                            {lead.ordersThisMonth}/100
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: 99,
                            fontSize: 11, fontWeight: 600,
                            background: `color-mix(in srgb, ${REASON_COLOR[reason] || 'var(--accent)'} 12%, transparent)`,
                            color: REASON_COLOR[reason] || 'var(--accent)',
                          }}
                        >
                          {REASON_LABEL[reason] || reason}
                        </span>
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {fmtDate(lead.leadFlag?.flaggedAt)}
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {fmtDate(lead.createdAt)}
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {fmtTime(lead.lastActive)}
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                        {lead.phone || '—'}
                      </td>

                      <td>
                        {lead.waLink ? (
                          <a
                            href={lead.waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                              background: 'var(--green-soft)', color: 'var(--green-text)',
                              textDecoration: 'none', border: 'none', cursor: 'pointer',
                            }}
                          >
                            <Phone size={11} />
                            Message
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      <td>
                        <button
                          onClick={() => toggleContacted(lead)}
                          disabled={toggling[lead._id]}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: contacted ? 'var(--green)' : 'var(--ink-4)',
                            fontSize: 12, fontWeight: 600, padding: '4px 0',
                          }}
                          title={
                            contacted && lead.leadContacted?.contactedAt
                              ? `Contacted ${fmtTime(lead.leadContacted.contactedAt)}`
                              : 'Mark as contacted'
                          }
                        >
                          {contacted
                            ? <CheckCircle2 size={15} />
                            : <Circle size={15} />
                          }
                          {contacted ? 'Done' : 'Mark'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
