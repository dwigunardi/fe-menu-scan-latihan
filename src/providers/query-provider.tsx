'use client';

import { ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/use-auth-store';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes fresh cache
            gcTime: 1000 * 60 * 10,    // 10 minutes garbage collection time
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // POS devices are shared between staff: drop every cached response when the signed-in
  // user logs out or changes, so the next user never sees the previous user's data.
  useEffect(
    () =>
      useAuthStore.subscribe((state, prevState) => {
        const prevUserId = prevState.user?.id;
        if (prevUserId && state.user?.id !== prevUserId) {
          queryClient.clear();
        }
      }),
    [queryClient]
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
