import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ROLE,
  USER_ROLE,
  UserRole,
  ROLE_GROUPS,
  ALL_ROLES,
} from '@/lib/constants/roles';

export { ROLE, USER_ROLE, ROLE_GROUPS, ALL_ROLES };
export type { UserRole };

export interface StaffUser {
  id: string;
  employeeId?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  name: string;
  role: UserRole;
  needsOnboarding?: boolean;
  pinCodeSet?: boolean;
}

/**
 * Client auth state. The refresh token is NOT here: the backend keeps it in the HttpOnly cookie
 * `menuscan_rt`, which JavaScript cannot read (so XSS cannot steal it). Only the short-lived
 * access token and the user profile are stored.
 */
interface AuthState {
  user: StaffUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  isReauthModalOpen: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (user: StaffUser, accessToken: string) => void;
  updateTokens: (accessToken: string) => void;
  completeOnboarding: (updatedUser?: Partial<StaffUser>) => void;
  openReauthModal: () => void;
  closeReauthModal: () => void;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[] | readonly UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      isReauthModalOpen: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      setAuth: (user, accessToken) => {
        set({
          user,
          accessToken,
          isAuthenticated: true,
          _hasHydrated: true,
          isReauthModalOpen: false,
        });
      },

      updateTokens: (accessToken) => {
        set({
          accessToken,
          isAuthenticated: true,
          isReauthModalOpen: false,
        });
      },

      completeOnboarding: (updatedUser) => {
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                ...updatedUser,
                needsOnboarding: false,
                pinCodeSet: true,
              }
            : null,
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
      name: 'kumpul_cafe_auth', // AUTH_STORAGE_KEY
      storage: createJSONStorage(() => localStorage),
      // v1: the refresh token moved to an HttpOnly cookie. `migrate` drops the copy that older
      // versions kept in localStorage, and persist rewrites the stored entry without it.
      version: 1,
      migrate: (persistedState) => {
        if (persistedState && typeof persistedState === 'object' && 'refreshToken' in persistedState) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropped on purpose
          const { refreshToken, ...rest } = persistedState as Record<string, unknown>;
          return rest;
        }
        return persistedState;
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // isReauthModalOpen is not persisted, so a rehydrate would keep it as it was. When another
      // tab stores a different session (login, handover), this tab's expired-session modal must
      // close; otherwise dismissing it would run logout and revoke that new, valid session.
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AuthState>;
        const receivedNewSession =
          Boolean(persisted.isAuthenticated && persisted.accessToken) &&
          persisted.accessToken !== currentState.accessToken;
        return {
          ...currentState,
          ...persisted,
          isReauthModalOpen: receivedNewSession ? false : currentState.isReauthModalOpen,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const AUTH_STORAGE_KEY = 'kumpul_cafe_auth';

// Keep every tab on the same session. All tabs share one refresh cookie, so when another tab
// logs out, logs in or hands the shift over, this tab must follow; otherwise it would keep the
// old profile while its next refresh returns a token for the new staff member.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === AUTH_STORAGE_KEY || event.key === null) {
      void useAuthStore.persist.rehydrate();
    }
  });
}
