export type AdminRole = 'superadmin' | 'ops_admin' | 'sales' | 'support';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export function getAdmin(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('om_admin');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('om_admin_token');
}

export function setAuth(token: string, admin: AdminUser) {
  localStorage.setItem('om_admin_token', token);
  localStorage.setItem('om_admin', JSON.stringify(admin));
}

export function clearAuth() {
  localStorage.removeItem('om_admin_token');
  localStorage.removeItem('om_admin');
}

function getCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').find(c => c.trim().startsWith('om_admin_token='));
  return match ? match.trim().slice('om_admin_token='.length) : null;
}

export function isLoggedIn(): boolean {
  const lsToken = getToken();
  if (!lsToken) return false;
  const cookieToken = getCookieToken();
  if (!cookieToken) {
    clearAuth(); // cookie expired — purge stale localStorage to break the redirect loop
    return false;
  }
  return true;
}

export function hasRole(admin: AdminUser | null, ...roles: AdminRole[]): boolean {
  if (!admin) return false;
  return roles.includes(admin.role);
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  superadmin: 'Super Admin',
  ops_admin:  'Ops Admin',
  sales:      'Sales',
  support:    'Support',
};

export const ROLE_COLOR: Record<AdminRole, string> = {
  superadmin: 'badge-purple',
  ops_admin:  'badge-blue',
  sales:      'badge-green',
  support:    'badge-gold',
};
