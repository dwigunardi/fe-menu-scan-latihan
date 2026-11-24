import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore, AUTH_STORAGE_KEY } from '@/store/use-auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('starts with unauthenticated initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('sets authentication state correctly upon login', () => {
    useAuthStore.getState().setAuth(
      {
        id: 'u-1',
        username: 'admin',
        name: 'Super Admin',
        role: 'ADMIN',
      },
      'fake-token-xyz'
    );

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('fake-token-xyz');
    expect(state.user?.name).toBe('Super Admin');
  });

  it('clears authentication state upon logout', () => {
    useAuthStore.getState().setAuth(
      { id: 'u-1', username: 'admin', name: 'Admin', role: 'ADMIN' },
      'fake-token'
    );
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('verifies role permissions with hasRole', () => {
    useAuthStore.getState().setAuth(
      { id: 'u-1', username: 'kasir', name: 'Kasir 1', role: 'CASHIER' },
      'token'
    );

    expect(useAuthStore.getState().hasRole(['CASHIER', 'ADMIN'])).toBe(true);
    expect(useAuthStore.getState().hasRole(['ADMIN', 'KITCHEN'])).toBe(false);
  });

  it('returns false for hasRole when unauthenticated', () => {
    expect(useAuthStore.getState().hasRole(['ADMIN'])).toBe(false);
  });
  it('drops a refresh token left in localStorage by older versions (now an HttpOnly cookie)', async () => {
    localStorage.setItem(
      'kumpul_cafe_auth',
      JSON.stringify({
        state: {
          user: { id: 'u1', name: 'Kasir', role: 'CASHIER' },
          accessToken: 'old-access',
          refreshToken: 'old-refresh-in-local-storage',
          isAuthenticated: true,
        },
        version: 0,
      })
    );

    await useAuthStore.persist.rehydrate();

    const state = useAuthStore.getState() as unknown as Record<string, unknown>;
    expect(state.refreshToken).toBeUndefined();
    expect(state.accessToken).toBe('old-access');
    // The stored entry is rewritten without the token
    expect(localStorage.getItem('kumpul_cafe_auth')).not.toContain('old-refresh-in-local-storage');
  });

  it('never persists a refresh token', () => {
    useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'access');
    expect(localStorage.getItem('kumpul_cafe_auth')).not.toContain('refreshToken');
  });
  it('follows a session change made in another tab (storage event)', async () => {
    useAuthStore.getState().setAuth({ id: 'x', name: 'Kasir X', role: 'CASHIER' }, 'x-access');
    // Another tab handed the shift over to Y and persisted it
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        state: { user: { id: 'y', name: 'Kasir Y', role: 'CASHIER' }, accessToken: 'y-access', isAuthenticated: true },
        version: 1,
      })
    );

    window.dispatchEvent(new StorageEvent('storage', { key: AUTH_STORAGE_KEY }));

    await vi.waitFor(() => expect(useAuthStore.getState().user?.id).toBe('y'));
    expect(useAuthStore.getState().accessToken).toBe('y-access');
  });
  it('closes the expired-session modal when another tab stores a new session', async () => {
    useAuthStore.getState().setAuth({ id: 'x', name: 'Kasir X', role: 'CASHIER' }, 'x-expired');
    useAuthStore.getState().openReauthModal();
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        state: { user: { id: 'y', name: 'Kasir Y', role: 'CASHIER' }, accessToken: 'y-fresh', isAuthenticated: true },
        version: 1,
      })
    );

    window.dispatchEvent(new StorageEvent('storage', { key: AUTH_STORAGE_KEY }));

    // Dismissing a stale modal would log out, and revoke the other tab's new session
    await vi.waitFor(() => expect(useAuthStore.getState().accessToken).toBe('y-fresh'));
    expect(useAuthStore.getState().isReauthModalOpen).toBe(false);
  });
});
