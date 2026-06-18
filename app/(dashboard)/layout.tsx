'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { isLoggedIn } from '../../lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) router.replace('/login');
  }, [router]);

  return (
    <div className="page-shell">
      <Sidebar />
      <div className="page-content">
        <Topbar />
        <main className="page-inner">
          {children}
        </main>
      </div>
    </div>
  );
}
