import { NextRequest, NextResponse } from 'next/server';

const PUBLIC = ['/login'];

const ROLE_ROUTES: Record<string, string[]> = {
  '/superadmin': ['superadmin', 'ops_admin'],
  '/sales':      ['superadmin', 'ops_admin', 'sales'],
  '/support':    ['superadmin', 'ops_admin', 'support'],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get('om_admin_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role check (basic — real enforcement is on the API)
  for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!roles.includes(payload.role)) {
          return NextResponse.redirect(new URL('/login', req.url));
        }
      } catch {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|favicon.ico|public).*)'] };
