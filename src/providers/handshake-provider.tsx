'use client';

import * as React from 'react';
import { ensureHandshakeSession } from '@/lib/api/custom-fetch';

export function HandshakeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Eager auto-handshake on application mount in background
    ensureHandshakeSession().catch((err) => {
      console.warn('⚠️ [Handshake] Background initial handshake warning:', err);
    });
  }, []);

  return <>{children}</>;
}
