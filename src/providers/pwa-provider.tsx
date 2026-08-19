'use client';

import { ReactNode, useEffect } from 'react';
import { usePwaStore } from '@/store/use-pwa-store';
import { registerServiceWorker } from '@/lib/pwa/register-sw';

export function PwaProvider({ children }: { children?: ReactNode }) {
  const { setIsOnline, setInstallPrompt } = usePwaStore();

  useEffect(() => {
    registerServiceWorker();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setIsOnline, setInstallPrompt]);

  return <>{children}</>;
}
