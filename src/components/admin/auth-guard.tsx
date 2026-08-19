'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If not on login page and not authenticated, redirect to login
    if (pathname !== '/admin/login' && !isAuthenticated) {
      router.replace('/admin/login');
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, pathname, router]);

  if (pathname !== '/admin/login' && (!isAuthenticated || isChecking)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-600 border-t-transparent" />
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
            Memverifikasi Akses Staf...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
