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
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  isReauthModalOpen: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (user: StaffUser, accessToken: string, refreshToken?: string | null) => void;
  updateTokens: (accessToken: string, refreshToken?: string | null) => void;
  openReauthModal: () => void;
  closeReauthModal: () => void;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      isReauthModalOpen: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      setAuth: (user, accessToken, refreshToken = null) => {
        set((state) => ({
          user,
          accessToken,
          refreshToken: refreshToken || state.refreshToken,
          isAuthenticated: true,
          _hasHydrated: true,
          isReauthModalOpen: false,
        }));
      },

      updateTokens: (accessToken, refreshToken = null) => {
        set((state) => ({
          accessToken,
          refreshToken: refreshToken || state.refreshToken,
          isAuthenticated: true,
          isReauthModalOpen: false,
        }));
      },

      openReauthModal: () => {
        set({ isReauthModalOpen: true });
      },

      closeReauthModal: () => {
        set({ isReauthModalOpen: false });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          _hasHydrated: true,
          isReauthModalOpen: false,
        });
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
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
