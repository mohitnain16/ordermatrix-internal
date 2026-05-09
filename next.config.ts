import type { NextConfig } from "next";

// ── Security headers ──────────────────────────────────────────────────────────
// CSP is in Report-Only mode. Switch to Content-Security-Policy after 1 week
// of monitoring the browser console for violations (Day 8 of rollout plan).
// Note: next/font/google self-hosts fonts — no external font CDN requests.
const csp = [
  "default-src 'self'",
  // Next.js 15 requires unsafe-inline; unsafe-eval retained for safety.
  // Remove both once nonce-based CSP is implemented.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  // API (Railway URL + future api.ordermatrix.in)
  "connect-src 'self' https://ordermatrix-api-production.up.railway.app https://api.ordermatrix.in",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy-Report-Only', value: csp },
];

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
