'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '@/store/use-auth-store';
import { useKioskLockStore, KIOSK_PATH } from '@/store/use-kiosk-lock-store';
import { ROLE_GROUPS } from '@/lib/constants/roles';
import { useIsClient } from '@/hooks/use-is-client';

interface KioskLockGuardProps {
  children: ReactNode;
}

/**
 * Keeps a locked kiosk device on the kiosk page. While the lock is on, any other dashboard route
 * (reached via the back button, a typed URL or a stale link) is replaced with the kiosk.
 */
export function KioskLockGuard({ children }: Readonly<KioskLockGuardProps>) {
  const pathname = usePathname();
  const router = useRouter();
  const isClient = useIsClient();
  const isLocked = useKioskLockStore((state) => state.isLocked);
  const role = useAuthStore((state) => state.user?.role);

  // Only enforce for roles that can open the kiosk; anyone else would hit an access-denied page there.
  const canUseKiosk =
    !!role && (ROLE_GROUPS.CASHIER_OR_ADMIN as readonly UserRole[]).includes(role);
  const mustReturnToKiosk =
    isClient && isLocked && canUseKiosk && !pathname.startsWith(KIOSK_PATH);

  useEffect(() => {
    if (mustReturnToKiosk) {
      router.replace(KIOSK_PATH);
    }
  }, [mustReturnToKiosk, router]);

  if (mustReturnToKiosk) {
    return null;
  }

  return <>{children}</>;
}
