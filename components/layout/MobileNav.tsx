'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Ellipsis, LogOut, Moon, Sun } from 'lucide-react';
import { NAV } from '../../lib/nav';
import { getAdmin, clearAuth, hasRole, type AdminRole } from '../../lib/auth';
import { useTheme } from '../../hooks/useTheme';

interface Props { open: boolean; onOpen: () => void; onClose: () => void; onSearch: () => void; }

export default function MobileNav({ open, onOpen, onClose, onSearch }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, setPreference } = useTheme();
  const [admin, setAdmin] = useState<ReturnType<typeof getAdmin>>(null);
  useEffect(() => { setAdmin(getAdmin()); }, []);

  // swipe-down to dismiss
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  function down(e: React.PointerEvent) { drag.current = { y: e.clientY, dy: 0 }; (e.target as Element).setPointerCapture(e.pointerId); }
  function move(e: React.PointerEvent) {
    if (!drag.current || !sheet.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    sheet.current.style.transition = 'none';
    sheet.current.style.transform = `translateY(${drag.current.dy}px)`;
  }
  function up() {
    if (!drag.current || !sheet.current) return;
    const dy = drag.current.dy; drag.current = null;
    sheet.current.style.transition = ''; sheet.current.style.transform = '';
    if (dy > 90) onClose();
  }

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);

  const groups = NAV
    .filter(g => admin && hasRole(admin, ...(g.roles as readonly AdminRole[])))
    .map(g => ({ ...g, items: g.items.filter(i => !i.roles || (admin && hasRole(admin, ...(i.roles as readonly AdminRole[])))) }))
    .filter(g => g.items.length);

  const tabs = groups.slice(0, 4).map(g => g.items[0]);
  const isActive = (href: string) => (href === '/superadmin' || href === '/sales' ? pathname === href : pathname.startsWith(href));
  const moreActive = !tabs.some(t => isActive(t.href)) && groups.some(g => g.items.some(i => isActive(i.href)));

  function logout() {
    clearAuth();
    document.cookie = 'om_admin_token=; path=/; max-age=0';
    router.push('/login');
  }

  let n = 0;
  return (
    <>
      <nav className="mnav" aria-label="Primary">
        {tabs.map(t => (
          <Link key={t.href} href={t.href} className={`mnav-tab${isActive(t.href) ? ' active' : ''}`}>
            <span className="mnav-ico"><t.icon size={20} strokeWidth={1.9} /></span>
            <span className="mnav-lbl">{t.href === '/support' ? 'Support' : t.label.replace('Platform ', '')}</span>
          </Link>
        ))}
        <button type="button" className={`mnav-tab${open || moreActive ? ' active' : ''}`} onClick={open ? onClose : onOpen} aria-expanded={open}>
          <span className="mnav-ico"><Ellipsis size={20} strokeWidth={1.9} /></span>
          <span className="mnav-lbl">More</span>
        </button>
      </nav>

      <div className={`msheet-scrim${open ? ' open' : ''}`} onClick={onClose} />
      <div ref={sheet} className={`msheet${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="More options" aria-hidden={!open}>
        <div className="msheet-grab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><i /></div>
        <div className="msheet-body">
          <button type="button" className="msheet-search" onClick={() => { onClose(); onSearch(); }}>
            <Search size={16} strokeWidth={1.8} /> Search…
          </button>
          {groups.map(g => (
            <section key={g.section}>
              <h4 className="msheet-h">{g.section}</h4>
              <div className="msheet-grid">
                {g.items.map(i => (
                  <Link key={i.href} href={i.href} onClick={onClose} className={`msheet-item${isActive(i.href) ? ' active' : ''}`} style={{ ['--i' as string]: n++ }}>
                    <span className="msheet-ico"><i.icon size={20} strokeWidth={1.8} /></span>
                    <span>{i.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          <div className="msheet-foot">
            <span className="msheet-user">{admin?.name || 'Admin'}<small>{(admin?.role || '').replace('_', ' ')}</small></span>
            <button type="button" className="btn btn-icon btn-ghost" onClick={() => setPreference(mode === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
              {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button type="button" className="btn btn-icon btn-ghost" onClick={logout} aria-label="Log out"><LogOut size={16} /></button>
          </div>
        </div>
      </div>
    </>
  );
}
