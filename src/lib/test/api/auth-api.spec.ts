import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  normalizeStaffEmail,
  loginStaff,
  refreshTokenApi,
  reloginStaff,
  getHandoverCandidates,
  handoverShift,
  signOutStaff,
  LOGOUT_TIMEOUT_MS,
} from '@/lib/api/auth-api';
import { useAuthStore } from '@/store/use-auth-store';
import { ErrorCode } from '@/lib/api/error-codes';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('auth-api', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  describe('normalizeStaffEmail', () => {
    it('appends @menuscan.com if username has no @ domain', () => {
      expect(normalizeStaffEmail('admin')).toBe('admin@menuscan.com');
      expect(normalizeStaffEmail(' kasir ')).toBe('kasir@menuscan.com');
    });

    it('retains email as-is if already contains @ domain', () => {
      expect(normalizeStaffEmail('admin@customdomain.com')).toBe('admin@customdomain.com');
      expect(normalizeStaffEmail('  staff@cafe.co.id  ')).toBe('staff@cafe.co.id');
    });
  });

  describe('loginStaff', () => {
    it('successfully logs in with valid staff credentials and returns refreshToken', async () => {
      const result = await loginStaff({
        usernameOrEmail: 'admin',
        password: 'password123',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.accessToken).toBe('fake-jwt-token-123');
        expect(result.value.refreshToken).toBe('fake-refresh-token-456');
        expect(result.value.user.username).toBe('admin');
        expect(result.value.user.role).toBe('ADMIN');
      }
    });

    it('returns ApiError when credentials are invalid', async () => {
      const result = await loginStaff({
        usernameOrEmail: 'admin',
        password: 'wrongpassword',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.statusCode).toBe(401);
        expect(result.value.message).toContain('Email atau password salah');
      }
    });
  });

  describe('refreshTokenApi', () => {
    it('renews tokens successfully with valid refreshToken', async () => {
      const result = await refreshTokenApi('valid-refresh-token');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.accessToken).toBe('renewed-access-token-789');
        expect(result.value.refreshToken).toBe('renewed-refresh-token-789');
      }
    });

    it('returns ApiError when refreshToken is expired or revoked', async () => {
      const result = await refreshTokenApi('expired-refresh-token');

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.statusCode).toBe(401);
      }
    });
  });

  describe('reloginStaff', () => {
    it('re-authenticates active staff and updates store', async () => {
      useAuthStore.getState().setAuth(
        {
          id: 'user-1',
          name: 'Admin Cafe',
          email: 'admin@menuscan.com',
          role: 'ADMIN',
        },
        'old-token'
      );

      const result = await reloginStaff('password123');

      expect(result.isRight()).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('fake-jwt-token-123');
      expect(useAuthStore.getState().refreshToken).toBe('fake-refresh-token-456');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('fails when active user is not found or password incorrect', async () => {
      useAuthStore.getState().setAuth(
        {
          id: 'user-1',
          name: 'Admin Cafe',
          email: 'admin@menuscan.com',
          role: 'ADMIN',
        },
        'old-token'
      );

      const result = await reloginStaff('wrongpass');
      expect(result.isLeft()).toBe(true);
    });
  });

  describe('shift handover', () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

    beforeEach(() => {
      useAuthStore.getState().setAuth(
        { id: 'cashier-1', name: 'Kasir Pagi', role: 'CASHIER' },
        'access-token'
      );
    });

    it('lists handover candidates from GET /auth/handover/candidates', async () => {
      server.use(
        http.get(`${API_BASE}/auth/handover/candidates`, () =>
          HttpResponse.json({
            data: [{ id: 'staff-2', employeeId: 'KC-002', name: 'Siti', role: 'KITCHEN', avatarUrl: null }],
          })
        )
      );

      const result = await getHandoverCandidates();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) expect(result.value[0].name).toBe('Siti');
    });

    it('returns the incoming staff session from POST /auth/handover', async () => {
      let method = '';
      server.use(
        http.post(`${API_BASE}/auth/handover`, ({ request }) => {
          method = request.method;
          return HttpResponse.json({
            data: {
              accessToken: 'incoming-access',
              refreshToken: 'incoming-refresh',
              user: { id: 'staff-2', name: 'Siti', role: 'KITCHEN', needsOnboarding: false },
            },
          });
        })
      );

      const result = await handoverShift({ incomingStaffId: 'staff-2', pinCode: '1234' });

      expect(method).toBe('POST');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.accessToken).toBe('incoming-access');
        expect(result.value.user.id).toBe('staff-2');
      }
    });

    it('surfaces the SHIFT_STILL_OPEN code on 409', async () => {
      server.use(
        http.post(`${API_BASE}/auth/handover`, () =>
          HttpResponse.json(
            { statusCode: 409, error: 'Conflict', code: 'SHIFT_STILL_OPEN', message: 'Tutup shift dulu.' },
            { status: 409 }
          )
        )
      );

      const result = await handoverShift({ incomingStaffId: 'staff-2', pinCode: '1234' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) expect(result.value.code).toBe(ErrorCode.SHIFT_STILL_OPEN);
    });
  });

  describe('signOutStaff', () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

    function trackLogoutCalls() {
      const authHeaders: (string | null)[] = [];
      server.events.on('request:start', ({ request }) => {
        if (request.url.endsWith('/auth/logout')) authHeaders.push(request.headers.get('Authorization'));
      });
      return authHeaders;
    }

    afterEach(() => {
      server.events.removeAllListeners('request:start');
      vi.useRealTimers();
    });

    it('revokes the session on the server, then clears it locally', async () => {
      useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'valid-access', 'valid-refresh');
      const calls = trackLogoutCalls();

      await signOutStaff();

      expect(calls).toEqual(['Bearer valid-access']);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().refreshToken).toBeNull();
    });

    it('renews an expired access token with the refresh token, then revokes', async () => {
      useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'expired-access-token', 'valid-refresh');
      const calls = trackLogoutCalls();

      await signOutStaff();

      // First attempt is rejected (401), the second uses the renewed access token
      expect(calls).toEqual(['Bearer expired-access-token', 'Bearer renewed-access-token-789']);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isReauthModalOpen).toBe(false);
    });

    it('still signs out locally when the refresh token is already invalid', async () => {
      useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'expired-access-token', 'expired-refresh-token');
      const calls = trackLogoutCalls();

      await signOutStaff();

      expect(calls).toEqual(['Bearer expired-access-token']);
      expect(useAuthStore.getState().user).toBeNull();
      // No re-login modal in the middle of a logout
      expect(useAuthStore.getState().isReauthModalOpen).toBe(false);
    });

    it('gives up on an unresponsive server after the timeout, aborts the request and signs out locally', async () => {
      useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'valid-access', 'valid-refresh');
      let logoutSignal: AbortSignal | undefined;
      server.use(
        http.post(`${API_BASE}/auth/logout`, ({ request }) => {
          logoutSignal = request.signal;
          return new Promise<never>(() => {});
        })
      );
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

      const pending = signOutStaff();
      await vi.advanceTimersByTimeAsync(LOGOUT_TIMEOUT_MS);
      await pending;

      expect(useAuthStore.getState().user).toBeNull();
      // The abandoned request is cancelled, so it cannot revoke a later login of the same user
      expect(logoutSignal?.aborted).toBe(true);
    });

    it('revokes with the rotated tokens when a concurrent silent refresh won the race', async () => {
      useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'expired-access-token', 'stale-refresh');
      // Simulates a background poll's silent refresh rotating the tokens first: the backend then
      // rejects our refresh with the old token (each refresh token is accepted only once)
      server.use(
        http.post(`${API_BASE}/auth/refresh`, () => {
          useAuthStore.getState().updateTokens('rotated-access', 'rotated-refresh');
          return HttpResponse.json(
            { statusCode: 401, error: 'Unauthorized', message: 'Session was revoked or refreshed elsewhere' },
            { status: 401 }
          );
        })
      );
      const calls = trackLogoutCalls();

      await signOutStaff();

      expect(calls).toEqual(['Bearer expired-access-token', 'Bearer rotated-access']);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('does not call the server when there is no session', async () => {
      const calls = trackLogoutCalls();

      await signOutStaff();

      expect(calls).toEqual([]);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
