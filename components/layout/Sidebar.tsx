'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAdmin, clearAuth, hasRole, ROLE_LABEL, type AdminRole } from '../../lib/auth';
import {
  LayoutDashboard, Building2, CreditCard, Users, FileText,
  TrendingUp, Headphones, LogOut, ChevronRight,
  Activity, AlertTriangle, Megaphone, Mail, ShieldCheck, Tag,
} from 'lucide-react';

const NAV = [
  {
    section: 'SUPER ADMIN',
    roles: ['superadmin', 'ops_admin'],
    items: [
      { href: '/superadmin',               label: 'Platform Pulse', icon: LayoutDashboard },
      { href: '/superadmin/tenants',        label: 'Tenants',        icon: Building2 },
      { href: '/superadmin/subscriptions',  label: 'Subscriptions',  icon: CreditCard },
      { href: '/superadmin/users',          label: 'All Users',      icon: Users },
      { href: '/superadmin/audit-log',      label: 'Audit Log',      icon: FileText },
      { href: '/superadmin/coupons',        label: 'Coupons',        icon: Tag,         roles: ['superadmin', 'ops_admin'] as const },
      { href: '/superadmin/team',            label: 'Team',           icon: ShieldCheck, roles: ['superadmin'] as const },
    ],
  },
  {
    section: 'GROWTH',
    roles: ['superadmin', 'ops_admin', 'sales'],
    items: [
      { href: '/sales',           label: 'Sales',         icon: TrendingUp },
      { href: '/lifecycle',       label: 'Lifecycle',     icon: Activity },
      { href: '/billing',         label: 'Billing Ops',   icon: AlertTriangle },
      { href: '/communications',  label: 'Comms',         icon: Megaphone },
    ],
  },
  {
    section: 'SUPPORT',
    roles: ['superadmin', 'ops_admin', 'support'],
    items: [
      { href: '/support',                  label: 'Support',    icon: Headphones },
      { href: '/superadmin/enquiries',     label: 'Enquiries',  icon: Mail },
    ],
  },
];

const ROLE_COLOR: Record<string, string> = {
  superadmin: '#a78bfa',
  ops_admin:  '#60a5fa',
  sales:      '#34d399',
  support:    '#fbbf24',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const admin = getAdmin();

  function logout() {
    clearAuth();
    document.cookie = 'om_admin_token=; path=/; max-age=0';
    router.push('/login');
  }

  const isActive = (href: string) =>
    href === '/superadmin' ? pathname === href : pathname.startsWith(href);

  return (
    <aside style={{
      width: 220, flexShrink: 0, background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--sidebar-border)',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0, overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.svg" alt="Ordermatrix" style={{ height: 28, width: 'auto', display: 'block' }} />
        </div>
        <div style={{ fontSize: 10, color: '#e8593a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Admin Console</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {NAV.map((group) => {
          if (!admin || !hasRole(admin, ...(group.roles as readonly AdminRole[]))) return null;
          return (
            <div key={group.section} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#3d4460', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 6 }}>
                {group.section}
              </div>
              {group.items.filter(item => !item.roles || hasRole(admin, ...(item.roles as readonly AdminRole[]))).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                      textDecoration: 'none',
                      background: active ? 'rgba(232,89,58,0.12)' : 'transparent',
                      color: active ? 'var(--sidebar-accent)' : 'var(--sidebar-text)',
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    {item.label}
                    {active && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--sidebar-border)', padding: '12px 14px' }}>
        {admin && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: ROLE_COLOR[admin.role] || '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                {admin.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.name}</div>
                <div style={{ fontSize: 10, color: ROLE_COLOR[admin.role], fontWeight: 600 }}>{ROLE_LABEL[admin.role]}</div>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px', background: 'none', border: 'none', color: 'var(--sidebar-text)', fontSize: 12, cursor: 'pointer', borderRadius: 6, fontFamily: 'inherit' }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
