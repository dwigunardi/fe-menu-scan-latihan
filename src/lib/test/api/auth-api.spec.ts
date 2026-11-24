import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  normalizeStaffEmail,
  loginStaff,
  refreshTokenApi,
  reloginStaff,
  getHandoverCandidates,
  handoverShift,
  onboardStaff,
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
    it('logs in with credentials included, so the browser stores the refresh cookie', async () => {
      let credentials: RequestCredentials | undefined;
      server.events.on('request:start', ({ request }) => {
        if (request.url.endsWith('/auth/login')) credentials = request.credentials;
      });

      const result = await loginStaff({
        usernameOrEmail: 'admin',
        password: 'password123',
      });
      server.events.removeAllListeners('request:start');

      expect(credentials).toBe('include');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.accessToken).toBe('fake-jwt-token-123');
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
    it('renews the access token with the cookie only: JSON {} body, credentials included', async () => {
      let seen: { credentials?: RequestCredentials; contentType?: string | null; body?: string } = {};
      server.use(
        http.post('http://localhost:5000/api/v1/auth/refresh', async ({ request }) => {
          seen = {
            credentials: request.credentials,
            contentType: request.headers.get('Content-Type'),
            body: await request.text(),
          };
          return HttpResponse.json({ statusCode: 200, data: { accessToken: 'renewed-access-token-789' } });
        })
      );

      const result = await refreshTokenApi();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.accessToken).toBe('renewed-access-token-789');
      }
      // The backend's CSRF guard requires JSON; no refresh token may travel in the body
      expect(seen.credentials).toBe('include');
      expect(seen.contentType).toContain('application/json');
      expect(seen.body).toBe('{}');
    });

    it('returns ApiError when the refresh cookie is missing, expired or revoked', async () => {
      server.use(
        http.post('http://localhost:5000/api/v1/auth/refresh', () =>
          HttpResponse.json({ statusCode: 401, message: 'No active session' }, { status: 401 })
        )
      );

      const result = await refreshTokenApi();

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
      const calls: { credentials: RequestCredentials; body: Promise<string> }[] = [];
      server.events.on('request:start', ({ request }) => {
        if (request.url.endsWith('/auth/logout')) {
          calls.push({ credentials: request.credentials, body: request.clone().text() });
        }
      });
      return calls;
    }

    afterEach(() => {
      server.events.removeAllListeners('request:start');
      vi.useRealTimers();
    });

    it('revokes the session with the refresh cookie, then clears it locally', async () => {
      useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'valid-access');
      const calls = trackLogoutCalls();

      await signOutStaff();

      expect(calls).toHaveLength(1);
      expect(calls[0].credentials).toBe('include');
      expect(await calls[0].body).toBe('{}');
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('needs no valid access token (the backend reads the cookie)', async () => {
      useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'expired-access-token');
      const calls = trackLogoutCalls();

      await signOutStaff();

      // One call, no refresh-then-retry dance
      expect(calls).toHaveLength(1);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isReauthModalOpen).toBe(false);
    });

    it('still signs out locally when the server fails', async () => {
      useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'valid-access');
      server.use(
        http.post(`${API_BASE}/auth/logout`, () =>
          HttpResponse.json({ statusCode: 500, message: 'boom' }, { status: 500 })
        )
      );

      await signOutStaff();

      expect(useAuthStore.getState().user).toBeNull();
    });

    it('gives up on an unresponsive server after the timeout, aborts the request and signs out locally', async () => {
      useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'valid-access');
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
      expect(logoutSignal?.aborted).toBe(true);
    });
  });

  describe('cookie lock around cookie-changing requests', () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
    const originalLocks = Object.getOwnPropertyDescriptor(navigator, 'locks');

    afterEach(() => {
      if (originalLocks) Object.defineProperty(navigator, 'locks', originalLocks);
      else Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    });

    const toBase64Url = (value: object) =>
      btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const jwtExpiringIn = (ms: number) =>
      `${toBase64Url({ alg: 'HS256' })}.${toBase64Url({ sub: 'cashier-1', exp: Math.floor((Date.now() + ms) / 1000) })}.sig`;
    const lockRequestSpy = () => {
      const lockRequest = vi.fn((_name: string, _options: unknown, callback: () => Promise<unknown>) => callback());
      Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: lockRequest } });
      return lockRequest;
    };

    it('refreshes an expiring access token before the handover, so the PIN is sent once', async () => {
      const lockRequest = lockRequestSpy();
      useAuthStore.getState().setAuth({ id: 'cashier-1', name: 'Kasir', role: 'CASHIER' }, jwtExpiringIn(5_000));
      let handoverCalls = 0;
      server.use(
        http.post(`${API_BASE}/auth/handover`, ({ request }) => {
          handoverCalls++;
          return request.headers.get('Authorization') === 'Bearer renewed-access-token-789'
            ? HttpResponse.json({
                statusCode: 200,
                data: { accessToken: 'incoming-access', user: { id: 'staff-2', name: 'Siti', role: 'KITCHEN' } },
              })
            : HttpResponse.json({ statusCode: 401, message: 'Token expired' }, { status: 401 });
        })
      );

      const result = await handoverShift({ incomingStaffId: 'staff-2', pinCode: '1234' });

      expect(result.isRight()).toBe(true);
      expect(handoverCalls).toBe(1);
      // silent refresh (locked) first, then the handover (locked), never nested
      expect(lockRequest).toHaveBeenCalledTimes(2);
    });

    it('does not resend onboarding after a 401 (wrong temporary password)', async () => {
      lockRequestSpy();
      useAuthStore.getState().setAuth({ id: 'u1', name: 'Baru', role: 'CASHIER' }, jwtExpiringIn(10 * 60_000));
      let onboardCalls = 0;
      let refreshCalls = 0;
      server.use(
        http.post(`${API_BASE}/auth/onboard`, () => {
          onboardCalls++;
          return HttpResponse.json({ statusCode: 401, message: 'Password sementara saat ini tidak sesuai.' }, { status: 401 });
        }),
        http.post(`${API_BASE}/auth/refresh`, () => {
          refreshCalls++;
          return HttpResponse.json({ statusCode: 200, data: { accessToken: 'x' } });
        })
      );

      const result = await onboardStaff({ currentPassword: 'salah', newPassword: 'Baru12345!', pinCode: '1234' });

      expect(result.isLeft()).toBe(true);
      expect(onboardCalls).toBe(1);
      expect(refreshCalls).toBe(0);
    });

    it('runs login inside the cookie lock', async () => {
      const lockRequest = lockRequestSpy();

      await loginStaff({ usernameOrEmail: 'admin', password: 'password123' });

      expect(lockRequest).toHaveBeenCalledWith('menuscan-refresh', {}, expect.any(Function));
    });

    it('runs logout inside the cookie lock with the timeout signal', async () => {
      const lockRequest = vi.fn((_name: string, _options: unknown, callback: () => Promise<unknown>) => callback());
      Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: lockRequest } });
      useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'access');

      await signOutStaff();

      expect(lockRequest).toHaveBeenCalledWith(
        'menuscan-refresh',
        { signal: expect.any(AbortSignal) },
        expect.any(Function)
      );
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
