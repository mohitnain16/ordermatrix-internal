'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../../lib/api';

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

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  async function openEnquiry(id: string) {
    setDetailLoading(true);
    setSelected(null);
    setShowReply(false);
    setNoteText('');
    try {
      const res = await api.get(`/admin/enquiries/${id}`);
      setSelected(res.data.enquiry);
      // Update local list status
      setEnquiries(prev => prev.map(e => e._id === id && e.status === 'new' ? { ...e, status: 'read' } : e));
      setStatusCounts(prev => ({ ...prev, new: Math.max(0, prev.new - (enquiries.find(e => e._id === id)?.status === 'new' ? 1 : 0)) }));
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

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 20, height: 'calc(100vh - 80px)', overflow: 'hidden' }}>

      {/* ── Left: List ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 className="page-title">Enquiries</h1>
            <p className="page-sub">{total} total · {statusCounts.new} new</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexShrink: 0 }}>
          <button
            className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setStatusFilter(''); setPage(1); }}
          >
            All <span style={{ marginLeft: 4, opacity: .7 }}>{total}</span>
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{ textTransform: 'capitalize' }}
            >
              {s} <span style={{ marginLeft: 4, opacity: .7 }}>{statusCounts[s]}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 12, flexShrink: 0 }}>
          <input
            className="admin-input"
            style={{ width: '100%', maxWidth: 360 }}
            placeholder="Search by name, email, subject, company…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="admin-card" style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : (
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
                {enquiries.map(e => (
                  <tr
                    key={e._id}
                    style={{
                      cursor: 'pointer',
                      background: selected?._id === e._id ? 'var(--surface-2, #f9f9f9)' : undefined,
                      fontWeight: e.status === 'new' ? 600 : undefined,
                    }}
                    onClick={() => openEnquiry(e._id)}
                  >
                    <td>
                      <span style={{ color: 'var(--ink)' }}>{e.name}</span>
                      {e.company && <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-4)', fontWeight: 400 }}>{e.company}</span>}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{e.email}</td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.subject}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>{fmtDate(e.createdAt)}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[e.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                        {e.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={ev => { ev.stopPropagation(); openEnquiry(e._id); }}>
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
                {enquiries.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>
                      No enquiries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Page {page} of {pages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* ── Right: Detail Panel ──────────────────────────────────────── */}
      <div
        style={{
          width: 440,
          flexShrink: 0,
          borderLeft: '1px solid var(--line)',
          paddingLeft: 20,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {detailLoading && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
        )}

        {!detailLoading && !selected && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 14 }}>
            Select an enquiry to view details
          </div>
        )}

        {!detailLoading && selected && (
          <>
            {/* Header */}
            <div style={{ paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)', marginBottom: 2 }}>{selected.name}</div>
                  <a href={`mailto:${selected.email}`} style={{ fontSize: 13, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    {selected.email}
                  </a>
                  {selected.phone && (
                    <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>{selected.phone}</div>
                  )}
                  {selected.company && (
                    <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{selected.company}</div>
                  )}
                </div>
                <span className={`badge ${STATUS_BADGE[selected.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize', flexShrink: 0 }}>
                  {selected.status}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6 }}>
                Received {fmtTime(selected.createdAt)}
                {selected.ip && ` · IP ${selected.ip}`}
              </div>
            </div>

            {/* Subject + Message */}
            <div className="admin-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>{selected.subject}</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-3)', margin: 0, whiteSpace: 'pre-wrap' }}>{selected.message}</p>
            </div>

            {/* Status actions */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                Change Status
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUSES.filter(s => s !== selected.status).map(s => (
                  <button
                    key={s}
                    className="btn btn-ghost btn-sm"
                    style={{ textTransform: 'capitalize' }}
                    onClick={() => updateStatus(s)}
                  >
                    Mark {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Reply
                </div>
                {!showReply && (
                  <button className="btn btn-sm btn-primary" onClick={() => { setShowReply(true); setReplySubject(`Re: ${selected.subject}`); }}>
                    Compose Reply
                  </button>
                )}
              </div>

              {selected.repliedAt && !showReply && (
                <div style={{ fontSize: 12, color: 'var(--ink-4)', background: 'var(--surface-2, #f5f5f5)', padding: '8px 12px', borderRadius: 8 }}>
                  Replied {fmtTime(selected.repliedAt)} by {selected.repliedBy}
                </div>
              )}

              {showReply && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    className="admin-input"
                    placeholder="Subject"
                    value={replySubject}
                    onChange={e => setReplySubject(e.target.value)}
                  />
                  <textarea
                    className="admin-input"
                    rows={6}
                    placeholder="Write your reply…"
                    value={replyMsg}
                    onChange={e => setReplyMsg(e.target.value)}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={sending || !replyMsg.trim()}
                      onClick={sendReply}
                    >
                      {sending ? 'Sending…' : 'Send Email'}
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
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                Internal Notes
              </div>

              {selected.internalNotes.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--ink-4)', marginBottom: 10 }}>No notes yet.</div>
              )}

              {selected.internalNotes.map(n => (
                <div key={n._id} style={{ background: 'var(--surface-2, #f9f9f9)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', whiteSpace: 'pre-wrap' }}>{n.note}</p>
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                    {n.addedBy} · {fmtTime(n.createdAt)}
                  </span>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <textarea
                  className="admin-input"
                  rows={2}
                  placeholder="Add a note…"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  style={{ flex: 1, resize: 'none', fontFamily: 'inherit', fontSize: 13 }}
                />
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={addingNote || !noteText.trim()}
                  onClick={addNote}
                  style={{ alignSelf: 'flex-end' }}
                >
                  {addingNote ? '…' : 'Add'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
