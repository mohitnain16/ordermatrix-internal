'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { setAuth, isLoggedIn } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn()) router.replace('/superadmin');
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Email and password required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/admin/auth/login', { email, password });
      setAuth(res.data.token, res.data.admin);
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      document.cookie = `om_admin_token=${res.data.token}; path=/; max-age=28800; SameSite=Strict${secure}`;
      router.replace('/superadmin');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Left panel — dark branding ─────────────────── */}
      <div style={{
        width: '42%', flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column',
        padding: '48px 48px 40px',
      }}>
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'auto' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--accent)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#fff',
            letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)', flexShrink: 0,
          }}>OM</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>Ordermatrix</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Admin Console</div>
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ marginBottom: 'auto', paddingTop: 80 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 16 }}>
            Operations<br />command centre.
          </div>
          <div style={{ fontSize: 14, color: 'var(--sidebar-text)', lineHeight: 1.7, maxWidth: 280 }}>
            Manage tenants, subscriptions, revenue and support — all in one place.
          </div>
        </div>

        {/* Bottom note */}
        <div style={{ fontSize: 11, color: '#2e3240', letterSpacing: '0.04em' }}>
          Restricted access · Internal use only
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────── */}
      <div style={{
        flex: 1, background: 'var(--page-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 6 }}>Sign in</h1>
            <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Enter your admin credentials to continue.</p>
          </div>

          <div className="admin-card" style={{ padding: 28 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  className="admin-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@ordermatrix.in"
                  autoFocus
                />
              </div>

              <div>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="admin-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="alert alert-danger" style={{ fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 4, height: 40 }}
              >
                {loading ? (
                  <><span className="spinner" />Signing in…</>
                ) : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
