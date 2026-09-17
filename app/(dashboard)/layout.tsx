'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { isLoggedIn, getAdmin } from '../../lib/auth';
import { PageTitleProvider } from '../../lib/page-title-context';
import { getAllowedRoles, ROLE_DEFAULT_REDIRECT } from '../../lib/routeRoles';

const MOBILE_BP = 768;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Ref so the pathname effect reads the current value without adding isMobile to its deps
  const isMobileRef = useRef(false);
  isMobileRef.current = isMobile;

  // Auth + route-level role enforcement
  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return; }
    const admin = getAdmin();
    if (!admin) { router.replace('/login'); return; }
    const allowed = getAllowedRoles(pathname);
    if (allowed && !allowed.includes(admin.role)) {
      router.replace(ROLE_DEFAULT_REDIRECT[admin.role]);
    }
  }, [router, pathname]);

  // Detect initial breakpoint; default-open panel on desktop (≥900px)
  useEffect(() => {
    const mobile = window.innerWidth < MOBILE_BP;
    setIsMobile(mobile);
    if (!mobile) setExpanded(window.innerWidth >= 900);
  }, []);

  // Debounced resize listener — updates isMobile; closes sidebar on breakpoint cross
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const mobile = window.innerWidth < MOBILE_BP;
        setIsMobile(prev => {
          if (prev !== mobile) setExpanded(false);
          return mobile;
        });
      }, 150);
    }
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(timer); };
  }, []);

  // Single source of truth for body classes — replaces the two-class approach
  useEffect(() => {
    if (expanded && isMobile) {
      document.body.classList.add('mobile-sidebar-open');
      document.body.classList.remove('sidebar-expanded');
    } else if (expanded) {
      document.body.classList.add('sidebar-expanded');
      document.body.classList.remove('mobile-sidebar-open');
    } else {
      document.body.classList.remove('mobile-sidebar-open', 'sidebar-expanded');
    }
  }, [expanded, isMobile]);

  // Close mobile drawer on route change (desktop expansion is intentionally preserved)
  useEffect(() => {
    if (isMobileRef.current) setExpanded(false);
  }, [pathname]);

  const toggle = useCallback(() => setExpanded(prev => !prev), []);
  const close  = useCallback(() => setExpanded(false), []);

  return (
    <div className="page-shell">
      <Sidebar expanded={expanded} isMobile={isMobile} onToggle={toggle} onClose={close} />
      {expanded && isMobile && (
        <div className="mobile-sidebar-backdrop" onClick={close} />
      )}
      <PageTitleProvider>
        <div className="page-content">
          <Topbar onToggle={toggle} />
          <main className="page-inner">
            {children}
          </main>
        </div>
      </PageTitleProvider>
    </div>
  );
}
