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
      // Also set cookie for middleware
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
    <div style={{ minHeight: '100vh', background: 'var(--sidebar-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.svg" alt="Ordermatrix" style={{ height: 36, width: 'auto', display: 'inline-block' }} />
          <div style={{ fontSize: 11, color: 'var(--sidebar-text)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 8 }}>Admin Console</div>
        </div>

        <div style={{ background: '#181c28', border: '1px solid var(--sidebar-border)', borderRadius: 14, padding: 32 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#fff' }}>Sign in</h2>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: 'var(--sidebar-text)' }}>Internal operations access only</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text)', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@ordermatrix.in"
                style={{ width: '100%', height: 40, padding: '0 14px', background: '#0f1117', border: '1px solid var(--sidebar-border)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text)', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', height: 40, padding: '0 14px', background: '#0f1117', border: '1px solid var(--sidebar-border)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: 42, background: 'var(--accent)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--sidebar-text)' }}>
          Restricted access · Ordermatrix Internal
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
