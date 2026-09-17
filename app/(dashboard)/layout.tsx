'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { isLoggedIn, getAdmin } from '../../lib/auth';
import { PageTitleProvider } from '../../lib/page-title-context';
import { getAllowedRoles, ROLE_DEFAULT_REDIRECT } from '../../lib/routeRoles';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return; }
    const admin = getAdmin();
    if (!admin) { router.replace('/login'); return; }
    const allowed = getAllowedRoles(pathname);
    if (allowed && !allowed.includes(admin.role)) {
      router.replace(ROLE_DEFAULT_REDIRECT[admin.role]);
    }
  }, [router, pathname]);

  return (
    <div className="page-shell">
      <Sidebar />
      <PageTitleProvider>
        <div className="page-content">
          <Topbar />
          <main className="page-inner">
            {children}
          </main>
        </div>
      </PageTitleProvider>
    </div>
  );
}
