'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, UserCheck, ShieldOff } from 'lucide-react';
import api from '../../../../../lib/api';
import { getAdmin, hasRole } from '../../../../../lib/auth';
import { usePageTitle } from '../../../../../lib/page-title-context';
import { Sk, SkStatCard, SkDetailCard } from '../../../../../components/ui/Skeleton';

const fmt = (n: number) => `₹${new Intl.NumberFormat('en-IN').format(n || 0)}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PLAN_BADGE: Record<string, string> = {
  trial: 'badge-gold', starter: 'badge-blue', growth: 'badge-green', scale: 'badge-purple', pro: 'badge-purple',
};

const STATUS_LABEL: Record<string, string> = {
  new: 'New', confirmed: 'Confirmed', processing: 'Processing',
  ready_to_dispatch: 'Ready', dispatched: 'Dispatched',
  delivered: 'Delivered', returned: 'Returned', rto: 'RTO', cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<string, string> = {
  new: 'badge-blue', confirmed: 'badge-accent', processing: 'badge-amber',
  ready_to_dispatch: 'badge-purple', dispatched: 'badge-accent',
  delivered: 'badge-green', returned: 'badge-amber', rto: 'badge-red', cancelled: 'badge-red',
};

const ALL_STATUSES = [
  'new', 'confirmed', 'processing', 'ready_to_dispatch', 'dispatched',
  'delivered', 'returned', 'rto', 'cancelled',
] as const;

const PLAN_OPTIONS = [
  { id: 'trial',      label: 'Trial' },
  { id: 'starter',    label: 'Starter' },
  { id: 'growth',     label: 'Growth' },
  { id: 'pro',        label: 'Pro' },
  { id: 'enterprise', label: 'Enterprise' },
];

const SUB_STATUS_OPTIONS = ['active', 'trialing', 'past_due', 'cancelled', 'paused'];

function OverridePlanModal({ subId, current, onClose, onSuccess, toast }: any) {
  const [form, setForm] = useState({
    planId: current?.planId || '',
    status: current?.status || '',
    currentPeriodEnd: current?.currentPeriodEnd ? current.currentPeriodEnd.slice(0, 10) : '',
    seats: current?.seats ? String(current.seats) : '',
  });
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const body: any = {};
      if (form.planId && form.planId !== current?.planId) body.planId = form.planId;
      if (form.status && form.status !== current?.status) body.status = form.status;
      if (form.currentPeriodEnd) body.currentPeriodEnd = form.currentPeriodEnd;
      if (form.seats) body.seats = parseInt(form.seats);
      if (!Object.keys(body).length) { toast('No changes to apply'); setLoading(false); return; }
      await api.patch(`/admin/subscriptions/${subId}/override`, body);
      toast('Plan override applied');
      onSuccess();
    } catch (e: any) {
      toast(e?.response?.data?.error || 'Override failed');
    }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-warning" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Override Plan</div>
            <div className="modal-sub">Changes take effect immediately. Razorpay billing is not affected.</div>
          </div>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">Plan</label>
            <select className="admin-input" value={form.planId} onChange={e => setForm(f => ({ ...f, planId: e.target.value }))}>
              <option value="">— no change —</option>
              {PLAN_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Subscription Status</label>
            <select className="admin-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="">— no change —</option>
              {SUB_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Period End Date</label>
            <input type="date" className="admin-input" value={form.currentPeriodEnd} onChange={e => setForm(f => ({ ...f, currentPeriodEnd: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">Seats</label>
            <input type="number" className="admin-input" min={1} value={form.seats} onChange={e => setForm(f => ({ ...f, seats: e.target.value }))} placeholder="Leave blank to keep current" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Apply Override'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ action, onConfirm, onCancel, loading, trialDays, setTrialDays }: any) {
  const [verifyValue, setVerifyValue] = useState('');
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className={`modal-box modal-${action.level}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{action.title}</div>
            {action.detail && <div className="modal-sub">{action.detail}</div>}
          </div>
        </div>
        <div className="modal-body">
          <p className="confirm-message">{action.message}</p>
          {action.type === 'extendTrial' && (
            <div className="input-group" style={{ marginTop: 12 }}>
              <label className="input-label">Days to extend</label>
              <input
                type="number" className="admin-input" min={1} max={90}
                value={trialDays}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrialDays(Number(e.target.value))}
              />
            </div>
          )}
          {action.verifyText && (
            <div style={{ marginTop: 16 }}>
              <div className="verify-input-label">
                Type <strong>{action.verifyText}</strong> to confirm
              </div>
              <input
                className="admin-input"
                value={verifyValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerifyValue(e.target.value)}
                placeholder={action.verifyText}
                autoFocus
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button
            className={`btn btn-sm ${action.confirmClass}`}
            onClick={onConfirm}
            disabled={loading || (action.verifyText ? verifyValue !== action.verifyText : false)}
          >
            {loading ? <span className="spinner" /> : action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  new: ['confirmed', 'ready_to_dispatch', 'dispatched', 'cancelled'],
  confirmed: ['processing', 'ready_to_dispatch', 'dispatched', 'cancelled'],
  processing: ['ready_to_dispatch', 'dispatched', 'cancelled'],
  ready_to_dispatch: ['dispatched', 'cancelled'],
  dispatched: ['delivered', 'returned', 'rto'],
  delivered: ['returned'],
  rto: ['delivered', 'returned'],
};

const PAYMENT_MODES = [
  { id: 'cod', label: 'Cash on Delivery' },
  { id: 'upi', label: 'UPI' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'prepaid', label: 'Prepaid' },
  { id: 'other', label: 'Other' },
];

function OrderStatusModal({ order, tenantId, onClose, onSuccess, toast }: any) {
  const validNext = VALID_TRANSITIONS[order.status] || [];
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!status) return;
    setLoading(true); setErr('');
    try {
      await api.put(`/admin/tenants/${tenantId}/orders/${order._id}`, { status });
      toast(`Status updated to ${STATUS_LABEL[status] || status}`);
      onSuccess();
    } catch (e: any) {
      const data = e?.response?.data;
      if (e?.response?.status === 422) {
        setErr(`Cannot transition: ${data?.error || 'invalid'}. Valid next: ${(data?.validNext || []).map((s: string) => STATUS_LABEL[s] || s).join(', ')}`);
      } else {
        setErr(data?.error || 'Failed to update status');
      }
    }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-warning" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Update Order Status</div>
            <div className="modal-sub">
              Order {order.orderId || order._id?.toString().slice(-8)} · Current: <span className={`badge ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
            </div>
          </div>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {validNext.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ink-4)' }}>This order is in a terminal status and cannot be changed.</p>
          ) : (
            <div className="input-group">
              <label className="input-label">New Status</label>
              <select className="admin-input" value={status} onChange={e => { setStatus(e.target.value); setErr(''); }}>
                <option value="">— select —</option>
                {validNext.map((s: string) => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}
              </select>
            </div>
          )}
          {err && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{err}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          {validNext.length > 0 && (
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading || !status}>
              {loading ? <span className="spinner" /> : 'Update Status'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordPaymentModal({ order, tenantId, onClose, onSuccess, toast }: any) {
  const [form, setForm] = useState({ amount: '', mode: 'upi', utr: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!form.amount || isNaN(Number(form.amount))) { setErr('Enter a valid amount'); return; }
    setLoading(true); setErr('');
    try {
      await api.post(`/admin/tenants/${tenantId}/orders/${order._id}/payment`, {
        amount: Number(form.amount), mode: form.mode,
        utr: form.utr.trim() || undefined, note: form.note.trim() || undefined,
      });
      toast('Payment recorded');
      onSuccess();
    } catch (e: any) {
      const data = e?.response?.data;
      if (e?.response?.status === 409) {
        const conflict = data?.conflictingOrder;
        setErr(`Duplicate UTR — already on order ${conflict?.orderNumber || 'another order'}`);
      } else {
        setErr(data?.error || 'Failed to record payment');
      }
    }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-warning" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Record Payment</div>
            <div className="modal-sub">Order {order.orderId || order._id?.toString().slice(-8)} · Balance: {order.balanceDue != null ? `₹${order.balanceDue}` : '—'}</div>
          </div>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="input-group">
              <label className="input-label">Amount (₹) *</label>
              <input type="number" min={1} className="admin-input" value={form.amount} onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setErr(''); }} />
            </div>
            <div className="input-group">
              <label className="input-label">Mode *</label>
              <select className="admin-input" value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}>
                {PAYMENT_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">UTR / Reference</label>
            <input className="admin-input" value={form.utr} onChange={e => { setForm(f => ({ ...f, utr: e.target.value })); setErr(''); }} placeholder="Optional — checked for duplicates across workspace" />
          </div>
          <div className="input-group">
            <label className="input-label">Note</label>
            <input className="admin-input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional" />
          </div>
          {err && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{err}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCommentModal({ order, tenantId, onClose, onSuccess, toast }: any) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!text.trim()) { setErr('Comment text is required'); return; }
    setLoading(true); setErr('');
    try {
      await api.post(`/admin/tenants/${tenantId}/orders/${order._id}/comments`, { text: text.trim() });
      toast('Internal note added');
      onSuccess();
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to add comment');
    }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Add Internal Note</div>
            <div className="modal-sub">Visible to admin team only — tenants cannot see this</div>
          </div>
        </div>
        <div className="modal-body">
          <textarea
            className="admin-input"
            rows={4}
            value={text}
            onChange={e => { setText(e.target.value); setErr(''); }}
            placeholder="Internal support note…"
            style={{ width: '100%', resize: 'vertical' }}
          />
          {err && <p style={{ fontSize: 12, color: 'var(--red)', margin: '6px 0 0' }}>{err}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DispatchModal({ order, tenantId, onClose, onSuccess, toast }: any) {
  const isAlreadyDispatched = ['dispatched', 'delivered', 'rto'].includes(order.status);
  const [form, setForm] = useState({
    courierName: order.courier?.name || '',
    trackingNumber: order.courier?.trackingNumber || '',
    dispatchDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!form.courierName.trim()) { setErr('Courier name is required'); return; }
    setLoading(true); setErr('');
    try {
      await api.post(`/admin/tenants/${tenantId}/orders/${order._id}/dispatch`, {
        courierName: form.courierName.trim(),
        trackingNumber: form.trackingNumber.trim() || undefined,
        dispatchDate: form.dispatchDate || undefined,
      });
      toast(isAlreadyDispatched ? 'Courier info updated' : 'Order dispatched');
      onSuccess();
    } catch (e: any) {
      const data = e?.response?.data;
      if (e?.response?.status === 422) {
        setErr(`${data?.error || 'Invalid transition'}. Valid next: ${(data?.validNext || []).map((s: string) => STATUS_LABEL[s] || s).join(', ')}`);
      } else {
        setErr(data?.error || 'Failed to update dispatch info');
      }
    }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-warning" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{isAlreadyDispatched ? 'Update Courier Info' : 'Dispatch Order'}</div>
            <div className="modal-sub">Order {order.orderId || order._id?.toString().slice(-8)}{isAlreadyDispatched ? ' — updating tracking only, status unchanged' : ' — will advance status to Dispatched'}</div>
          </div>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="input-group">
            <label className="input-label">Courier Name *</label>
            <input className="admin-input" value={form.courierName} onChange={e => { setForm(f => ({ ...f, courierName: e.target.value })); setErr(''); }} placeholder="e.g. Delhivery, DTDC" />
          </div>
          <div className="input-group">
            <label className="input-label">Tracking / AWB Number</label>
            <input className="admin-input" value={form.trackingNumber} onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))} placeholder="Optional — marks tracking pending if blank" />
          </div>
          <div className="input-group">
            <label className="input-label">Dispatch Date</label>
            <input type="date" className="admin-input" value={form.dispatchDate} onChange={e => setForm(f => ({ ...f, dispatchDate: e.target.value }))} />
          </div>
          {err && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{err}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
            {loading ? <span className="spinner" /> : isAlreadyDispatched ? 'Update Courier' : 'Dispatch'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditCustomerModal({ customer, tenantId, onClose, onSuccess, toast }: any) {
  const [form, setForm] = useState({
    name:  customer.name  || '',
    email: customer.email || '',
    phone: customer.phone || '',
    notes: customer.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!form.name.trim()) { setErr('Name is required'); return; }
    setLoading(true); setErr('');
    try {
      await api.put(`/admin/tenants/${tenantId}/customers/${customer._id}`, {
        name:  form.name.trim()  || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      toast('Customer profile updated');
      onSuccess();
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to update customer');
    }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-warning" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Edit Customer</div>
            <div className="modal-sub">Changes are audit-logged with before/after diff</div>
          </div>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="input-group">
            <label className="input-label">Name *</label>
            <input className="admin-input" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErr(''); }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="input-group">
              <label className="input-label">Phone</label>
              <input className="admin-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input type="email" className="admin-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Notes</label>
            <textarea className="admin-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'none' }} />
          </div>
          {err && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{err}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const admin = getAdmin();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  type TabId = 'overview' | 'subscription' | 'notes' | 'orders' | 'customers' | 'deliveries' | 'flags' | 'analytics' | 'settings' | 'team' | 'overdue' | 'products' | 'invoices';
  const [tab, setTab] = useState<TabId>('overview');
  const loadedTabsRef = useRef<Set<TabId>>(new Set<TabId>(['overview']));
  const [toastMsg, setToastMsg] = useState('');
  const [trialDays, setTrialDays] = useState(14);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [dlPage, setDlPage] = useState(1);
  const [dlTotal, setDlTotal] = useState(0);
  const [dlLoading, setDlLoading] = useState(false);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  // orders tab
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersStatus, setOrdersStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  // override plan modal
  const [overrideOpen, setOverrideOpen] = useState(false);
  // customers tab
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersTotal, setCustomersTotal] = useState(0);
  const [customersPage, setCustomersPage] = useState(1);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDetailLoading, setCustomerDetailLoading] = useState(false);
  // write-on-behalf modal state
  const [statusModal, setStatusModal] = useState<any>(null);      // { order }
  const [paymentModal, setPaymentModal] = useState<any>(null);    // { order }
  const [commentModal, setCommentModal] = useState<any>(null);    // { order }
  const [dispatchModal, setDispatchModal] = useState<any>(null);  // { order }
  const [editCustomerModal, setEditCustomerModal] = useState<any>(null); // { customer }
  // analytics tab
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  // settings tab
  const [tenantSettings, setTenantSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<any>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  // wa-agent card (inside settings tab)
  const [waAgent, setWaAgent] = useState<any>(null);
  const [waAgentLoading, setWaAgentLoading] = useState(false);
  const [waAgentProvisionForm, setWaAgentProvisionForm] = useState<any>(null);
  const [waAgentTemplatesDraft, setWaAgentTemplatesDraft] = useState<any>(null);
  const [waAgentSaving, setWaAgentSaving] = useState(false);
  // team tab
  const [teamData, setTeamData] = useState<any>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  // overdue payments tab
  const [overdueOrders, setOverdueOrders] = useState<any[]>([]);
  const [overdueTotal, setOverdueTotal] = useState(0);
  const [overduePage, setOverduePage] = useState(1);
  const [overdueLoading, setOverdueLoading] = useState(false);
  // products tab
  const [products, setProducts] = useState<any[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsPage, setProductsPage] = useState(1);
  const [productsSearch, setProductsSearch] = useState('');
  const [productsLoading, setProductsLoading] = useState(false);
  // invoices tab
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesTotal, setInvoicesTotal] = useState(0);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const { setTitle } = usePageTitle();

  useEffect(() => { load(); }, [tenantId]);
  useEffect(() => {
    const name = data?.tenant?.businessName;
    if (name) setTitle(name);
    return () => setTitle(null);
  }, [data?.tenant?.businessName]);
  function firstVisit(t: TabId, fn: () => void) {
    if (!loadedTabsRef.current.has(t)) { loadedTabsRef.current.add(t); fn(); }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'deliveries') firstVisit('deliveries', () => loadDeliveries(1)); }, [tab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'flags') firstVisit('flags', loadFlags); }, [tab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'orders') firstVisit('orders', () => loadOrders(1, ordersStatus)); }, [tab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'customers') firstVisit('customers', () => loadCustomers(1, customerSearch)); }, [tab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'analytics') firstVisit('analytics', loadAnalytics); }, [tab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'settings') firstVisit('settings', () => { loadTenantSettings(); loadWaAgent(); }); }, [tab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'team') firstVisit('team', loadTeam); }, [tab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'overdue') firstVisit('overdue', () => loadOverdue(1)); }, [tab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'products') firstVisit('products', () => loadProducts(1, '')); }, [tab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'invoices') firstVisit('invoices', () => loadInvoices(1)); }, [tab]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/tenants/${tenantId}`);
      setData(res.data);
    } catch { /**/ }
    setLoading(false);
  }

  function toast(msg: string) { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); }

  async function toggleActive() {
    if (!data) return;
    try {
      await api.patch(`/admin/tenants/${tenantId}`, { isActive: !data.tenant.isActive });
      toast(data.tenant.isActive ? 'Tenant deactivated' : 'Tenant activated');
      load();
    } catch { toast('Failed to update'); }
  }

  async function extendTrial() {
    const days = Math.max(1, Math.min(90, trialDays));
    try {
      await api.patch(`/admin/subscriptions/extend-trial/${tenantId}`, { days });
      toast(`Trial extended by ${days} day${days === 1 ? '' : 's'}`);
      load();
    } catch { toast('Failed to extend trial'); }
  }

  async function impersonate() {
    try {
      const res = await api.post(`/admin/tenants/${tenantId}/impersonate`);
      const { token } = res.data;
      const base = (process.env.NEXT_PUBLIC_TENANT_APP_URL || 'https://app.ordermatrix.in').replace(/\/$/, '');
      window.open(`${base}/en/admin-session?admin_token=${encodeURIComponent(token)}`, '_blank', 'noopener');
      toast('Impersonation session opened in new tab (15 min)');
    } catch (e: any) { toast(e?.response?.data?.error || 'Failed to impersonate'); }
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      switch (confirmAction.type) {
        case 'extendTrial':            await extendTrial(); break;
        case 'impersonate':            await impersonate(); break;
        case 'deactivate':
        case 'reactivate':             await toggleActive(); break;
      }
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api.post(`/admin/support/notes/${tenantId}`, { note });
      setNote('');
      toast('Note added');
      load();
    } catch { toast('Failed to add note'); }
    setSaving(false);
  }

  async function loadDeliveries(page: number) {
    setDlLoading(true);
    setDlPage(page);
    try {
      const res = await api.get(`/admin/delivery-logs?tenantId=${tenantId}&page=${page}&limit=20`);
      setDeliveries(res.data.logs || []);
      setDlTotal(res.data.total || 0);
    } catch { /**/ }
    setDlLoading(false);
  }

  async function loadFlags() {
    setFlagsLoading(true);
    try {
      const res = await api.get(`/admin/tenants/${tenantId}/flags`);
      setFlags(res.data.flags || {});
    } catch { /**/ }
    setFlagsLoading(false);
  }

  async function toggleFlag(flag: string, enabled: boolean) {
    const prev = { ...flags };
    setFlags(f => ({ ...f, [flag]: enabled }));
    try {
      await api.patch(`/admin/tenants/${tenantId}/flags`, { flag, enabled });
    } catch {
      setFlags(prev);
      toast('Failed to update flag');
    }
  }

  async function loadOrders(page: number, status: string) {
    setOrdersLoading(true);
    setOrdersPage(page);
    setSelectedOrder(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (status) params.set('status', status);
      const res = await api.get(`/admin/tenants/${tenantId}/orders?${params}`);
      setOrders(res.data.orders || []);
      setOrdersTotal(res.data.total || 0);
    } catch { /**/ }
    setOrdersLoading(false);
  }

  async function loadCustomers(page: number, search: string) {
    setCustomersLoading(true);
    setCustomersPage(page);
    setSelectedCustomer(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/admin/tenants/${tenantId}/customers?${params}`);
      setCustomers(res.data.customers || []);
      setCustomersTotal(res.data.total || 0);
    } catch { /**/ }
    setCustomersLoading(false);
  }

  async function loadCustomerDetail(cid: string) {
    setCustomerDetailLoading(true);
    try {
      const res = await api.get(`/admin/tenants/${tenantId}/customers/${cid}`);
      setSelectedCustomer(res.data);
    } catch { toast('Failed to load customer'); }
    setCustomerDetailLoading(false);
  }

  async function loadOrderDetail(oid: string) {
    setOrderDetailLoading(true);
    try {
      const res = await api.get(`/admin/tenants/${tenantId}/orders/${oid}`);
      setSelectedOrder(res.data.order);
    } catch { toast('Failed to load order detail'); }
    setOrderDetailLoading(false);
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const res = await api.get(`/admin/tenants/${tenantId}/analytics`);
      setAnalytics(res.data);
    } catch { toast('Failed to load analytics'); }
    setAnalyticsLoading(false);
  }

  async function loadTenantSettings() {
    setSettingsLoading(true);
    try {
      const res = await api.get(`/admin/tenants/${tenantId}/settings`);
      setTenantSettings(res.data);
    } catch { toast('Failed to load settings'); }
    setSettingsLoading(false);
  }

  async function saveSettings() {
    if (!settingsDraft) return;
    setSettingsSaving(true);
    try {
      await api.patch(`/admin/tenants/${tenantId}/settings`, {
        businessName:  settingsDraft.businessName,
        settings: {
          timezone:    settingsDraft.settings?.timezone,
          currency:    settingsDraft.settings?.currency,
          orderPrefix: settingsDraft.settings?.orderPrefix,
          density:     settingsDraft.settings?.density,
        },
        invoiceConfig: {
          prefix:    settingsDraft.invoiceConfig?.prefix,
          gstin:     settingsDraft.invoiceConfig?.gstin,
          upiId:     settingsDraft.invoiceConfig?.upiId,
          showUpiQr: settingsDraft.invoiceConfig?.showUpiQr,
        },
      });
      setTenantSettings(settingsDraft);
      setSettingsDraft(null);
      toast('Settings saved');
    } catch { toast('Failed to save settings'); }
    setSettingsSaving(false);
  }

  async function loadWaAgent() {
    setWaAgentLoading(true);
    try {
      const res = await api.get(`/admin/tenants/${tenantId}/wa-agent`);
      setWaAgent(res.data);
    } catch { setWaAgent(null); }
    setWaAgentLoading(false);
  }

  async function provisionWaAgent() {
    if (!waAgentProvisionForm) return;
    setWaAgentSaving(true);
    try {
      await api.post(`/admin/tenants/${tenantId}/wa-agent`, waAgentProvisionForm);
      toast('WA Agent provisioned');
      setWaAgentProvisionForm(null);
      await loadWaAgent();
    } catch (e: any) { toast(e?.response?.data?.error || 'Provisioning failed'); }
    setWaAgentSaving(false);
  }

  async function saveWaTemplates() {
    if (!waAgentTemplatesDraft) return;
    setWaAgentSaving(true);
    try {
      await api.patch(`/admin/tenants/${tenantId}/wa-agent/templates`, waAgentTemplatesDraft);
      setWaAgent((w: any) => ({ ...w, courierTemplates: waAgentTemplatesDraft }));
      setWaAgentTemplatesDraft(null);
      toast('Templates saved');
    } catch (e: any) { toast(e?.response?.data?.error || 'Failed to save templates'); }
    setWaAgentSaving(false);
  }

  async function loadTeam() {
    setTeamLoading(true);
    try {
      const res = await api.get(`/admin/tenants/${tenantId}/users`);
      setTeamData(res.data);
    } catch { toast('Failed to load team'); }
    setTeamLoading(false);
  }

  async function loadProducts(page: number, search: string) {
    setProductsLoading(true);
    setProductsPage(page);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/admin/tenants/${tenantId}/products?${params}`);
      setProducts(res.data.products || []);
      setProductsTotal(res.data.total || 0);
    } catch { /**/ }
    setProductsLoading(false);
  }

  async function loadInvoices(page: number) {
    setInvoicesLoading(true);
    setInvoicesPage(page);
    try {
      const res = await api.get(`/admin/tenants/${tenantId}/invoices?page=${page}&limit=25`);
      setInvoices(res.data.invoices || []);
      setInvoicesTotal(res.data.total || 0);
    } catch { /**/ }
    setInvoicesLoading(false);
  }

  async function loadOverdue(page: number) {
    setOverdueLoading(true);
    setOverduePage(page);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25', hasBalance: 'true' });
      const res = await api.get(`/admin/tenants/${tenantId}/orders?${params}`);
      setOverdueOrders(res.data.orders || []);
      setOverdueTotal(res.data.total || 0);
    } catch { /**/ }
    setOverdueLoading(false);
  }

  function timeAgo(d: string) {
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  function maskRecipient(s: string) {
    if (!s) return '—';
    return s.slice(0, 3) + '***';
  }

  if (loading) return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Sk w={80} h={11} mb={8} />
          <Sk w={220} h={24} mb={6} />
          <Sk w={200} h={13} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Sk w={90} h={32} r={7} /><Sk w={90} h={32} r={7} /><Sk w={100} h={32} r={7} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[0,1,2,3,4].map(i => <SkStatCard key={i} />)}
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        {[0,1,2].map(i => <div key={i} style={{ padding: '9px 16px' }}><Sk w={70} h={13} /></div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SkDetailCard rows={6} />
        <SkDetailCard rows={3} />
      </div>
    </div>
  );
  if (!data) return (
    <div className="empty-state" style={{ padding: 80 }}>
      <div className="empty-icon">🏢</div>
      <div className="empty-title">Tenant not found</div>
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => router.back()}>← Go back</button>
    </div>
  );

  const { tenant, subscription: sub, userCount, orderCount, notes, lastActiveAt, ordersByStatus } = data;
  const canEdit = hasRole(admin, 'superadmin', 'ops_admin');

  const navGroups = useMemo(() => [
    {
      label: 'Overview',
      items: [
        { id: 'overview', label: 'Overview' },
        { id: 'analytics', label: 'Analytics' },
      ],
    },
    {
      label: 'Commerce',
      items: [
        { id: 'orders', label: 'Orders' },
        { id: 'customers', label: 'Customers' },
        { id: 'products', label: 'Products' },
        { id: 'invoices', label: 'Invoices' },
        { id: 'overdue', label: 'Outstanding' },
      ],
    },
    {
      label: 'Account',
      items: [
        { id: 'subscription', label: 'Subscription' },
        { id: 'team', label: 'Team' },
        { id: 'settings', label: 'Settings' },
      ],
    },
    {
      label: 'Admin',
      items: [
        { id: 'notes', label: 'Notes' },
        { id: 'deliveries', label: 'Deliveries' },
        ...(hasRole(admin, 'superadmin') ? [{ id: 'flags', label: 'Flags' }] : []),
      ],
    },
  ], [admin]);

  const ACTIONS = {
    extendTrial: {
      type: 'extendTrial',
      title: 'Extend Trial',
      message: `Extend trial for ${tenant.businessName}?`,
      detail: 'Trial will be extended from today.',
      level: 'warning',
      verifyText: null,
      confirmLabel: 'Extend Trial',
      confirmClass: 'btn-primary',
    },
    impersonate: {
      type: 'impersonate',
      title: 'Impersonate Tenant',
      message: `Open a 15-minute admin session as ${tenant.businessName}? A new tab will open in the tenant app. This action is audit-logged.`,
      detail: 'The session token expires in 15 minutes and cannot be extended.',
      level: 'warning',
      verifyText: null,
      confirmLabel: 'Open Session',
      confirmClass: 'btn-primary',
    },
    deactivate: {
      type: 'deactivate',
      title: 'Deactivate Tenant',
      message: `This will immediately lock out all users of ${tenant.businessName}.`,
      detail: 'The tenant will lose access to their account until reactivated.',
      level: 'danger',
      verifyText: tenant.businessName,
      confirmLabel: 'Deactivate',
      confirmClass: 'btn-danger',
    },
    reactivate: {
      type: 'reactivate',
      title: 'Reactivate Tenant',
      message: `Reactivate ${tenant.businessName} and restore full access?`,
      detail: null,
      level: 'warning',
      verifyText: null,
      confirmLabel: 'Reactivate',
      confirmClass: 'btn-primary',
    },
  };

  return (
    <div className="animate-fade-in">
      {toastMsg && <div className="toast toast-default">{toastMsg}</div>}

      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
          loading={actionLoading}
          trialDays={trialDays}
          setTrialDays={setTrialDays}
        />
      )}

      {overrideOpen && sub && (
        <OverridePlanModal
          subId={sub._id}
          current={sub}
          onClose={() => setOverrideOpen(false)}
          onSuccess={() => { setOverrideOpen(false); load(); }}
          toast={toast}
        />
      )}

      {statusModal && (
        <OrderStatusModal
          order={statusModal.order}
          tenantId={tenantId}
          onClose={() => setStatusModal(null)}
          onSuccess={() => { setStatusModal(null); loadOrders(ordersPage, ordersStatus); setSelectedOrder(null); }}
          toast={toast}
        />
      )}
      {paymentModal && (
        <RecordPaymentModal
          order={paymentModal.order}
          tenantId={tenantId}
          onClose={() => setPaymentModal(null)}
          onSuccess={() => { setPaymentModal(null); loadOrderDetail(paymentModal.order._id); }}
          toast={toast}
        />
      )}
      {commentModal && (
        <AddCommentModal
          order={commentModal.order}
          tenantId={tenantId}
          onClose={() => setCommentModal(null)}
          onSuccess={() => { setCommentModal(null); loadOrderDetail(commentModal.order._id); }}
          toast={toast}
        />
      )}
      {dispatchModal && (
        <DispatchModal
          order={dispatchModal.order}
          tenantId={tenantId}
          onClose={() => setDispatchModal(null)}
          onSuccess={() => { setDispatchModal(null); loadOrders(ordersPage, ordersStatus); setSelectedOrder(null); }}
          toast={toast}
        />
      )}
      {editCustomerModal && (
        <EditCustomerModal
          customer={editCustomerModal.customer}
          tenantId={tenantId}
          onClose={() => setEditCustomerModal(null)}
          onSuccess={() => { setEditCustomerModal(null); loadCustomerDetail(editCustomerModal.customer._id); }}
          toast={toast}
        />
      )}

      {/* ── Back ──────────────────────────────────────────── */}
      <button
        onClick={() => router.back()}
        style={{ background: 'none', border: 'none', color: 'var(--ink-4)', fontSize: 13, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontFamily: 'inherit' }}
      >
        ← Back to Tenants
      </button>

      {/* ── Header row: name + inline actions ─────────── */}
      <div className="tenant-header-row">
        <div className="tenant-header">
          <div className="tenant-name">{tenant.businessName}</div>
          <div className="tenant-meta">
            <span>{tenant.email}</span>
            <span>·</span>
            <span>{tenant.phone}</span>
            <span>·</span>
            <span>Joined {fmtDate(tenant.createdAt)}</span>
            <span className={`badge ${tenant.isActive ? 'badge-green' : 'badge-red'}`}>
              {tenant.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmAction(ACTIONS.extendTrial)}>
              <Calendar size={14} style={{ marginRight: 5 }} />
              Extend Trial
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setConfirmAction(ACTIONS.impersonate)}>
              <UserCheck size={14} style={{ marginRight: 5 }} />
              Impersonate
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setOverrideOpen(true)}>Override Plan</button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmAction(tenant.isActive ? ACTIONS.deactivate : ACTIONS.reactivate)}
            >
              <ShieldOff size={14} style={{ marginRight: 5 }} />
              {tenant.isActive ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        )}
      </div>

      {/* ── Stat cards ────────────────────────────────── */}
      <div className="tenant-stats-grid">
        <div className="stat-card">
          <div className="stat-label">Plan</div>
          <div className="stat-value" style={{ textTransform: 'capitalize', fontSize: 18 }}>{tenant.planId}</div>
          <span className={`badge ${PLAN_BADGE[tenant.planId] || 'badge-gray'}`}>{tenant.planId}</span>
        </div>
        {[
          { label: 'Users', value: userCount },
          { label: 'Total Orders', value: orderCount },
          { label: 'Orders This Month', value: tenant.ordersThisMonth },
          { label: 'Last Active', value: lastActiveAt ? timeAgo(lastActiveAt) : '—' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Body: sidebar nav + tab content ─────────── */}
      <div className="tenant-detail-body">
        <div className="tenant-nav-mobile">
          <select
            className="admin-input"
            value={tab}
            onChange={e => setTab(e.target.value as TabId)}
            style={{ maxWidth: 280 }}
          >
            {navGroups.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <nav className="tenant-sidebar-nav">
          {navGroups.map(group => (
            <div key={group.label} className="tenant-nav-section">
              <div className="tenant-nav-section-label">{group.label}</div>
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`tenant-nav-item${tab === item.id ? ' active' : ''}`}
                  onClick={() => setTab(item.id as typeof tab)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ minWidth: 0 }}>
      {/* Tab content */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="admin-card">
              <div className="card-header">
                <div className="card-title">Business Info</div>
              </div>
              <div className="card-body">
                {[
                  ['Owner', tenant.ownerName],
                  ['Category', tenant.category],
                  ['Slug', tenant.slug],
                  ['Joined', fmtDate(tenant.createdAt)],
                  ['Trial Ends', fmtDate(tenant.trialEndsAt)],
                  ['Status', tenant.isActive ? 'Active' : 'Inactive'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                    <span style={{ color: 'var(--ink-4)' }}>{k}</span>
                    <span className="cell-main">{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-card">
              <div className="card-header">
                <div className="card-title">Plan Limits</div>
              </div>
              <div className="card-body">
                {[
                  ['Orders/mo', tenant.planLimits?.orders === 0 ? 'Unlimited' : tenant.planLimits?.orders],
                  ['Seats', tenant.planLimits?.seats],
                  ['Features', (tenant.planLimits?.features || []).length + ' enabled'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                    <span style={{ color: 'var(--ink-4)' }}>{k}</span>
                    <span className="cell-main">{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* D — Order Activity grid */}
          <div className="admin-card">
            <div className="card-header">
              <div className="card-title">Order Activity</div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="order-activity-grid">
                {ALL_STATUSES.map(status => (
                  <div className="order-activity-cell" key={status}>
                    <span className={`order-activity-count${(ordersByStatus?.[status] ?? 0) === 0 ? ' zero' : ''}`}>
                      {ordersByStatus?.[status] ?? 0}
                    </span>
                    <span className={`badge ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'subscription' && (
        <div className="admin-card">
          {sub ? (
            <>
              <div className="card-header">
                <div className="card-title">Subscription</div>
              </div>
              <div className="card-body">
                {[
                  ['Plan', sub.planName],
                  ['Status', sub.status],
                  ['Cycle', sub.billingCycle],
                  ['Amount', sub.amount ? fmt(sub.amount) : '—'],
                  ['Seats', sub.seats],
                  ['Period Start', fmtDate(sub.currentPeriodStart)],
                  ['Period End', fmtDate(sub.currentPeriodEnd)],
                  ['Razorpay Sub ID', sub.razorpaySubId || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--ink-4)' }}>{k}</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 500, fontFamily: k?.toString().includes('ID') ? 'var(--font-mono)' : undefined, fontSize: k?.toString().includes('ID') ? 11 : 13 }}>{v?.toString() || '—'}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="card-body" style={{ textAlign: 'center', color: 'var(--ink-4)' }}>No active subscription — on trial</div>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div>
          {canEdit && (
            <div className="admin-card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a support note…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div className="card-footer">
                <button className="btn btn-primary btn-sm" onClick={addNote} disabled={saving}>
                  {saving ? <><span className="spinner" />Saving…</> : 'Add Note'}
                </button>
              </div>
            </div>
          )}
          <div className="admin-card">
            {(notes || []).length === 0
              ? <div className="card-body" style={{ textAlign: 'center', color: 'var(--ink-4)' }}>No notes yet</div>
              : (notes || []).map((n: any) => (
                  <div key={n._id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 6, lineHeight: 1.5 }}>{n.note}</div>
                    <div className="cell-sub">{n.addedByEmail} · {fmtDate(n.createdAt)}</div>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div>
          {/* Status filter chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {(['', ...ALL_STATUSES] as const).map((s: any) => (
              <button
                key={s || 'all'}
                className={`btn btn-ghost btn-sm${ordersStatus === s ? ' active' : ''}`}
                style={{ fontWeight: ordersStatus === s ? 600 : 400 }}
                onClick={() => { setOrdersStatus(s); loadOrders(1, s); }}
              >
                {s ? STATUS_LABEL[s] : 'All'}
              </button>
            ))}
          </div>

          {ordersLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : (
            <>
              <div className="admin-card">
                <div className="table-shell">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Order ID</th><th>Customer</th><th>Status</th><th>Amount</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {orders.map((o: any) => (
                        <>
                          <tr
                            key={o._id}
                            style={{ cursor: 'pointer', background: selectedOrder?._id === o._id ? 'var(--surface-selected, var(--surface-hover))' : undefined }}
                            onClick={() => selectedOrder?._id === o._id ? setSelectedOrder(null) : loadOrderDetail(o._id)}
                          >
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.orderId || o._id?.toString().slice(-8)}</td>
                            <td>
                              <div className="cell-main">{o.customerName || o.customer?.name || '—'}</div>
                              <div className="cell-sub">{o.customerPhone || o.customer?.phone || ''}</div>
                            </td>
                            <td><span className={`badge ${STATUS_COLOR[o.status] || 'badge-gray'}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                            <td style={{ fontVariantNumeric: 'tabular-nums' }}>{o.totalAmount || o.amount ? fmt(o.totalAmount || o.amount) : '—'}</td>
                            <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{fmtDate(o.createdAt)}</td>
                          </tr>
                          {selectedOrder?._id === o._id && (
                            <tr key={`${o._id}-detail`}>
                              <td colSpan={5} style={{ padding: 0 }}>
                                {orderDetailLoading ? (
                                  <div style={{ padding: '20px 18px', color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>
                                ) : selectedOrder && (
                                  <div style={{ padding: '16px 18px', background: 'var(--surface-soft, var(--surface))', borderTop: '1px solid var(--line)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px 24px', marginBottom: 14 }}>
                                      {[
                                        ['Payment', selectedOrder.paymentStatus || '—'],
                                        ['Mode', selectedOrder.paymentMode || '—'],
                                        ['Paid', selectedOrder.amountPaid != null ? fmt(selectedOrder.amountPaid) : '—'],
                                        ['Balance', selectedOrder.balanceDue != null ? fmt(selectedOrder.balanceDue) : '—'],
                                        ['Courier', selectedOrder.courier?.name || '—'],
                                        ['Tracking', selectedOrder.courier?.trackingNumber || '—'],
                                        ['Items', (selectedOrder.items?.length || 0) + ' item(s)'],
                                        ['Admin Notes', (selectedOrder.comments?.filter((c: any) => c.adminOnly) || []).length + ' note(s)'],
                                      ].map(([k, v]) => (
                                        <div key={k as string}>
                                          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 3 }}>{k}</div>
                                          <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: ['Courier', 'Tracking'].includes(k as string) ? 'var(--font-mono)' : undefined }}>{v}</div>
                                        </div>
                                      ))}
                                    </div>
                                    {['returned', 'rto', 'cancelled'].includes(selectedOrder.status) && (
                                      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginBottom: 12 }}>
                                        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 8 }}>Return / Refund</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px 24px' }}>
                                          {[
                                            selectedOrder.rto?.reason       ? ['RTO Reason',      selectedOrder.rto.reason]       : null,
                                            selectedOrder.rto?.resolution   ? ['RTO Resolution',  selectedOrder.rto.resolution]   : null,
                                            selectedOrder.cancellation?.reason ? ['Cancel Reason', selectedOrder.cancellation.reason] : null,
                                            selectedOrder.cancellation?.refundStatus && selectedOrder.cancellation.refundStatus !== 'not_applicable'
                                              ? ['Refund Status', selectedOrder.cancellation.refundStatus] : null,
                                            selectedOrder.refundRequest?.status ? ['Refund Request', selectedOrder.refundRequest.status] : null,
                                            selectedOrder.refundRequest?.amount != null ? ['Refund Amount', fmt(selectedOrder.refundRequest.amount)] : null,
                                          ].filter((entry): entry is [string, string] => entry !== null).map(([k, v]) => (
                                            <div key={k as string}>
                                              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 3 }}>{k}</div>
                                              <div style={{ fontSize: 13, color: 'var(--ink)', textTransform: 'capitalize' }}>{v}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {canEdit && (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setStatusModal({ order: selectedOrder })}>
                                          Update Status
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setDispatchModal({ order: selectedOrder })}>
                                          {['dispatched', 'delivered', 'rto'].includes(selectedOrder.status) ? 'Update Courier' : 'Dispatch'}
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setPaymentModal({ order: selectedOrder })}>
                                          Record Payment
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setCommentModal({ order: selectedOrder })}>
                                          Add Note
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No orders found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {ordersTotal > 25 && (
                  <div className="pagination">
                    <span className="pagination-info">{(ordersPage - 1) * 25 + 1}–{Math.min(ordersPage * 25, ordersTotal)} of {ordersTotal}</span>
                    <div className="pagination-controls">
                      <button className="btn btn-ghost btn-sm" disabled={ordersPage === 1} onClick={() => loadOrders(ordersPage - 1, ordersStatus)}>← Prev</button>
                      <button className="btn btn-ghost btn-sm" disabled={ordersPage * 25 >= ordersTotal} onClick={() => loadOrders(ordersPage + 1, ordersStatus)}>Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'customers' && (
        <div>
          {/* Search bar */}
          <div style={{ marginBottom: 14 }}>
            <input
              className="admin-input"
              placeholder="Search by name, phone, or email…"
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadCustomers(1, customerSearch)}
              style={{ maxWidth: 340 }}
            />
          </div>

          {customersLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : selectedCustomer ? (
            /* Customer detail panel */
            <div>
              <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={() => setSelectedCustomer(null)}>
                ← Back to customers
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="admin-card">
                  <div className="card-header">
                    <div className="card-title">Customer Profile</div>
                    {canEdit && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditCustomerModal({ customer: selectedCustomer.customer })}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    {[
                      ['Name', selectedCustomer.customer?.name],
                      ['Phone', selectedCustomer.customer?.phone],
                      ['Email', selectedCustomer.customer?.email || '—'],
                      ['Instagram', selectedCustomer.customer?.instagramHandle || '—'],
                      ['Total Orders', selectedCustomer.customer?.totalOrders],
                      ['Total Spent', selectedCustomer.customer?.totalSpent ? fmt(selectedCustomer.customer.totalSpent) : '—'],
                      ['Last Order', selectedCustomer.customer?.lastOrderAt ? fmtDate(selectedCustomer.customer.lastOrderAt) : '—'],
                      ['Tags', (selectedCustomer.customer?.tags || []).join(', ') || '—'],
                      ['Notes', selectedCustomer.customer?.notes || '—'],
                    ].map(([k, v]) => (
                      <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                        <span style={{ color: 'var(--ink-4)' }}>{k}</span>
                        <span className="cell-main">{v?.toString() || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="admin-card">
                  <div className="card-header"><div className="card-title">Recent Orders</div></div>
                  {customerDetailLoading ? (
                    <div className="card-body" style={{ textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
                  ) : (
                    <div className="table-shell">
                      <table className="admin-table">
                        <thead><tr><th>ID</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
                        <tbody>
                          {(selectedCustomer.orders || []).map((o: any) => (
                            <tr key={o._id}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{o.orderId || o._id?.toString().slice(-8)}</td>
                              <td><span className={`badge ${STATUS_COLOR[o.status] || 'badge-gray'}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                              <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>{o.totalAmount || o.amount ? fmt(o.totalAmount || o.amount) : '—'}</td>
                              <td style={{ fontSize: 11, color: 'var(--ink-4)' }}>{fmtDate(o.createdAt)}</td>
                            </tr>
                          ))}
                          {(selectedCustomer.orders || []).length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-4)' }}>No orders</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-card">
              <div className="table-shell">
                <table className="admin-table">
                  <thead>
                    <tr><th>Name</th><th>Phone</th><th>Email</th><th>Orders</th><th>Spent</th><th>Last Order</th></tr>
                  </thead>
                  <tbody>
                    {customers.map((c: any) => (
                      <tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => loadCustomerDetail(c._id)}>
                        <td className="cell-main">{c.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.phone}</td>
                        <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{c.email || '—'}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{c.totalOrders || 0}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{c.totalSpent ? fmt(c.totalSpent) : '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{c.lastOrderAt ? fmtDate(c.lastOrderAt) : '—'}</td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No customers found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {customersTotal > 25 && (
                <div className="pagination">
                  <span className="pagination-info">{(customersPage - 1) * 25 + 1}–{Math.min(customersPage * 25, customersTotal)} of {customersTotal}</span>
                  <div className="pagination-controls">
                    <button className="btn btn-ghost btn-sm" disabled={customersPage === 1} onClick={() => loadCustomers(customersPage - 1, customerSearch)}>← Prev</button>
                    <button className="btn btn-ghost btn-sm" disabled={customersPage * 25 >= customersTotal} onClick={() => loadCustomers(customersPage + 1, customerSearch)}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'deliveries' && (
        <div>
          {dlLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : (
            <div className="admin-card">
              <div className="table-shell">
                <table className="admin-table">
                  <thead>
                    <tr><th>Time</th><th>Channel</th><th>Type</th><th>To</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d: any) => (
                      <tr key={d._id}>
                        <td style={{ fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>{timeAgo(d.sentAt)}</td>
                        <td><span className={`badge ${d.channel === 'email' ? 'badge-blue' : 'badge-green'}`} style={{ textTransform: 'capitalize' }}>{d.channel}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{d.messageType}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{maskRecipient(d.recipient)}</td>
                        <td>
                          <span className={`badge ${d.status === 'delivered' ? 'badge-green' : d.status === 'failed' ? 'badge-red' : d.status === 'bounced' ? 'badge-gold' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {deliveries.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No delivery logs yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {dlTotal > 20 && (
                <div className="pagination">
                  <span className="pagination-info">{(dlPage - 1) * 20 + 1}–{Math.min(dlPage * 20, dlTotal)} of {dlTotal}</span>
                  <div className="pagination-controls">
                    <button className="btn btn-ghost btn-sm" disabled={dlPage === 1} onClick={() => loadDeliveries(dlPage - 1)}>← Prev</button>
                    <button className="btn btn-ghost btn-sm" disabled={dlPage * 20 >= dlTotal} onClick={() => loadDeliveries(dlPage + 1)}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'analytics' && (
        <div>
          {analyticsLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : analytics ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div className="stat-card">
                  <div className="stat-label">Revenue This Month</div>
                  <div className="stat-value">{fmt(analytics.revenueThisMonth || 0)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Orders This Month</div>
                  <div className="stat-value">{analytics.ordersThisMonth || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Avg Order Value</div>
                  <div className="stat-value">
                    {analytics.ordersThisMonth ? fmt(Math.round((analytics.revenueThisMonth || 0) / analytics.ordersThisMonth)) : '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="admin-card">
                  <div className="card-header"><div className="card-title">Orders by Status</div></div>
                  <div className="table-shell">
                    <table className="admin-table">
                      <thead><tr><th>Status</th><th style={{ textAlign: 'right' }}>Count</th></tr></thead>
                      <tbody>
                        {(analytics.statusBreakdown || []).sort((a: any, b: any) => b.count - a.count).map((row: any) => (
                          <tr key={row._id}>
                            <td><span className={`badge ${STATUS_COLOR[row._id] || 'badge-gray'}`}>{STATUS_LABEL[row._id] || row._id}</span></td>
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="admin-card">
                  <div className="card-header"><div className="card-title">Payment Modes</div></div>
                  <div className="table-shell">
                    <table className="admin-table">
                      <thead><tr><th>Mode</th><th style={{ textAlign: 'right' }}>Orders</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                      <tbody>
                        {(analytics.paymentModeBreakdown || []).sort((a: any, b: any) => b.count - a.count).map((row: any) => (
                          <tr key={row._id}>
                            <td style={{ textTransform: 'capitalize' }}>{row._id || 'Unknown'}</td>
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.count}</td>
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.amount || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="admin-card">
                <div className="card-header"><div className="card-title">Daily Orders — Last 14 Days</div></div>
                <div className="table-shell">
                  <table className="admin-table">
                    <thead><tr><th>Date</th><th style={{ textAlign: 'right' }}>Orders</th><th style={{ textAlign: 'right' }}>Revenue</th></tr></thead>
                    <tbody>
                      {(analytics.dailyOrders || []).map((row: any) => (
                        <tr key={row._id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{row._id}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.count}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.revenue || 0)}</td>
                        </tr>
                      ))}
                      {(analytics.dailyOrders || []).length === 0 && (
                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-4)' }}>No orders in last 14 days</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>No analytics data</div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div>
          {settingsLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : tenantSettings ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Edit / Save / Cancel — ops_admin+ only */}
              {canEdit && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {settingsDraft ? (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSettingsDraft(null)} disabled={settingsSaving}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={saveSettings} disabled={settingsSaving}>
                        {settingsSaving ? <><span className="spinner" />Saving…</> : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => setSettingsDraft(JSON.parse(JSON.stringify(tenantSettings)))}>Edit Settings</button>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* General card */}
                <div className="admin-card">
                  <div className="card-header"><div className="card-title">General</div></div>
                  <div className="card-body">
                    {settingsDraft ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {([
                          ['Business Name', 'businessName',       (d: any) => d.businessName,              (d: any, v: string) => ({ ...d, businessName: v })],
                          ['Timezone',      'settings.timezone',  (d: any) => d.settings?.timezone,        (d: any, v: string) => ({ ...d, settings: { ...d.settings, timezone: v } })],
                          ['Currency',      'settings.currency',  (d: any) => d.settings?.currency,        (d: any, v: string) => ({ ...d, settings: { ...d.settings, currency: v } })],
                          ['Order Prefix',  'settings.prefix',    (d: any) => d.settings?.orderPrefix,     (d: any, v: string) => ({ ...d, settings: { ...d.settings, orderPrefix: v } })],
                          ['Density',       'settings.density',   (d: any) => d.settings?.density,         (d: any, v: string) => ({ ...d, settings: { ...d.settings, density: v } })],
                        ] as [string, string, (d: any) => any, (d: any, v: string) => any][]).map(([label, key, get, set]) => (
                          <div key={key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{label}</span>
                            <input className="admin-input" style={{ fontSize: 12, padding: '4px 8px' }}
                              value={get(settingsDraft) || ''}
                              onChange={e => setSettingsDraft((d: any) => set(d, e.target.value))} />
                          </div>
                        ))}
                        {[['Category', tenantSettings.category], ['Accent Color', tenantSettings.settings?.accentColor]].map(([k, v]) => (
                          <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: 'var(--ink-4)' }}>{k}</span>
                            <span className="cell-main" style={{ color: 'var(--ink-4)', fontStyle: 'italic' }}>{v?.toString() || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      [
                        ['Business Name', tenantSettings.businessName],
                        ['Category',      tenantSettings.category],
                        ['Timezone',      tenantSettings.settings?.timezone],
                        ['Currency',      tenantSettings.settings?.currency],
                        ['Order Prefix',  tenantSettings.settings?.orderPrefix],
                        ['Density',       tenantSettings.settings?.density],
                        ['Accent Color',  tenantSettings.settings?.accentColor],
                      ].map(([k, v]) => (
                        <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                          <span style={{ color: 'var(--ink-4)' }}>{k}</span>
                          <span className="cell-main">{v?.toString() || '—'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Invoice Config card */}
                <div className="admin-card">
                  <div className="card-header"><div className="card-title">Invoice Config</div></div>
                  <div className="card-body">
                    {settingsDraft ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {([
                          ['Prefix',  'invoiceConfig.prefix', (d: any) => d.invoiceConfig?.prefix, (d: any, v: string) => ({ ...d, invoiceConfig: { ...d.invoiceConfig, prefix: v } })],
                          ['GSTIN',   'invoiceConfig.gstin',  (d: any) => d.invoiceConfig?.gstin,  (d: any, v: string) => ({ ...d, invoiceConfig: { ...d.invoiceConfig, gstin: v } })],
                          ['UPI ID',  'invoiceConfig.upiId',  (d: any) => d.invoiceConfig?.upiId,  (d: any, v: string) => ({ ...d, invoiceConfig: { ...d.invoiceConfig, upiId: v } })],
                        ] as [string, string, (d: any) => any, (d: any, v: string) => any][]).map(([label, key, get, set]) => (
                          <div key={key} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{label}</span>
                            <input className="admin-input" style={{ fontSize: 12, padding: '4px 8px' }}
                              value={get(settingsDraft) || ''}
                              onChange={e => setSettingsDraft((d: any) => set(d, e.target.value))} />
                          </div>
                        ))}
                        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>Show UPI QR</span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <input type="checkbox" checked={!!settingsDraft.invoiceConfig?.showUpiQr}
                              onChange={e => setSettingsDraft((d: any) => ({ ...d, invoiceConfig: { ...d.invoiceConfig, showUpiQr: e.target.checked } }))} />
                            <span style={{ color: 'var(--ink-3)' }}>Enabled</span>
                          </label>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                          <span style={{ color: 'var(--ink-4)' }}>Current #</span>
                          <span className="cell-main" style={{ color: 'var(--ink-4)', fontStyle: 'italic' }}>{tenantSettings.invoiceConfig?.currentNumber ?? '—'}</span>
                        </div>
                      </div>
                    ) : (
                      [
                        ['Prefix',      tenantSettings.invoiceConfig?.prefix],
                        ['Current #',   tenantSettings.invoiceConfig?.currentNumber],
                        ['GSTIN',       tenantSettings.invoiceConfig?.gstin],
                        ['UPI ID',      tenantSettings.invoiceConfig?.upiId],
                        ['Show UPI QR', tenantSettings.invoiceConfig?.showUpiQr ? 'Yes' : 'No'],
                      ].map(([k, v]) => (
                        <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                          <span style={{ color: 'var(--ink-4)' }}>{k}</span>
                          <span className="cell-main">{v?.toString() || '—'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* WA Agent (Meta) card */}
              <div className="admin-card">
                <div className="card-header">
                  <div className="card-title">WA Agent (Meta)</div>
                  {waAgent?.provisioned && !waAgentTemplatesDraft && canEdit && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setWaAgentTemplatesDraft({ ...waAgent.courierTemplates })}>
                      Edit Templates
                    </button>
                  )}
                  {waAgentTemplatesDraft && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setWaAgentTemplatesDraft(null)} disabled={waAgentSaving}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={saveWaTemplates} disabled={waAgentSaving}>
                        {waAgentSaving ? <><span className="spinner" />Saving…</> : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="card-body">
                  {waAgentLoading ? (
                    <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>Loading…</div>
                  ) : !waAgent ? (
                    <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>Could not load WA Agent status</div>
                  ) : !waAgent.provisioned ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 14 }}>
                        <span style={{ color: 'var(--ink-4)' }}>Status</span>
                        <span className="badge badge-gray">Not provisioned</span>
                      </div>
                      {hasRole(admin, 'superadmin') && (
                        waAgentProvisionForm ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 4 }}>Provision WA Agent</div>
                            {([
                              ['Phone Number ID', 'phoneNumberId', 'text', 'Meta phone_number_id'],
                              ['WABA ID', 'whatsappBusinessAccountId', 'text', 'WhatsApp Business Account ID'],
                              ['Meta Token', 'metaWhatsappToken', 'password', 'System user token'],
                              ['Webhook Secret', 'metaWebhookSecret', 'password', 'Optional'],
                              ['Display Name', 'businessDisplayName', 'text', 'Shown in WA Agent config'],
                            ] as [string, string, string, string][]).map(([label, field, type, placeholder]) => (
                              <div key={field} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{label}</span>
                                <input
                                  className="admin-input" type={type} style={{ fontSize: 12, padding: '4px 8px' }}
                                  placeholder={placeholder}
                                  value={waAgentProvisionForm[field] || ''}
                                  onChange={e => setWaAgentProvisionForm((f: any) => ({ ...f, [field]: e.target.value }))}
                                />
                              </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => setWaAgentProvisionForm(null)} disabled={waAgentSaving}>Cancel</button>
                              <button className="btn btn-primary btn-sm" onClick={provisionWaAgent} disabled={waAgentSaving}>
                                {waAgentSaving ? <><span className="spinner" />Provisioning…</> : 'Provision'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-sm" onClick={() => setWaAgentProvisionForm({ phoneNumberId: '', whatsappBusinessAccountId: '', metaWhatsappToken: '', metaWebhookSecret: '', businessDisplayName: '' })}>
                            Provision WA Agent
                          </button>
                        )
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: 'var(--ink-4)' }}>Status</span>
                        <span className="badge badge-green">Provisioned</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 14 }}>
                        <span style={{ color: 'var(--ink-4)' }}>Agent ID</span>
                        <span className="cell-main" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{waAgent.waAgentTenantId}</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 8 }}>Courier Templates</div>
                      {waAgentTemplatesDraft ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                          {(['default', 'delhivery', 'shiprocket', 'dtdc', 'ekart', 'bluedart'] as const).map(courier => (
                            <div key={courier} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontSize: 11, color: 'var(--ink-4)', textTransform: 'capitalize' }}>{courier}</span>
                              <input className="admin-input" style={{ fontSize: 12, padding: '4px 8px' }}
                                placeholder="template_name"
                                value={waAgentTemplatesDraft[courier] || ''}
                                onChange={e => setWaAgentTemplatesDraft((d: any) => ({ ...d, [courier]: e.target.value }))} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          {(['default', 'delhivery', 'shiprocket', 'dtdc', 'ekart', 'bluedart'] as const).map(courier => {
                            const name = waAgent.courierTemplates?.[courier];
                            return (
                              <div key={courier} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: 'var(--ink-4)', textTransform: 'capitalize' }}>{courier}</span>
                                <span className={`badge ${name ? 'badge-green' : 'badge-gray'}`}>{name ? 'Set' : 'Not set'}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>No settings data</div>
          )}
        </div>
      )}

      {tab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {teamLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : teamData ? (
            <>
              <div className="admin-card">
                <div className="card-header">
                  <div className="card-title">Team Members</div>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{(teamData.users || []).length} active</span>
                </div>
                <div className="table-shell">
                  <table className="admin-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last Active</th><th>Joined</th></tr></thead>
                    <tbody>
                      {(teamData.users || []).map((u: any) => (
                        <tr key={u._id}>
                          <td className="cell-main">{u.name}</td>
                          <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{u.email}</td>
                          <td><span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{u.lastActive ? timeAgo(u.lastActive) : '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{fmtDate(u.createdAt)}</td>
                        </tr>
                      ))}
                      {(teamData.users || []).length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-4)' }}>No active members</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="admin-card">
                <div className="card-header">
                  <div className="card-title">Pending Invites</div>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{(teamData.invites || []).length} pending</span>
                </div>
                <div className="table-shell">
                  <table className="admin-table">
                    <thead><tr><th>Email</th><th>Role</th><th>Invited By</th><th>Expires</th></tr></thead>
                    <tbody>
                      {(teamData.invites || []).map((inv: any) => (
                        <tr key={inv._id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{inv.email}</td>
                          <td><span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{inv.role}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{inv.invitedBy?.name || inv.invitedBy?.email || '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{fmtDate(inv.expiresAt)}</td>
                        </tr>
                      ))}
                      {(teamData.invites || []).length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-4)' }}>No pending invites</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>No team data</div>
          )}
        </div>
      )}

      {tab === 'overdue' && (
        <div>
          {overdueLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : (
            <div className="admin-card">
              <div className="card-header">
                <div className="card-title">Orders with Outstanding Balance</div>
                <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{overdueTotal} total</span>
              </div>
              <div className="table-shell">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th><th>Customer</th><th>Status</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>Paid</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueOrders.map((o: any) => (
                      <tr key={o._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.orderId || o._id?.toString().slice(-8)}</td>
                        <td>
                          <div className="cell-main">{o.customerName || o.customer?.name || '—'}</div>
                          <div className="cell-sub">{o.customerPhone || o.customer?.phone || ''}</div>
                        </td>
                        <td><span className={`badge ${STATUS_COLOR[o.status] || 'badge-gray'}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{o.totalAmount ? fmt(o.totalAmount) : '—'}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--green)' }}>{o.amountPaid ? fmt(o.amountPaid) : '—'}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--red)', fontWeight: 600 }}>{o.balanceDue ? fmt(o.balanceDue) : '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{fmtDate(o.createdAt)}</td>
                      </tr>
                    ))}
                    {overdueOrders.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No orders with outstanding balance</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {overdueTotal > 25 && (
                <div className="pagination">
                  <span className="pagination-info">{(overduePage - 1) * 25 + 1}–{Math.min(overduePage * 25, overdueTotal)} of {overdueTotal}</span>
                  <div className="pagination-controls">
                    <button className="btn btn-ghost btn-sm" disabled={overduePage === 1} onClick={() => loadOverdue(overduePage - 1)}>← Prev</button>
                    <button className="btn btn-ghost btn-sm" disabled={overduePage * 25 >= overdueTotal} onClick={() => loadOverdue(overduePage + 1)}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'products' && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <input
              className="admin-input"
              placeholder="Search by name or SKU…"
              value={productsSearch}
              onChange={e => setProductsSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadProducts(1, productsSearch)}
              style={{ maxWidth: 340 }}
            />
          </div>
          {productsLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : (
            <div className="admin-card">
              <div className="table-shell">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>SKU</th><th>Category</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p: any) => (
                      <tr key={p._id}>
                        <td>
                          <div className="cell-main">{p.name}</div>
                          {(p.variants || []).length > 0 && (
                            <div className="cell-sub">{p.variants.length} variant{p.variants.length !== 1 ? 's' : ''}</div>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.sku || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{p.category || '—'}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.price || 0)}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {p.totalStock == null ? (
                            <span style={{ color: 'var(--ink-4)' }}>—</span>
                          ) : (
                            <span style={{ color: p.lowStock ? 'var(--red)' : undefined, fontWeight: p.lowStock ? 600 : undefined }}>
                              {p.totalStock}
                              {p.lowStock && <span style={{ marginLeft: 6, fontSize: 10 }}>LOW</span>}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${p.isActive ? 'badge-green' : 'badge-gray'}`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No products found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {productsTotal > 50 && (
                <div className="pagination">
                  <span className="pagination-info">{(productsPage - 1) * 50 + 1}–{Math.min(productsPage * 50, productsTotal)} of {productsTotal}</span>
                  <div className="pagination-controls">
                    <button className="btn btn-ghost btn-sm" disabled={productsPage === 1} onClick={() => loadProducts(productsPage - 1, productsSearch)}>← Prev</button>
                    <button className="btn btn-ghost btn-sm" disabled={productsPage * 50 >= productsTotal} onClick={() => loadProducts(productsPage + 1, productsSearch)}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'invoices' && (
        <div>
          {invoicesLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : (
            <div className="admin-card">
              <div className="table-shell">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th><th>Customer</th><th>Order ID</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th>Payment</th><th>Date</th><th>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => (
                      <tr key={inv._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{inv.invoiceNumber}</td>
                        <td className="cell-main">{inv.customer?.name || '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)' }}>
                          {inv.orderId ? inv.orderId.toString().slice(-8) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(inv.grandTotal || 0)}</td>
                        <td>
                          <span className={`badge ${inv.paymentStatus === 'paid' ? 'badge-green' : inv.paymentStatus ? 'badge-amber' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                            {inv.paymentStatus || '—'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                          {inv.invoiceDate ? fmtDate(inv.invoiceDate) : fmtDate(inv.createdAt)}
                        </td>
                        <td>
                          {inv.invoiceUrl ? (
                            <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>
                              View PDF
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>No invoices generated yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {invoicesTotal > 25 && (
                <div className="pagination">
                  <span className="pagination-info">{(invoicesPage - 1) * 25 + 1}–{Math.min(invoicesPage * 25, invoicesTotal)} of {invoicesTotal}</span>
                  <div className="pagination-controls">
                    <button className="btn btn-ghost btn-sm" disabled={invoicesPage === 1} onClick={() => loadInvoices(invoicesPage - 1)}>← Prev</button>
                    <button className="btn btn-ghost btn-sm" disabled={invoicesPage * 25 >= invoicesTotal} onClick={() => loadInvoices(invoicesPage + 1)}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'flags' && hasRole(admin, 'superadmin') && (
        <div>
          {flagsLoading ? (
            <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>Loading…</div>
          ) : (
            <div className="admin-card">
              <div className="card-header">
                <div className="card-title">Feature Flags</div>
              </div>
              <div className="card-body">
                {['whatsapp_automation_early_access', 'analytics_starter_unlock', 'advance_bookings_trial', 'dedicated_onboarding'].map(flag => (
                  <div key={flag} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                    <div>
                      <div className="cell-main" style={{ fontFamily: 'var(--font-mono)' }}>{flag}</div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={flags[flag] === true}
                        onChange={e => toggleFlag(flag, e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12, color: flags[flag] ? 'var(--green)' : 'var(--ink-4)' }}>
                        {flags[flag] ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
        </div>{/* /tab content wrapper */}
      </div>{/* /tenant-detail-body */}
    </div>
  );
}
