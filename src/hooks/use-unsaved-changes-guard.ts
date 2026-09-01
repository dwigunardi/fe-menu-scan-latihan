'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export interface UseUnsavedChangesGuardOptions {
  isDirty: boolean;
  enabled?: boolean;
}

export function useUnsavedChangesGuard({
  isDirty,
  enabled = true,
}: UseUnsavedChangesGuardOptions) {
  let router: { push: (url: string) => void; back: () => void };
  try {
    router = useRouter();
  } catch {
    router = {
      push: (href: string) => {
        if (typeof window !== 'undefined') window.location.href = href;
      },
      back: () => {
        if (typeof window !== 'undefined') window.history.back();
      },
    };
  }

  const [isOpen, setIsOpen] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const isNavigatingRef = useRef(false);

  const shouldBlock = enabled && isDirty;

  // 1. Native Browser Prompt on Tab Close / Page Refresh
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isNavigatingRef.current) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock]);

  // 2. Intercept Internal Link Clicks (Links in Header, Sidebar, Breadcrumbs, Page)
  useEffect(() => {
    if (!shouldBlock) return;

    const handleClickCapture = (e: MouseEvent) => {
      if (isNavigatingRef.current) return;

      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const target = anchor.getAttribute('target');
      const download = anchor.getAttribute('download');

      // Ignore external, anchor links, new tabs, downloads, mailto/tel
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        target === '_blank' ||
        download !== null
      ) {
        return;
      }

      // Check if clicking current path
      let targetUrl: URL;
      try {
        const base =
          typeof window !== 'undefined' &&
          window.location.origin &&
          window.location.origin !== 'null'
            ? window.location.origin
            : 'http://localhost';
        targetUrl = new URL(href, base);
      } catch {
        return;
      }

      if (
        typeof window !== 'undefined' &&
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search
      ) {
        return;
      }

      // Intercept navigation
      e.preventDefault();
      e.stopPropagation();

      pendingNavigationRef.current = () => {
        isNavigatingRef.current = true;
        router.push(href);
      };
      setIsOpen(true);
    };

    document.addEventListener('click', handleClickCapture, true);
    return () => {
      document.removeEventListener('click', handleClickCapture, true);
    };
  }, [shouldBlock, router]);

  // 3. Intercept Browser Back & Forward Navigation
  useEffect(() => {
    if (!shouldBlock) return;

    // Push guard state if not already on a guard entry
    if (typeof window !== 'undefined' && !window.history.state?.__isGuard) {
      window.history.pushState(
        { ...window.history.state, __isGuard: true },
        '',
        window.location.href
      );
    }

    const handlePopState = () => {
      if (isNavigatingRef.current) return;

      // The browser popped back from the guard state
      pendingNavigationRef.current = () => {
        isNavigatingRef.current = true;
        window.history.back();
      };
      setIsOpen(true);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up guard state when unmounting or when shouldBlock becomes false
      if (
        typeof window !== 'undefined' &&
        window.history.state?.__isGuard &&
        !isNavigatingRef.current
      ) {
        isNavigatingRef.current = true;
        window.history.back();
      }
    };
  }, [shouldBlock]);

  const confirmLeave = useCallback(() => {
    setIsOpen(false);
    if (pendingNavigationRef.current) {
      const execute = pendingNavigationRef.current;
      pendingNavigationRef.current = null;
      execute();
    }
  }, []);

  const cancelLeave = useCallback(() => {
    setIsOpen(false);
    pendingNavigationRef.current = null;
    // Re-push guard state if user cancelled leaving via browser back
    if (typeof window !== 'undefined' && !window.history.state?.__isGuard) {
      window.history.pushState(
        { ...window.history.state, __isGuard: true },
        '',
        window.location.href
      );
    }
  }, []);

  return {
    isOpen,
    confirmLeave,
    cancelLeave,
  };
}
