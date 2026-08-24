'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuthStore, UserRole } from '@/store/use-auth-store';
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  fallbackUrl?: string;
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, fallbackUrl, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, _hasHydrated, isAuthenticated } = useAuthStore();

  const userRole = user?.role;
  const isAuthorized = userRole ? allowedRoles.includes(userRole) : false;

  const defaultFallback = () => {
    switch (userRole) {
      case 'KITCHEN':
      case 'DAPUR':
        return '/kitchen/orders';
      case 'CASHIER':
      case 'KASIR':
        return '/cashier/tables';
      case 'WAITER':
      case 'PELAYAN':
        return '/waiter/tables';
      case 'ADMIN':
      default:
        return '/admin/dashboard';
    }
  };

  useEffect(() => {
    if (_hasHydrated && isAuthenticated && !isAuthorized && fallbackUrl) {
      router.replace(fallbackUrl);
    }
  }, [_hasHydrated, isAuthenticated, isAuthorized, fallbackUrl, router]);

  if (!_hasHydrated || !isAuthenticated) {
    return null;
  }

  if (!isAuthorized) {
    const targetRedirect = fallbackUrl || defaultFallback();

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-zinc-800 shadow-xl text-center flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 shadow-xs">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <h2 className="text-xl font-bold text-stone-900 dark:text-zinc-100 mb-1.5">
            Akses Dibatasi
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
            Akun Anda dengan peran <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">[{userRole}]</span> tidak memiliki izin untuk membuka halaman ini.
          </p>

          <Button
            size="lg"
            onClick={() => router.replace(targetRedirect)}
            className="w-full font-bold flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Workstation Anda</span>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
