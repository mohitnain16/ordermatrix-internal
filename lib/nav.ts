import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  FileText,
  TrendingUp,
  Headphones,
  Activity,
  AlertTriangle,
  Megaphone,
  Mail,
  ShieldCheck,
  Tag,
  UserPlus,
  MessageCircle,
  AlertCircle,
  Radio,
  Flame,
  BarChart3,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AdminRole } from './auth';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: readonly AdminRole[];
}

export interface NavGroup {
  section: string;
  roles: readonly AdminRole[];
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    section: 'Overview',
    roles: ['superadmin', 'ops_admin'],
    items: [
      { href: '/superadmin',               label: 'Platform Pulse', icon: LayoutDashboard },
      { href: '/superadmin/live-activity', label: 'Live Activity',  icon: Radio,
        roles: ['superadmin', 'ops_admin', 'support'] as const },
    ],
  },
  {
    section: 'Tenants',
    roles: ['superadmin', 'ops_admin'],
    items: [
      { href: '/superadmin/tenants',       label: 'Tenants',          icon: Building2   },
      { href: '/superadmin/subscriptions', label: 'Subscriptions',    icon: CreditCard  },
      { href: '/superadmin/users',         label: 'All Users',        icon: Users       },
      { href: '/superadmin/coupons',       label: 'Coupons',          icon: Tag         },
      { href: '/superadmin/wa-agent',      label: 'WhatsApp Agent',   icon: MessageCircle,
        roles: ['superadmin', 'ops_admin', 'support'] as const },
    ],
  },
  {
    section: 'Growth',
    roles: ['superadmin', 'ops_admin', 'sales'],
    items: [
      { href: '/sales',                      label: 'Sales',         icon: TrendingUp    },
      { href: '/sales/leads',               label: 'Lead Captures', icon: UserPlus      },
      { href: '/superadmin/hot-leads',      label: 'Hot Leads',     icon: Flame         },
      { href: '/superadmin/funnel',         label: 'Funnel',        icon: BarChart3     },
      { href: '/lifecycle',                 label: 'Lifecycle',     icon: Activity      },
      { href: '/billing',                   label: 'Billing Ops',   icon: AlertTriangle },
      { href: '/communications',            label: 'Comms',         icon: Megaphone     },
    ],
  },
  {
    section: 'Support',
    roles: ['superadmin', 'ops_admin', 'support'],
    items: [
      { href: '/support',              label: 'Tenant Lookup', icon: Headphones  },
      { href: '/support/issues',       label: 'Issues',        icon: AlertCircle },
      { href: '/superadmin/enquiries', label: 'Enquiries',     icon: Mail,
        roles: ['superadmin', 'ops_admin', 'support'] as const },
    ],
  },
  {
    section: 'System',
    roles: ['superadmin', 'ops_admin'],
    items: [
      { href: '/superadmin/audit-log',  label: 'Audit Log',  icon: FileText                                      },
      { href: '/superadmin/verticals', label: 'Verticals',  icon: Layers,      roles: ['superadmin'] as const  },
      { href: '/superadmin/team',      label: 'Team',       icon: ShieldCheck, roles: ['superadmin'] as const  },
    ],
  },
];

/** Resolve breadcrumb section for a given pathname using the shared nav config. */
export function resolveNavSection(pathname: string): string {
  let best: { len: number; section: string } = { len: 0, section: '' };
  for (const group of NAV) {
    for (const item of group.items) {
      if (pathname.startsWith(item.href) && item.href.length > best.len) {
        best = { len: item.href.length, section: group.section };
      }
    }
  }
  return best.section || 'Admin';
}
