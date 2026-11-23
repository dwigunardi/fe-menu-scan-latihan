import { useEffect } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/providers/query-provider';
import { useAuthStore, ROLE } from '@/store/use-auth-store';

function Capture({ onClient }: { onClient: (client: QueryClient) => void }) {
  const client = useQueryClient();
  useEffect(() => {
    onClient(client);
  }, [client, onClient]);
  return null;
}

function renderWithCapturedClient() {
  const holder: { client?: QueryClient } = {};
  render(
    <QueryProvider>
      <Capture onClient={(c) => (holder.client = c)} />
    </QueryProvider>
  );
  return () => holder.client as QueryClient;
}

describe('QueryProvider', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    useAuthStore.getState().setAuth(
      { id: 'cashier-1', name: 'Kasir Pagi', role: ROLE.CASHIER },
      'token-1'
    );
  });

  it('clears cached data when the user logs out', () => {
    const getClient = renderWithCapturedClient();
    getClient().setQueryData(['admin', 'staff'], [{ id: 'secret' }]);

    act(() => {
      useAuthStore.getState().logout();
    });

    expect(getClient().getQueryData(['admin', 'staff'])).toBeUndefined();
  });

  it('clears cached data when a different user signs in', () => {
    const getClient = renderWithCapturedClient();
    getClient().setQueryData(['admin', 'staff'], [{ id: 'secret' }]);

    act(() => {
      useAuthStore.getState().setAuth(
        { id: 'admin-1', name: 'Admin', role: ROLE.ADMIN },
        'token-2'
      );
    });

    expect(getClient().getQueryData(['admin', 'staff'])).toBeUndefined();
  });

  it('keeps the cache when the same user only refreshes tokens', () => {
    const getClient = renderWithCapturedClient();
    getClient().setQueryData(['admin', 'staff'], [{ id: 'kept' }]);

    act(() => {
      useAuthStore.getState().updateTokens('token-refreshed');
    });

    expect(getClient().getQueryData(['admin', 'staff'])).toEqual([{ id: 'kept' }]);
  });
});
