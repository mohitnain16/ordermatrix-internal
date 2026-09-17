'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, CreditCard, Users, FileText,
  TrendingUp, Headphones, Activity, AlertTriangle, Megaphone, Mail,
  ShieldCheck, Tag, UserPlus, MessageCircle, AlertCircle, Search, X,
} from 'lucide-react';
import { getAdmin, hasRole, type AdminRole } from '../../lib/auth';

const PALETTE_ITEMS = [
  { href: '/superadmin',              label: 'Platform Pulse', section: 'Super Admin', icon: LayoutDashboard, roles: ['superadmin', 'ops_admin'] as const },
  { href: '/superadmin/tenants',       label: 'Tenants',        section: 'Super Admin', icon: Building2,       roles: ['superadmin', 'ops_admin'] as const },
  { href: '/superadmin/subscriptions', label: 'Subscriptions',  section: 'Super Admin', icon: CreditCard,      roles: ['superadmin', 'ops_admin'] as const },
  { href: '/superadmin/users',         label: 'All Users',      section: 'Super Admin', icon: Users,           roles: ['superadmin', 'ops_admin'] as const },
  { href: '/superadmin/audit-log',     label: 'Audit Log',      section: 'Super Admin', icon: FileText,        roles: ['superadmin', 'ops_admin'] as const },
  { href: '/superadmin/coupons',       label: 'Coupons',        section: 'Super Admin', icon: Tag,             roles: ['superadmin', 'ops_admin'] as const },
  { href: '/superadmin/team',          label: 'Team',           section: 'Super Admin', icon: ShieldCheck,     roles: ['superadmin'] as const },
  { href: '/superadmin/wa-agent',      label: 'WA Agent',       section: 'Super Admin', icon: MessageCircle,   roles: ['superadmin'] as const },
  { href: '/superadmin/enquiries',     label: 'Enquiries',      section: 'Super Admin', icon: Mail,            roles: ['superadmin', 'ops_admin', 'support'] as const },
  { href: '/sales',                    label: 'Sales',          section: 'Growth',      icon: TrendingUp,      roles: ['superadmin', 'ops_admin', 'sales'] as const },
  { href: '/sales/leads',              label: 'Lead Captures',  section: 'Growth',      icon: UserPlus,        roles: ['superadmin', 'ops_admin', 'sales'] as const },
  { href: '/lifecycle',                label: 'Lifecycle',      section: 'Growth',      icon: Activity,        roles: ['superadmin', 'ops_admin', 'sales'] as const },
  { href: '/billing',                  label: 'Billing Ops',    section: 'Growth',      icon: AlertTriangle,   roles: ['superadmin', 'ops_admin', 'sales'] as const },
  { href: '/communications',           label: 'Comms',          section: 'Growth',      icon: Megaphone,       roles: ['superadmin', 'ops_admin', 'sales'] as const },
  { href: '/support',                  label: 'Support',        section: 'Support',     icon: Headphones,      roles: ['superadmin', 'ops_admin', 'support'] as const },
  { href: '/support/issues',           label: 'Issues',         section: 'Support',     icon: AlertCircle,     roles: ['superadmin', 'ops_admin', 'support'] as const },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery]       = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();
  const admin    = getAdmin();

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = PALETTE_ITEMS
    .filter(item => !admin || hasRole(admin, ...(item.roles as readonly AdminRole[])))
    .filter(item => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return item.label.toLowerCase().includes(q) || item.section.toLowerCase().includes(q);
    });

  useEffect(() => { setActiveIdx(0); }, [query]);

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape')    { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) navigate(results[activeIdx].href);
  }

  if (!open) return null;

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,13,16,0.45)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', top: '18vh', left: '50%', transform: 'translateX(-50%)',
        width: 480, maxWidth: 'calc(100vw - 32px)',
        background: 'var(--surface)', border: '1px solid var(--line-2)',
        borderRadius: 12, boxShadow: '0 8px 32px rgba(11,13,16,0.16)',
        zIndex: 201, overflow: 'hidden',
      }}>
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
          <Search size={15} strokeWidth={1.8} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages…"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--font-sans)',
            }}
          />
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', display: 'flex', padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '4px 0' }}>
          {results.length === 0 ? (
            <div style={{ padding: '24px 14px', fontSize: 13, color: 'var(--ink-4)', textAlign: 'center' }}>
              No pages match "{query}"
            </div>
          ) : (
            results.map((item, i) => {
              const Icon   = item.icon;
              const active = i === activeIdx;
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setActiveIdx(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '8px 14px', border: 'none', textAlign: 'left',
                    background: active ? 'var(--surface-3)' : 'transparent',
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  <Icon size={14} strokeWidth={1.7} style={{ color: active ? 'var(--accent)' : 'var(--ink-4)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 600 : 400, color: 'var(--ink)' }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                    {item.section}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div style={{ padding: '6px 14px', borderTop: '1px solid var(--line)', display: 'flex', gap: 14, alignItems: 'center' }}>
          {([['↑↓', 'navigate'], ['↵', 'open'], ['esc', 'close']] as const).map(([key, hint]) => (
            <span key={hint} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-4)' }}>
              <kbd style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-3)', border: '1px solid var(--line-2)', borderRadius: 3, padding: '1px 5px', fontSize: 10 }}>
                {key}
              </kbd>
              {hint}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
