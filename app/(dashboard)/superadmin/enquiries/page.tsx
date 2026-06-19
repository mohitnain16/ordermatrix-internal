'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../../lib/api';
import { Sk, SkRows } from '../../../../components/ui/Skeleton';

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d: string) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_BADGE: Record<string, string> = {
  new: 'badge-blue',
  read: 'badge-gray',
  replied: 'badge-green',
  closed: 'badge-red',
};

const STATUSES = ['new', 'read', 'replied', 'closed'] as const;
type Status = typeof STATUSES[number];

interface Note { _id: string; note: string; addedBy: string; createdAt: string; }

interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  status: Status;
  assignedTo?: string;
  internalNotes: Note[];
  repliedAt?: string;
  repliedBy?: string;
  ip?: string;
  createdAt: string;
}

interface StatusCounts { new: number; read: number; replied: number; closed: number; }

const LIMIT = 30;

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ new: 0, read: 0, replied: 0, closed: 0 });

  // Detail panel
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Reply compose
  const [showReply, setShowReply] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyMsg, setReplyMsg] = useState('');
  const [sending, setSending] = useState(false);

  // Internal note
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/enquiries', {
        params: { page, limit: LIMIT, search: search || undefined, status: statusFilter || undefined },
      });
      setEnquiries(res.data.enquiries);
      setTotal(res.data.total);
      setStatusCounts(res.data.statusCounts);
    } catch { /**/ }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function handleSearchChange(val: string) {
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 350);
  }

  async function openEnquiry(id: string) {
    setDetailLoading(true);
    setSelected(null);
    setShowReply(false);
    setNoteText('');
    try {
      const res = await api.get(`/admin/enquiries/${id}`);
      setSelected(res.data.enquiry);
      setEnquiries(prev => prev.map(e => e._id === id && e.status === 'new' ? { ...e, status: 'read' } : e));
      setStatusCounts(prev => ({
        ...prev,
        new: Math.max(0, prev.new - (enquiries.find(e => e._id === id)?.status === 'new' ? 1 : 0)),
      }));
    } catch { /**/ }
    setDetailLoading(false);
  }

  async function updateStatus(status: Status) {
    if (!selected) return;
    try {
      const res = await api.patch(`/admin/enquiries/${selected._id}`, { status });
      setSelected(res.data.enquiry);
      setEnquiries(prev => prev.map(e => e._id === selected._id ? { ...e, status } : e));
    } catch { /**/ }
  }

  async function sendReply() {
    if (!selected || !replyMsg.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/admin/enquiries/${selected._id}/reply`, {
        subject: replySubject.trim() || undefined,
        message: replyMsg.trim(),
      });
      setSelected(res.data.enquiry);
      setEnquiries(prev => prev.map(e => e._id === selected._id ? { ...e, status: 'replied' } : e));
      setShowReply(false);
      setReplyMsg('');
      setReplySubject('');
    } catch { /**/ }
    setSending(false);
  }

  async function addNote() {
    if (!selected || !noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await api.post(`/admin/enquiries/${selected._id}/notes`, { note: noteText.trim() });
      setSelected(res.data.enquiry);
      setNoteText('');
    } catch { /**/ }
    setAddingNote(false);
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 20, height: 'calc(100vh - 80px)', overflow: 'hidden' }}>

      {/* ── Left: List ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 className="page-title">Enquiries</h1>
            <p className="page-sub">{total} total · <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{statusCounts.new} new</span></p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
        </div>

        {/* Status filter tabs */}
        <div className="table-filter-bar" style={{ flexShrink: 0, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setStatusFilter(''); setPage(1); }}
          >
            All <span style={{ marginLeft: 4, opacity: 0.7 }}>{total}</span>
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{ textTransform: 'capitalize' }}
            >
              {s}
              {s === 'new' && statusCounts.new > 0 && (
                <span style={{ marginLeft: 4, background: 'var(--blue)', color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>
                  {statusCounts.new}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="table-filter-bar" style={{ flexShrink: 0 }}>
          <input
            className="admin-input"
            style={{ maxWidth: 360 }}
            placeholder="Search by name, email, subject, company…"
            defaultValue={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="admin-card" style={{ flex: 1, overflow: 'auto' }}>
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? <SkRows rows={10} cols={6} /> : (
                  <>
                    {enquiries.map(e => (
                      <tr
                        key={e._id}
                        style={{
                          cursor: 'pointer',
                          background: selected?._id === e._id ? 'var(--surface-2)' : undefined,
                          fontWeight: e.status === 'new' ? 600 : undefined,
                        }}
                        onClick={() => openEnquiry(e._id)}
                      >
                        <td>
                          <span style={{ color: 'var(--ink)' }}>{e.name}</span>
                          {e.company && <span className="cell-sub">{e.company}</span>}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{e.email}</td>
                        <td className="text-truncate" style={{ maxWidth: 200 }}>{e.subject}</td>
                        <td style={{ fontSize: 12, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>{fmtDate(e.createdAt)}</td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[e.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                            {e.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={ev => { ev.stopPropagation(); openEnquiry(e._id); }}
                          >
                            Open →
                          </button>
                        </td>
                      </tr>
                    ))}
                    {enquiries.length === 0 && (
                      <tr><td colSpan={6}>
                        <div className="empty-state">
                          <div className="empty-state-icon">✉️</div>
                          <div className="empty-state-title">No enquiries found</div>
                          <div className="empty-state-sub">{statusFilter ? `No enquiries with status "${statusFilter}"` : 'All caught up!'}</div>
                        </div>
                      </td></tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pages > 1 && (
          <div className="flex-center gap-2" style={{ marginTop: 12, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Page {page} of {pages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* ── Right: Detail Panel ────────────────────────────────────── */}
      <div style={{
        width: 440, flexShrink: 0,
        borderLeft: '1px solid var(--line)', paddingLeft: 20,
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
      }}>

        {/* Skeleton while detail loads */}
        {detailLoading && (
          <div style={{ paddingTop: 4 }}>
            <Sk w="55%" h={18} mb={8} />
            <Sk w="40%" h={13} mb={4} />
            <Sk w="30%" h={11} mb={16} />
            <div className="admin-card" style={{ padding: 16, marginBottom: 16 }}>
              <Sk w="50%" h={14} mb={10} />
              <Sk w="100%" h={12} mb={6} />
              <Sk w="90%" h={12} mb={6} />
              <Sk w="75%" h={12} />
            </div>
            <Sk w="35%" h={10} mb={10} />
            <div style={{ display: 'flex', gap: 6 }}>
              <Sk w={80} h={30} r={7} /><Sk w={80} h={30} r={7} /><Sk w={80} h={30} r={7} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!detailLoading && !selected && (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <div className="empty-state-icon">👈</div>
            <div className="empty-state-title">Select an enquiry</div>
            <div className="empty-state-sub">Click any row to view details and reply</div>
          </div>
        )}

        {/* Detail content */}
        {!detailLoading && selected && (
          <>
            {/* Contact header */}
            <div style={{ paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 3 }}>{selected.name}</div>
                  <a href={`mailto:${selected.email}`} style={{ fontSize: 13, color: 'var(--accent)', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}>
                    {selected.email}
                  </a>
                  {selected.phone && <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>{selected.phone}</div>}
                  {selected.company && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>{selected.company}</div>}
                </div>
                <span className={`badge ${STATUS_BADGE[selected.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize', flexShrink: 0 }}>
                  {selected.status}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6 }}>
                Received {fmtTime(selected.createdAt)}
                {selected.ip && ` · ${selected.ip}`}
              </div>
            </div>

            {/* Message */}
            <div className="admin-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>{selected.subject}</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-3)', margin: 0, whiteSpace: 'pre-wrap' }}>{selected.message}</p>
            </div>

            {/* Status actions */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                Change Status
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUSES.filter(s => s !== selected.status).map(s => (
                  <button key={s} className="btn btn-ghost btn-sm" style={{ textTransform: 'capitalize' }} onClick={() => updateStatus(s)}>
                    Mark {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Reply
                </div>
                {!showReply && (
                  <button className="btn btn-sm btn-primary" onClick={() => { setShowReply(true); setReplySubject(`Re: ${selected.subject}`); }}>
                    Compose Reply
                  </button>
                )}
              </div>

              {selected.repliedAt && !showReply && (
                <div style={{ fontSize: 12, color: 'var(--ink-4)', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 8 }}>
                  Replied {fmtTime(selected.repliedAt)}{selected.repliedBy ? ` by ${selected.repliedBy}` : ''}
                </div>
              )}

              {showReply && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="admin-input" placeholder="Subject" value={replySubject} onChange={e => setReplySubject(e.target.value)} />
                  <textarea
                    className="admin-input"
                    rows={6}
                    placeholder="Write your reply…"
                    value={replyMsg}
                    onChange={e => setReplyMsg(e.target.value)}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-primary" disabled={sending || !replyMsg.trim()} onClick={sendReply}>
                      {sending ? <><span className="spinner" />Sending…</> : 'Send Email'}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setShowReply(false); setReplyMsg(''); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                Internal Notes
              </div>

              {selected.internalNotes.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 10, fontStyle: 'italic' }}>No notes yet.</div>
              )}

              {selected.internalNotes.map(n => (
                <div key={n._id} className="note-card">
                  <p className="note-card-body">{n.note}</p>
                  <span className="note-card-meta">{n.addedBy} · {fmtTime(n.createdAt)}</span>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <textarea
                  className="admin-input"
                  rows={2}
                  placeholder="Add an internal note…"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  style={{ flex: 1, resize: 'none', fontFamily: 'inherit' }}
                />
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={addingNote || !noteText.trim()}
                  onClick={addNote}
                  style={{ alignSelf: 'flex-end', minWidth: 60 }}
                >
                  {addingNote ? <span className="spinner spinner-dark" /> : 'Add'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
