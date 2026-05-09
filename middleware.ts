import { NextRequest, NextResponse } from 'next/server';

const PUBLIC = ['/login'];

const ROLE_ROUTES: Record<string, string[]> = {
  '/superadmin': ['superadmin', 'ops_admin'],
  '/sales':      ['superadmin', 'ops_admin', 'sales'],
  '/support':    ['superadmin', 'ops_admin', 'support'],
};

const isDev = process.env.NODE_ENV === 'development';

function buildCsp(nonce: string): string {
  // In dev: add 'unsafe-eval' for Next.js Fast Refresh.
  // In prod: nonce + strict-dynamic — no 'unsafe-inline'.
  // next/font/google self-hosts fonts — no external font CDN needed.
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // style-src: keep 'unsafe-inline' — Next.js styled-jsx needs it
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    // API (Railway URL + future custom domain)
    "connect-src 'self' https://ordermatrix-api-production.up.railway.app https://api.ordermatrix.in",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
}

function withNonce(req: NextRequest, nonce: string): NextResponse {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function redirectToLogin(req: NextRequest, csp: string): NextResponse {
  const res = NextResponse.redirect(new URL('/login', req.url));
  res.headers.set('Content-Security-Policy-Report-Only', csp);
  return res;
}

export function middleware(req: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp   = buildCsp(nonce);

  const { pathname } = req.nextUrl;

  // Public routes — still need nonce for the login page scripts
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    const response = withNonce(req, nonce);
    // Report-Only mode — switch to Content-Security-Policy after 1 week
    response.headers.set('Content-Security-Policy-Report-Only', csp);
    return response;
  }

  // Auth gate
  const token = req.cookies.get('om_admin_token')?.value;
  if (!token) return redirectToLogin(req, csp);

  // Role check (real enforcement is on the API — this is just UX routing)
  for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!roles.includes(payload.role)) return redirectToLogin(req, csp);
      } catch {
        return redirectToLogin(req, csp);
      }
    }
  }

  const response = withNonce(req, nonce);
  response.headers.set('Content-Security-Policy-Report-Only', csp);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)).*)',
  ],
};
