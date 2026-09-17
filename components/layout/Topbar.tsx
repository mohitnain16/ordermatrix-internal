'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Sun, Moon, AlignLeft } from 'lucide-react';
import { getAdmin } from '../../lib/auth';
import { usePageTitle } from '../../lib/page-title-context';
import { useTheme } from '../../hooks/useTheme';

const SECTION_MAP: Record<string, string> = {
  '/superadmin/tenants': 'Tenants',
  '/superadmin':         'Admin',
  '/sales':              'Growth',
  '/lifecycle':          'Growth',
  '/billing':            'Growth',
  '/communications':     'Growth',
  '/support':            'Support',
};

const PAGE_TITLES: Record<string, string> = {
  '/superadmin':                'Platform Pulse',
  '/superadmin/tenants':        'Tenants',
  '/superadmin/subscriptions':  'Subscriptions',
  '/superadmin/users':          'All Users',
  '/superadmin/audit-log':      'Audit Log',
  '/superadmin/enquiries':      'Enquiries',
  '/superadmin/coupons':        'Coupons',
  '/superadmin/team':           'Team',
  '/superadmin/wa-agent':       'WA Agent',
  '/sales':                     'Sales Overview',
  '/sales/leads':               'Lead Captures',
  '/lifecycle':                 'Lifecycle',
  '/billing':                   'Billing Ops',
  '/communications':            'Comms',
  '/support':                   'Support Lookup',
  '/support/issues':            'Active Issues',
};

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  ops_admin:  'Ops Admin',
  sales:      'Sales',
  support:    'Support',
};

const ROLE_COLOR: Record<string, string> = {
  superadmin: 'var(--purple-text)',
  ops_admin:  'var(--blue-text)',
  sales:      'var(--green-text)',
  support:    'var(--amber-text)',
};

function resolveSection(pathname: string): string {
  const sorted = Object.keys(SECTION_MAP).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (pathname.startsWith(key)) return SECTION_MAP[key];
  }
  return 'Admin';
}

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/superadmin/tenants/')) return 'Tenant Detail';
  if (pathname.startsWith('/superadmin/wa-agent/')) return 'WA Agent Detail';
  return '';
}

interface TopbarProps {
  onToggle: () => void;
}

export default function Topbar({ onToggle }: TopbarProps) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<{ name: string; role: string } | null>(null);
  const { title: contextTitle } = usePageTitle();
  const { mode, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const a = getAdmin();
    if (a) setAdmin(a);
  }, []);

  const section = resolveSection(pathname);
  const pageTitle = contextTitle || resolveTitle(pathname);
  const showBreadcrumb = !!pageTitle && section !== pageTitle;
  const initials   = admin?.name?.charAt(0).toUpperCase() || '?';
  const roleColor  = ROLE_COLOR[admin?.role || ''] || 'var(--accent)';

  return (
    <header className="topbar">
      {/* Mobile hamburger — CSS hides this on desktop */}
      <button
        className="mobile-nav-trigger"
        onClick={onToggle}
        aria-label="Toggle navigation"
        title="Toggle navigation"
      >
        <AlignLeft size={18} strokeWidth={1.8} />
      </button>

      {/* Breadcrumb / title — left side */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {showBreadcrumb && (
          <>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 400 }}>{section}</span>
            <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>/</span>
          </>
        )}
        <span style={{
          fontSize: 13, fontWeight: 600, color: 'var(--ink)',
          letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {pageTitle || section}
        </span>
      </div>

      {/* Right: theme toggle → bell → avatar → name → role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)',
            transition: 'color 0.15s, background 0.15s',
          }}
        >
          {mode === 'dark'
            ? <Sun  size={16} strokeWidth={1.8} />
            : <Moon size={16} strokeWidth={1.8} />}
        </button>

        <button
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)',
          }}
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={1.8} />
        </button>

        {admin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: roleColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0,
            }}>
              {initials}
            </div>
            <span className="topbar-name" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
              {admin.name}
            </span>
            <span className="badge badge-neutral topbar-role">
              {ROLE_LABEL[admin.role] || admin.role}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
