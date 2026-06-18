'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { getAdmin } from '../../lib/auth';

const SECTION_MAP: Record<string, string> = {
  '/superadmin':     'Admin',
  '/sales':          'Growth',
  '/lifecycle':      'Growth',
  '/billing':        'Growth',
  '/communications': 'Growth',
  '/support':        'Support',
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
  '/sales':                     'Sales Overview',
  '/sales/pipeline':            'Trial Pipeline',
  '/sales/leads':               'Lead Captures',
  '/lifecycle':                 'Lifecycle',
  '/billing':                   'Billing Ops',
  '/communications':            'Comms',
  '/support':                   'Support Lookup',
  '/support/issues':            'Active Issues',
};

const ROLE_COLOR: Record<string, string> = {
  superadmin: '#a78bfa',
  ops_admin:  '#60a5fa',
  sales:      '#34d399',
  support:    '#fbbf24',
};

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  ops_admin:  'Ops Admin',
  sales:      'Sales',
  support:    'Support',
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
  return '';
}

export default function Topbar() {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const a = getAdmin();
    if (a) setAdmin(a);
  }, []);

  const section = resolveSection(pathname);
  const pageTitle = resolveTitle(pathname);
  const showBreadcrumb = pageTitle && section !== pageTitle;
  const initials = admin?.name?.charAt(0).toUpperCase() || '?';
  const roleColor = ROLE_COLOR[admin?.role || ''] || '#6b7280';

  return (
    <header className="topbar">
      {/* Breadcrumb / title */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {showBreadcrumb && (
          <>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>{section}</span>
            <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>/</span>
          </>
        )}
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          {pageTitle || section}
        </span>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8, border: 'none',
          background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)',
        }}>
          <Bell size={16} strokeWidth={1.8} />
        </button>

        {admin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', lineHeight: 1.3 }}>
                {admin.name}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: roleColor, lineHeight: 1.3 }}>
                {ROLE_LABEL[admin.role] || admin.role}
              </div>
            </div>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: roleColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#000', flexShrink: 0,
            }}>
              {initials}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
