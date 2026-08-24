import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/use-auth-store';

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
});
