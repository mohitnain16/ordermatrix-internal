'use client';
import { usePathname } from 'next/navigation';

const TITLES: Record<string, string> = {
  '/superadmin':                    'Platform Pulse',
  '/superadmin/tenants':            'Tenants',
  '/superadmin/subscriptions':      'Subscriptions',
  '/superadmin/users':              'All Users',
  '/superadmin/audit-log':          'Audit Log',
  '/sales':                         'Sales Overview',
  '/sales/pipeline':                'Trial Pipeline',
  '/support':                       'Support Lookup',
  '/support/issues':                'Active Issues',
};

function getTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/superadmin/tenants/')) return 'Tenant Detail';
  return 'Admin';
}

export default function Topbar() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header style={{ height: 56, borderBottom: '1px solid var(--line)', background: 'var(--surface)', display: 'flex', alignItems: 'center', paddingInline: 24, gap: 12, flexShrink: 0 }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{title}</span>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 6px rgba(22,163,74,0.5)' }} />
        <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>Live</span>
      </div>
    </header>
  );
}
