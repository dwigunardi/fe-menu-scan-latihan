import { describe, it, expect, beforeEach } from 'vitest';
import { useKioskLockStore } from '@/store/use-kiosk-lock-store';
import { useAuthStore, ROLE } from '@/store/use-auth-store';

describe('useKioskLockStore', () => {
  beforeEach(() => {
    useKioskLockStore.setState({ isLocked: false });
    useAuthStore.getState().setAuth(
      { id: 'cashier-1', name: 'Kasir Pagi', role: ROLE.CASHIER },
      'token-1'
    );
  });

  it('locks and unlocks the device', () => {
    useKioskLockStore.getState().lock();
    expect(useKioskLockStore.getState().isLocked).toBe(true);

    useKioskLockStore.getState().unlock();
    expect(useKioskLockStore.getState().isLocked).toBe(false);
  });

  it('persists the lock to localStorage', () => {
    useKioskLockStore.getState().lock();
    const stored = JSON.parse(localStorage.getItem('kumpul_cafe_kiosk_lock') ?? '{}');
    expect(stored.state.isLocked).toBe(true);
  });

  it('releases the lock when the user logs out', () => {
    useKioskLockStore.getState().lock();

    useAuthStore.getState().logout();

    expect(useKioskLockStore.getState().isLocked).toBe(false);
  });

  it('keeps the lock when the same user only refreshes tokens', () => {
    useKioskLockStore.getState().lock();

    useAuthStore.getState().updateTokens('token-refreshed');

    expect(useKioskLockStore.getState().isLocked).toBe(true);
  });
});
