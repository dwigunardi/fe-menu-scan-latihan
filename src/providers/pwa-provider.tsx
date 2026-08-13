'use client';

import * as React from 'react';
import { usePwaStore } from '@/store/use-pwa-store';
import { registerServiceWorker } from '@/lib/pwa/register-sw';

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const { setIsOnline, setInstallPrompt } = usePwaStore();

  React.useEffect(() => {
    // 1. Register Service Worker in production
    registerServiceWorker();

    // 2. Online / Offline event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. BeforeInstallPrompt event listener for custom PWA install banner
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
