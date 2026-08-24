'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    // Only perform auth check after client has mounted AND zustand store has hydrated from localStorage
    if (!isClientReady || !_hasHydrated) return;

    if (pathname !== '/login' && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isClientReady, _hasHydrated, isAuthenticated, pathname, router]);

  // Show loading spinner during hydration / auth verification
  if (pathname !== '/login' && (!isClientReady || !_hasHydrated || !isAuthenticated)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF7F2] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-amber-600 border-t-transparent" />
          <p className="text-xs font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-widest">
            Memverifikasi Akses Staf...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
