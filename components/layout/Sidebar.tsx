'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAdmin, clearAuth, hasRole, ROLE_LABEL, type AdminRole } from '../../lib/auth';
import {
  LayoutDashboard, Building2, CreditCard, Users, FileText,
  TrendingUp, Headphones, LogOut, ChevronRight,
  Activity, AlertTriangle, Megaphone, Mail, ShieldCheck, Tag, UserPlus,
  PanelLeftOpen, PanelLeftClose,
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
      { href: '/superadmin/team',           label: 'Team',           icon: ShieldCheck, roles: ['superadmin'] as const },
    ],
  },
  {
    section: 'GROWTH',
    roles: ['superadmin', 'ops_admin', 'sales'],
    items: [
      { href: '/sales',           label: 'Sales',         icon: TrendingUp },
      { href: '/sales/leads',     label: 'Lead Captures', icon: UserPlus },
      { href: '/lifecycle',       label: 'Lifecycle',     icon: Activity },
      { href: '/billing',         label: 'Billing Ops',   icon: AlertTriangle },
      { href: '/communications',  label: 'Comms',         icon: Megaphone },
    ],
  },
  {
    section: 'SUPPORT',
    roles: ['superadmin', 'ops_admin', 'support'],
    items: [
      { href: '/support',              label: 'Support',   icon: Headphones },
      { href: '/superadmin/enquiries', label: 'Enquiries', icon: Mail },
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
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const admin = getAdmin();

  useEffect(() => {
    const wide = typeof window !== 'undefined' && window.innerWidth >= 1280;
    setExpanded(wide);
    document.body.classList.toggle('sidebar-expanded', wide);
  }, []);

  function toggle() {
    setExpanded(prev => {
      const next = !prev;
      document.body.classList.toggle('sidebar-expanded', next);
      return next;
    });
  }

  function logout() {
    clearAuth();
    document.cookie = 'om_admin_token=; path=/; max-age=0';
    router.push('/login');
  }

  const isActive = (href: string) =>
    href === '/superadmin' || href === '/sales'
      ? pathname === href
      : pathname.startsWith(href);

  const initials = admin?.name?.charAt(0).toUpperCase() || '?';
  const roleColor = ROLE_COLOR[admin?.role || ''] || '#6b7280';

  const allItems = NAV.flatMap(g =>
    (!admin || !hasRole(admin, ...(g.roles as readonly AdminRole[]))) ? [] :
    g.items.filter(item => !item.roles || hasRole(admin, ...(item.roles as readonly AdminRole[])))
  );

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
      display: 'flex', background: 'var(--sidebar-bg)',
    }}>
      {/* Rail — always 64px */}
      <div style={{
        width: 64, flexShrink: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: 14, paddingBottom: 14,
        borderRight: '1px solid var(--sidebar-border)', gap: 2,
      }}>
        {/* Logo mark */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 14, color: '#fff', letterSpacing: '-0.03em',
          marginBottom: 12, flexShrink: 0, fontFamily: 'var(--font-mono)',
        }}>
          OM
        </div>

        {/* Nav icons */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          gap: 1, width: '100%', padding: '0 10px', overflowY: 'auto',
        }}>
          {allItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 34, borderRadius: 8, flexShrink: 0,
                  background: active ? 'rgba(236,98,64,0.15)' : 'transparent',
                  color: active ? 'var(--sidebar-accent)' : 'var(--sidebar-text)',
                  transition: 'all 0.15s', textDecoration: 'none',
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.7} />
              </Link>
            );
          })}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', color: 'var(--sidebar-text)',
            transition: 'color 0.15s', marginBottom: 4,
          }}
        >
          {expanded
            ? <PanelLeftClose size={15} strokeWidth={1.8} />
            : <PanelLeftOpen  size={15} strokeWidth={1.8} />}
        </button>

        {/* Avatar */}
        <div
          title={admin?.name || ''}
          style={{
            width: 28, height: 28, borderRadius: '50%', background: roleColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#000', flexShrink: 0, cursor: 'default',
          }}
        >
          {initials}
        </div>
      </div>

      {/* Panel — slides in/out */}
      <div style={{
        width: expanded ? 200 : 0,
        overflow: 'hidden',
        transition: 'width 0.2s ease',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column', background: 'var(--sidebar-bg)',
      }}>
        <div style={{ width: 200, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div style={{
            padding: '16px 14px 10px',
            borderBottom: '1px solid var(--sidebar-border)', flexShrink: 0,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'var(--accent)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              Admin Console
            </div>
          </div>

          {/* Nav labels */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
            {NAV.map(group => {
              if (!admin || !hasRole(admin, ...(group.roles as readonly AdminRole[]))) return null;
              const visible = group.items.filter(
                item => !item.roles || hasRole(admin, ...(item.roles as readonly AdminRole[]))
              );
              return (
                <div key={group.section} style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: 'var(--sidebar-section-label)',
                    letterSpacing: '0.12em', padding: '0 6px', marginBottom: 3,
                    textTransform: 'uppercase',
                  }}>
                    {group.section}
                  </div>
                  {visible.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '6px 7px', borderRadius: 7, marginBottom: 1,
                          textDecoration: 'none', whiteSpace: 'nowrap',
                          background: active ? 'rgba(236,98,64,0.12)' : 'transparent',
                          color: active ? 'var(--sidebar-accent)' : 'var(--sidebar-text)',
                          fontSize: 12, fontWeight: active ? 600 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        <Icon size={13} strokeWidth={active ? 2.2 : 1.7} style={{ flexShrink: 0 }} />
                        {item.label}
                        {active && (
                          <ChevronRight size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid var(--sidebar-border)',
            padding: '10px 12px', flexShrink: 0,
          }}>
            {admin && (
              <div style={{ marginBottom: 8 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: '#e2e8f0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{admin.name}</div>
                <div style={{ fontSize: 10, color: roleColor, fontWeight: 600 }}>
                  {ROLE_LABEL[admin.role]}
                </div>
              </div>
            )}
            <button
              onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                padding: '6px 6px', background: 'none', border: 'none',
                color: 'var(--sidebar-text)', fontSize: 12, cursor: 'pointer',
                borderRadius: 6, fontFamily: 'inherit',
              }}
            >
              <LogOut size={12} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
