import type { AdminRole } from './auth';

// Route prefix → roles that may access it.
// Derived directly from the NAV array in Sidebar.tsx — section roles + item-level overrides.
// More-specific prefixes are listed first; getAllowedRoles sorts by length so order here is advisory only.
export const ROUTE_ROLES: { prefix: string; roles: readonly AdminRole[] }[] = [
  // Item-level superadmin-only overrides (narrower than their section)
  { prefix: '/superadmin/team',          roles: ['superadmin'] },
  { prefix: '/superadmin/wa-agent',      roles: ['superadmin'] },
  // Wider-than-section overrides (support also allowed)
  { prefix: '/superadmin/live-activity', roles: ['superadmin', 'ops_admin', 'support'] },
  // Enquiries lives under /superadmin but is in the SUPPORT section → support allowed
  { prefix: '/superadmin/enquiries',     roles: ['superadmin', 'ops_admin', 'support'] },
  // Remaining superadmin/* (Tenants, Subscriptions, Users, Audit Log, Coupons, Platform Pulse)
  { prefix: '/superadmin',           roles: ['superadmin', 'ops_admin'] },
  // GROWTH section
  { prefix: '/sales',                roles: ['superadmin', 'ops_admin', 'sales'] },
  { prefix: '/lifecycle',            roles: ['superadmin', 'ops_admin', 'sales'] },
  { prefix: '/billing',              roles: ['superadmin', 'ops_admin', 'sales'] },
  { prefix: '/communications',       roles: ['superadmin', 'ops_admin', 'sales'] },
  // SUPPORT section
  { prefix: '/support',              roles: ['superadmin', 'ops_admin', 'support'] },
];

// Where to land after a role-mismatch redirect (role's own home page)
export const ROLE_DEFAULT_REDIRECT: Record<AdminRole, string> = {
  superadmin: '/superadmin',
  ops_admin:  '/superadmin',
  sales:      '/sales',
  support:    '/support',
};

// Returns the allowed roles for the given pathname, or null if the path is unrecognised
// (unrecognised paths are not restricted here — they'll 404 normally).
// Matches longest prefix first so /superadmin/team beats /superadmin.
export function getAllowedRoles(pathname: string): readonly AdminRole[] | null {
  const sorted = [...ROUTE_ROLES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const { prefix, roles } of sorted) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return roles;
    }
  }
  return null;
}
