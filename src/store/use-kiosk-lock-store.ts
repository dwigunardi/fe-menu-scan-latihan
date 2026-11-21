import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './use-auth-store';

export const KIOSK_PATH = '/cashier/kiosk';

interface KioskLockState {
  /** True while this device is in kiosk mode; every other dashboard route redirects back to the kiosk. */
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
}

/**
 * Device-level kiosk lock. Persisted to localStorage so that a reload, the back button or a
 * typed URL cannot leave kiosk mode. It is released only by a verified exit PIN or by logging out.
 */
export const useKioskLockStore = create<KioskLockState>()(
  persist(
    (set) => ({
      isLocked: false,
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),
    }),
    {
      name: 'kumpul_cafe_kiosk_lock',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Logging out (manually, or when the session cannot be refreshed) releases the lock, so the next
// person who signs in on this device is not trapped in kiosk mode. Getting back in still needs a password.
useAuthStore.subscribe((state, prevState) => {
  if (prevState.user && !state.user) {
    useKioskLockStore.getState().unlock();
  }
});
