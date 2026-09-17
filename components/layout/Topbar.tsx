'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Sun, Moon, AlignLeft, Search, LogOut, ChevronDown } from 'lucide-react';
import { getAdmin, clearAuth } from '../../lib/auth';
import { usePageTitle } from '../../lib/page-title-context';
import { useTheme } from '../../hooks/useTheme';
import { resolveNavSection } from '../../lib/nav';

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
  '/support':                   'Tenant Lookup',
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

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/superadmin/tenants/')) return 'Tenant Detail';
  if (pathname.startsWith('/superadmin/wa-agent/')) return 'WA Agent Detail';
  return '';
}

interface TopbarProps {
  onToggle: () => void;
  onOpenPalette: () => void;
}

export default function Topbar({ onToggle, onOpenPalette }: TopbarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [admin, setAdmin]           = useState<{ name: string; role: string } | null>(null);
  const [dropdownOpen, setDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { title: contextTitle }     = usePageTitle();
  const { mode, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const a = getAdmin();
    if (a) setAdmin(a);
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function onDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdown(false);
      }
    }
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [dropdownOpen]);

  function logout() {
    clearAuth();
    document.cookie = 'om_admin_token=; path=/; max-age=0';
    router.push('/login');
  }

  const section        = resolveNavSection(pathname);
  const pageTitle      = contextTitle || resolveTitle(pathname);
  const showBreadcrumb = !!pageTitle && section !== pageTitle;
  const initials       = admin?.name?.charAt(0).toUpperCase() || '?';
  const roleColor      = ROLE_COLOR[admin?.role || ''] || 'var(--accent)';

  return (
    <header className="topbar">
      {/* Mobile hamburger — hidden on desktop via CSS */}
      <button
        className="mobile-nav-trigger"
        onClick={onToggle}
        aria-label="Toggle navigation"
        title="Toggle navigation"
      >
        <AlignLeft size={18} strokeWidth={1.8} />
      </button>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
        {showBreadcrumb && (
          <>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 400, flexShrink: 0 }}>{section}</span>
            <span style={{ color: 'var(--ink-4)', fontSize: 13, flexShrink: 0 }}>/</span>
          </>
        )}
        <span style={{
          fontSize: 13, fontWeight: 600, color: 'var(--ink)',
          letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {pageTitle || section}
        </span>
      </div>

      {/* ⌘K search trigger */}
      <button
        className="topbar-search"
        onClick={onOpenPalette}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          height: 30, padding: '0 10px', marginLeft: 12,
          border: '1px solid var(--line-2)', borderRadius: 7,
          background: 'var(--surface-2)', cursor: 'pointer',
          color: 'var(--ink-4)', fontSize: 12, fontFamily: 'var(--font-sans)',
          flexShrink: 0, minWidth: 160,
          transition: 'border-color 0.15s',
        }}
      >
        <Search size={12} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
        <kbd style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)',
          background: 'var(--surface-3)', border: '1px solid var(--line-2)',
          borderRadius: 4, padding: '1px 5px', flexShrink: 0,
        }}>⌘K</kbd>
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Notification bell — placeholder; no backend endpoint yet */}
        <button
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)',
          }}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={16} strokeWidth={1.8} />
        </button>

        {/* Dark mode toggle — wired via useTheme → data-mode on :root */}
        <button
          onClick={toggleTheme}
          title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)',
            transition: 'color 0.15s',
          }}
        >
          {mode === 'dark'
            ? <Sun  size={16} strokeWidth={1.8} />
            : <Moon size={16} strokeWidth={1.8} />}
        </button>

        {/* Avatar dropdown */}
        {admin && (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdown(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                borderRadius: 8,
              }}
              aria-label="Account menu"
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: roleColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0,
              }}>
                {initials}
              </div>
              <span className="topbar-name" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
                {admin.name}
              </span>
              <ChevronDown size={13} strokeWidth={1.8} style={{ color: 'var(--ink-4)' }} className="topbar-name" />
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: 'var(--surface)', border: '1px solid var(--line-2)',
                borderRadius: 10, padding: '8px 0',
                minWidth: 180, boxShadow: '0 4px 18px rgba(11,13,16,0.10)',
                zIndex: 200,
              }}>
                {/* Identity */}
                <div style={{ padding: '6px 14px 10px', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                    {admin.name}
                  </div>
                  <span className="badge badge-neutral">{ROLE_LABEL[admin.role] || admin.role}</span>
                </div>

                {/* Sign out */}
                <button
                  onClick={logout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '9px 14px', background: 'none', border: 'none',
                    color: 'var(--ink-2)', fontSize: 13, cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left',
                  }}
                >
                  <LogOut size={13} strokeWidth={1.8} style={{ color: 'var(--ink-4)' }} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
