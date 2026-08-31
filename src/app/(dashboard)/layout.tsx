'use client';

import { ReactNode } from 'react';
import { AuthGuard } from '@/components/common/auth-guard';
import { CommonSidebar } from '@/components/common/common-sidebar';
import { CommonHeader } from '@/components/common/common-header';
import { CommonBottomNav } from '@/components/common/common-bottom-nav';
import { SessionExpiredModal } from '@/components/common/session-expired-modal';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { DynamicBreadcrumb } from '@/components/common/dynamic-breadcrumb';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="h-[100dvh] w-full flex overflow-hidden bg-[#FAF7F2] dark:bg-zinc-950 text-foreground transition-colors">
        {/* Desktop Left Sidebar */}
        <CommonSidebar />

        {/* Right Area (Header + Scrollable Main Content) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <CommonHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
            <div className="max-w-7xl w-full mx-auto space-y-4">
              <DynamicBreadcrumb />
              <ErrorBoundary moduleName="DashboardContent">
                {children}
              </ErrorBoundary>
            </div>
          </main>
          {/* Mobile Bottom Navigation */}
          <CommonBottomNav />
        </div>
      </div>

      {/* Graceful Re-Authentication Modal when session expires */}
      <SessionExpiredModal />
    </AuthGuard>
  );
}
