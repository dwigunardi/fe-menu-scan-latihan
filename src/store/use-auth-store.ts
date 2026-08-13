import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'CASHIER' | 'KITCHEN' | 'WAITER';

export interface StaffUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: StaffUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
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

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
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
    }
  )
);
