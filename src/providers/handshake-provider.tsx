'use client';

import { ReactNode, useEffect } from 'react';
import { ensureHandshakeSession } from '@/lib/api/handshake-session';

export function HandshakeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Eager auto-handshake on application mount in background
    ensureHandshakeSession().catch((err) => {
      console.warn('⚠️ [Handshake] Background initial handshake warning:', err);
    });
  }, []);

  return <>{children}</>;
}
