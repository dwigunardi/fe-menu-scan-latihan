import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/common/error-boundary';

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] w-full bg-[#FAF7F2] dark:bg-zinc-950 text-foreground transition-colors">
      <div className="max-w-lg mx-auto min-h-[100dvh] flex flex-col bg-white dark:bg-zinc-900 border-x border-stone-200/80 dark:border-zinc-800 shadow-2xl shadow-stone-900/5">
        <ErrorBoundary moduleName="PublicCustomerView">
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
}
