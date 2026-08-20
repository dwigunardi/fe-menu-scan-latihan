import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole =
  | 'ADMIN'
  | 'CASHIER'
  | 'KITCHEN'
  | 'WAITER'
  | 'KASIR'
  | 'DAPUR'
  | 'PELAYAN';

export interface StaffUser {
  id: string;
  username?: string | null;
  email?: string | null;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: StaffUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (user: StaffUser, accessToken: string) => void;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true, _hasHydrated: true });
      },

      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false, _hasHydrated: true });
      },

      hasRole: (allowedRoles) => {
        const { user } = get();
        if (!user) return false;
        return allowedRoles.includes(user.role);
      },
    }),
    {
      name: 'kumpul_cafe_auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
