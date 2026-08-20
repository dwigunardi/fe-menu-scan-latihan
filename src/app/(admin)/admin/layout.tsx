'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminBottomNav } from '@/components/admin/admin-bottom-nav';

import { SessionExpiredModal } from '@/components/admin/session-expired-modal';
import { ErrorBoundary } from '@/components/common/error-boundary';

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <ErrorBoundary moduleName="AdminLogin">{children}</ErrorBoundary>;
  }

  return (
    <AuthGuard>
      <div className="h-[100dvh] w-full flex overflow-hidden bg-[#FAF7F2] dark:bg-zinc-950 text-foreground transition-colors">
        {/* Desktop Left Sidebar (Sticky/Fixed Viewport Height) */}
        <AdminSidebar />

        {/* Right Area (Fixed Header + Scrollable Main Content) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
            <div className="max-w-7xl w-full mx-auto">
              <ErrorBoundary moduleName="AdminContent">
                {children}
              </ErrorBoundary>
            </div>
          </main>
          {/* Mobile Bottom Navigation */}
          <AdminBottomNav />
        </div>
      </div>

      {/* Graceful Re-Authentication Modal when session expires */}
      <SessionExpiredModal />
    </AuthGuard>
  );
}
