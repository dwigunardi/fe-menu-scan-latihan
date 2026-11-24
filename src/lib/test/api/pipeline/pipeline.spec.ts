import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executePipeline, REFRESH_LOCK_NAME } from '@/lib/api/pipeline/pipeline-runner';
import { authMiddleware } from '@/lib/api/pipeline/auth-middleware';
import { handshakeMiddleware } from '@/lib/api/pipeline/handshake-middleware';
import { loggerMiddleware } from '@/lib/api/pipeline/logger-middleware';
import { encryptionMiddleware } from '@/lib/api/pipeline/encryption-middleware';
import { PipelineContext } from '@/lib/api/pipeline/types';
import { useAuthStore } from '@/store/use-auth-store';
import { useHandshakeStore } from '@/store/use-handshake-store';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import * as authApiModule from '@/lib/api/auth-api';
import { right } from '@/lib/api/either';
import { ErrorCode } from '@/lib/api/error-codes';
import { consumeLogoutReason } from '@/lib/auth/logout-reason';

const API_BASE = 'http://localhost:5000/api/v1';

describe('Interceptor Middleware Pipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().logout();
    useHandshakeStore.getState().clearHandshake();
  });

  describe('authMiddleware', () => {
    it('injects Authorization Bearer header if accessToken exists in store', async () => {
      useAuthStore.getState().setAuth(
        { id: 'u1', name: 'Admin', username: 'admin', role: 'ADMIN' },
        'mock-access-token-123'
      );

      const ctx: PipelineContext = {
        url: '/admin/menus',
        method: 'GET',
        headers: {},
        options: {},
      };

      const next = vi.fn().mockResolvedValue(undefined);
      await authMiddleware(ctx, next);

      expect(ctx.headers['Authorization']).toBe('Bearer mock-access-token-123');
      expect(next).toHaveBeenCalled();
    });

    it('does not overwrite existing authorization header', async () => {
      useAuthStore.getState().setAuth(
        { id: 'u1', name: 'Admin', username: 'admin', role: 'ADMIN' },
        'mock-access-token-123'
      );

      const ctx: PipelineContext = {
        url: '/admin/menus',
        method: 'GET',
        headers: { Authorization: 'Bearer custom-token' },
        options: {},
      };

      const next = vi.fn().mockResolvedValue(undefined);
      await authMiddleware(ctx, next);

      expect(ctx.headers['Authorization']).toBe('Bearer custom-token');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('loggerMiddleware', () => {
    it('tracks start and duration of request execution', async () => {
      const ctx: PipelineContext = {
        url: '/public/categories',
        method: 'GET',
        headers: {},
        options: {},
        rawResponse: new Response(JSON.stringify({ data: [] }), { status: 200 }),
      };

      const next = vi.fn().mockResolvedValue(undefined);
      await loggerMiddleware(ctx, next);

      expect(ctx.durationMs).toBeDefined();
      expect(typeof ctx.durationMs).toBe('number');
      expect(next).toHaveBeenCalled();
    });

    it('catches and logs error then rethrows it', async () => {
      const ctx: PipelineContext = {
        url: '/public/categories',
        method: 'GET',
        headers: {},
        options: {},
      };

      const testError = new Error('Test pipeline failure');
      const next = vi.fn().mockRejectedValue(testError);

      await expect(loggerMiddleware(ctx, next)).rejects.toThrow('Test pipeline failure');
      expect(ctx.durationMs).toBeDefined();
    });
  });

  describe('handshakeMiddleware', () => {
    it('skips handshake when skipHandshakeToken option is true', async () => {
      const ctx: PipelineContext = {
        url: '/auth/login',
        method: 'POST',
        headers: {},
        options: { skipHandshakeToken: true },
      };

      const next = vi.fn().mockResolvedValue(undefined);
      await handshakeMiddleware(ctx, next);

      expect(ctx.headers['x-handshake-token']).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('injects handshake token when handshake succeeds', async () => {
      const ctx: PipelineContext = {
        url: '/admin/menus',
        method: 'GET',
        headers: {},
        options: {},
      };

      const next = vi.fn().mockResolvedValue(undefined);
      await handshakeMiddleware(ctx, next);

      expect(ctx.headers['x-handshake-token']).toBeDefined();
      expect(ctx.sessionKey).toBeDefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('encryptionMiddleware', () => {
    it('stringifies object body if present', async () => {
      const ctx: PipelineContext = {
        url: '/admin/categories',
        method: 'POST',
        headers: {},
        body: { name: 'Dessert' },
        options: { skipEncryption: true },
      };

      const next = vi.fn().mockResolvedValue(undefined);
      await encryptionMiddleware(ctx, next);

      expect(typeof ctx.body).toBe('string');
      expect(ctx.headers['Content-Type']).toBe('application/json');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('executePipeline end-to-end', () => {
    it('executes successful GET pipeline and returns Right(data)', async () => {
      const result = await executePipeline<{ items: unknown[] }>('/public/categories?limit=-1');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toBeDefined();
        expect(Array.isArray(result.value.items)).toBe(true);
      }
    });

    it('returns Left(ApiError) when server responds with 4xx/5xx', async () => {
      server.use(
        http.get(`${API_BASE}/public/fail-endpoint`, () => {
          return HttpResponse.json(
            { statusCode: 400, error: 'Bad Request', message: 'Parameter tidak valid' },
            { status: 400 }
          );
        })
      );

      const result = await executePipeline('/public/fail-endpoint');
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.statusCode).toBe(400);
        expect(result.value.message).toBe('Parameter tidak valid');
      }
    });

    it('retries request on Handshake Expired error and succeeds after renegotiation', async () => {
      let callCount = 0;
      server.use(
        http.get(`${API_BASE}/admin/test-handshake-expired`, () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json(
              { statusCode: 401, error: 'Unauthorized', message: 'Handshake token has expired' },
              { status: 401 }
            );
          }
          return HttpResponse.json({
            statusCode: 200,
            data: { recovered: true },
          });
        })
      );

      const result = await executePipeline<{ recovered: boolean }>('/admin/test-handshake-expired');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.recovered).toBe(true);
      }
      expect(callCount).toBe(2);
    });

    it('silently refreshes token on 401 and retries the original request', async () => {
      useAuthStore.getState().setAuth(
        { id: 'u1', name: 'Admin', role: 'ADMIN' },
        'expired-access-token'
      );

      let attempts = 0;
      server.use(
        http.get(`${API_BASE}/admin/test-protected`, ({ request }) => {
          attempts++;
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer renewed-access-token-789') {
            return HttpResponse.json({
              statusCode: 200,
              data: { success: true, attempts },
            });
          }
          return HttpResponse.json(
            { statusCode: 401, error: 'Unauthorized', message: 'Token expired' },
            { status: 401 }
          );
        })
      );

      const result = await executePipeline<{ success: boolean }>('/admin/test-protected');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.success).toBe(true);
      }
      expect(useAuthStore.getState().accessToken).toBe('renewed-access-token-789');
    });

    it('drops a refresh result if the session changed meanwhile (e.g. shift handover)', async () => {
      useAuthStore.getState().setAuth(
        { id: 'outgoing', name: 'Kasir Lama', role: 'CASHIER' },
        'outgoing-expired-access'
      );

      // While the outgoing staff's refresh is in flight, a handover swaps in the incoming staff
      vi.spyOn(authApiModule, 'refreshTokenApi').mockImplementation(async () => {
        useAuthStore.getState().setAuth(
          { id: 'incoming', name: 'Kasir Baru', role: 'CASHIER' },
          'incoming-access'
        );
        return right({ accessToken: 'outgoing-renewed-access' });
      });

      server.use(
        http.get(`${API_BASE}/admin/test-handover-race`, ({ request }) => {
          if (request.headers.get('Authorization') === 'Bearer incoming-access') {
            return HttpResponse.json({ statusCode: 200, data: { ok: true } });
          }
          return HttpResponse.json(
            { statusCode: 401, error: 'Unauthorized', message: 'Token expired' },
            { status: 401 }
          );
        })
      );

      const result = await executePipeline<{ ok: boolean }>('/admin/test-handover-race');

      // The retry used the incoming session, and the outgoing tokens never replaced it
      expect(result.isRight()).toBe(true);
      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('incoming');
      expect(state.accessToken).toBe('incoming-access');
    });

    describe('refresh across tabs (shared HttpOnly cookie)', () => {
      const originalLocks = Object.getOwnPropertyDescriptor(navigator, 'locks');

      function setLocks(value: unknown) {
        Object.defineProperty(navigator, 'locks', { configurable: true, value });
      }

      function protectedEndpoint(path: string) {
        server.use(
          http.get(`${API_BASE}${path}`, ({ request }) =>
            request.headers.get('Authorization') === 'Bearer renewed-access-token-789'
              ? HttpResponse.json({ statusCode: 200, data: { ok: true } })
              : HttpResponse.json({ statusCode: 401, message: 'Token expired' }, { status: 401 })
          )
        );
      }

      afterEach(() => {
        if (originalLocks) Object.defineProperty(navigator, 'locks', originalLocks);
        else setLocks(undefined);
      });

      it('serializes the refresh with a Web Lock shared by all tabs', async () => {
        const request = vi.fn((_name: string, _options: unknown, callback: () => Promise<unknown>) => callback());
        setLocks({ request });
        useAuthStore.getState().setAuth({ id: 'u1', name: 'Admin', role: 'ADMIN' }, 'expired-access-token');
        protectedEndpoint('/admin/test-lock');

        const result = await executePipeline('/admin/test-lock');

        expect(result.isRight()).toBe(true);
        expect(request).toHaveBeenCalledWith(REFRESH_LOCK_NAME, expect.anything(), expect.any(Function));
        expect(useAuthStore.getState().accessToken).toBe('renewed-access-token-789');
      });

      describe('when the shared cookie now belongs to another staff member', () => {
        const toBase64Url = (value: object) =>
          btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const jwtFor = (sub: string) => `${toBase64Url({ alg: 'HS256' })}.${toBase64Url({ sub })}.sig`;

        function refreshReturnsTokenFor(sub: string) {
          server.use(
            http.post(`${API_BASE}/auth/refresh`, () =>
              HttpResponse.json({ statusCode: 200, data: { accessToken: jwtFor(sub) } })
            ),
            http.get(`${API_BASE}/admin/test-stale-tab`, ({ request }) =>
              request.headers.get('Authorization') === `Bearer ${jwtFor(sub)}`
                ? HttpResponse.json({ statusCode: 200, data: { ok: true } })
                : HttpResponse.json({ statusCode: 401, message: 'Token expired' }, { status: 401 })
            )
          );
        }

        it('follows the session another tab stored instead of mixing profiles', async () => {
          setLocks(undefined);
          // This tab shows X in memory...
          useAuthStore.getState().setAuth({ id: 'x', name: 'Kasir X', role: 'CASHIER' }, 'x-expired');
          // ...while another tab handed over to Y and stored it (this tab missed the storage event).
          // Written last: any store update here would persist X over it.
          localStorage.setItem(
            'kumpul_cafe_auth',
            JSON.stringify({
              state: { user: { id: 'y', name: 'Kasir Y', role: 'CASHIER' }, accessToken: 'y-old', isAuthenticated: true },
              version: 1,
            })
          );
          refreshReturnsTokenFor('y');

          const result = await executePipeline('/admin/test-stale-tab');

          expect(result.isRight()).toBe(true);
          expect(useAuthStore.getState().user?.id).toBe('y');
          expect(useAuthStore.getState().accessToken).toBe(jwtFor('y'));
        });

        it('never stores another staff member token under this profile', async () => {
          setLocks(undefined);
          useAuthStore.getState().setAuth({ id: 'x', name: 'Kasir X', role: 'CASHIER' }, 'x-expired');
          refreshReturnsTokenFor('someone-else');

          const result = await executePipeline('/admin/test-stale-tab');

          expect(result.isLeft()).toBe(true);
          expect(useAuthStore.getState().user?.id).toBe('x');
          expect(useAuthStore.getState().accessToken).toBe('x-expired');
          expect(useAuthStore.getState().isReauthModalOpen).toBe(true);
        });
      });

      it('retries once when another tab rotated the cookie first (no Web Locks)', async () => {
        setLocks(undefined);
        useAuthStore.getState().setAuth({ id: 'u1', name: 'Admin', role: 'ADMIN' }, 'expired-access-token');
        let refreshCalls = 0;
        server.use(
          http.post(`${API_BASE}/auth/refresh`, () => {
            refreshCalls++;
            // First attempt lost the race; by the retry the browser holds the winner's new cookie
            return refreshCalls === 1
              ? HttpResponse.json({ statusCode: 401, message: 'Rotated elsewhere' }, { status: 401 })
              : HttpResponse.json({ statusCode: 200, data: { accessToken: 'renewed-access-token-789' } });
          })
        );
        protectedEndpoint('/admin/test-retry');

        const result = await executePipeline('/admin/test-retry');

        expect(result.isRight()).toBe(true);
        expect(refreshCalls).toBe(2);
        expect(useAuthStore.getState().isReauthModalOpen).toBe(false);
      });
    });

    describe('401 codes from the backend', () => {
      function trackRefreshCalls() {
        const counter = { calls: 0 };
        server.events.on('request:start', ({ request }) => {
          if (request.url.endsWith('/auth/refresh')) counter.calls++;
        });
        return counter;
      }

      function respond401(path: string, code: string) {
        server.use(
          http.get(`${API_BASE}${path}`, ({ request }) =>
            request.headers.get('Authorization') === 'Bearer renewed-access-token-789'
              ? HttpResponse.json({ statusCode: 200, data: { ok: true } })
              : HttpResponse.json({ statusCode: 401, error: 'Unauthorized', code, message: code }, { status: 401 })
          )
        );
      }

      afterEach(() => {
        server.events.removeAllListeners('request:start');
      });

      it('refreshes and retries once on TOKEN_EXPIRED', async () => {
        useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'expired-access-token');
        const refresh = trackRefreshCalls();
        respond401('/admin/code-expired', 'TOKEN_EXPIRED');

        const result = await executePipeline('/admin/code-expired');

        expect(result.isRight()).toBe(true);
        expect(refresh.calls).toBe(1);
      });

      it('asks to sign in again without refreshing on TOKEN_INVALID', async () => {
        useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'tampered-token');
        const refresh = trackRefreshCalls();
        respond401('/admin/code-invalid', 'TOKEN_INVALID');

        const result = await executePipeline('/admin/code-invalid');

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) expect(result.value.code).toBe(ErrorCode.TOKEN_INVALID);
        expect(refresh.calls).toBe(0);
        expect(useAuthStore.getState().isReauthModalOpen).toBe(true);
      });

      it('ends the session, clears the cookie and explains it on ACCOUNT_DISABLED', async () => {
        // Already on /login, so the redirect does not navigate the test window
        const previousPath = window.location.pathname;
        window.history.replaceState({}, '', '/login');
        useAuthStore.getState().setAuth({ id: 'u1', name: 'Kasir', role: 'CASHIER' }, 'valid-access');
        const refresh = trackRefreshCalls();
        let logoutCalls = 0;
        server.events.on('request:start', ({ request }) => {
          if (request.url.endsWith('/auth/logout')) logoutCalls++;
        });
        respond401('/admin/code-disabled', 'ACCOUNT_DISABLED');

        const result = await executePipeline('/admin/code-disabled');

        expect(result.isLeft()).toBe(true);
        expect(refresh.calls).toBe(0);
        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().isReauthModalOpen).toBe(false);
        await vi.waitFor(() => expect(logoutCalls).toBe(1));
        expect(consumeLogoutReason()).toBe('account-disabled');
        window.history.replaceState({}, '', previousPath);
      });
    });

    it('handles concurrent 401 requests with single-flight mutex refresh', async () => {
      useAuthStore.getState().setAuth(
        { id: 'u1', name: 'Admin', role: 'ADMIN' },
        'expired-access-token'
      );

      server.use(
        http.get(`${API_BASE}/admin/concurrent-1`, ({ request }) => {
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer renewed-access-token-789') {
            return HttpResponse.json({ statusCode: 200, data: { endpoint: 1 } });
          }
          return HttpResponse.json({ statusCode: 401, message: 'Token expired' }, { status: 401 });
        }),
        http.get(`${API_BASE}/admin/concurrent-2`, ({ request }) => {
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer renewed-access-token-789') {
            return HttpResponse.json({ statusCode: 200, data: { endpoint: 2 } });
          }
          return HttpResponse.json({ statusCode: 401, message: 'Token expired' }, { status: 401 });
        })
      );

      const [res1, res2] = await Promise.all([
        executePipeline<unknown>('/admin/concurrent-1'),
        executePipeline<unknown>('/admin/concurrent-2'),
      ]);

      expect(res1.isRight()).toBe(true);
      expect(res2.isRight()).toBe(true);
    });

    it('handles exception in silent token refresh and falls back to reauth or logout', async () => {
      useAuthStore.getState().setAuth(
        { id: 'u1', name: 'Admin', role: 'ADMIN' },
        'expired-access-token'
      );

      vi.spyOn(authApiModule, 'refreshTokenApi').mockRejectedValue(
        new Error('Network crash during refresh')
      );

      server.use(
        http.get(`${API_BASE}/admin/test-refresh-crash`, () => {
          return HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
        })
      );

      const result = await executePipeline('/admin/test-refresh-crash');
      expect(result.isLeft()).toBe(true);
      expect(useAuthStore.getState().isReauthModalOpen).toBe(true);
    });

    it('triggers reauth modal when refresh token is invalid on 401', async () => {
      useAuthStore.getState().setAuth(
        { id: 'u1', name: 'Admin', role: 'ADMIN' },
        'expired-access-token'
      );

      server.use(
        // The refresh cookie is gone or revoked
        http.post(`${API_BASE}/auth/refresh`, () =>
          HttpResponse.json({ statusCode: 401, message: 'No active session' }, { status: 401 })
        ),
        http.get(`${API_BASE}/admin/test-expired-all`, () => {
          return HttpResponse.json(
            { statusCode: 401, error: 'Unauthorized', message: 'Token expired' },
            { status: 401 }
          );
        })
      );

      const result = await executePipeline<unknown>('/admin/test-expired-all');

      expect(result.isLeft()).toBe(true);
      expect(useAuthStore.getState().isReauthModalOpen).toBe(true);
    });

    // Keep last: the redirect to /login navigates the test window, which breaks later fetches
    it('logs out and redirects when 401 occurs with no active user session', async () => {
      useAuthStore.getState().logout();
      let refreshCalls = 0;

      server.use(
        // The refresh cookie is invisible to JS: without a stored user, no refresh is attempted
        http.post(`${API_BASE}/auth/refresh`, () => {
          refreshCalls++;
          return HttpResponse.json({ statusCode: 200, data: { accessToken: 'x' } });
        }),
        http.get(`${API_BASE}/admin/test-no-user`, () => {
          return HttpResponse.json(
            { statusCode: 401, error: 'Unauthorized', message: 'No session' },
            { status: 401 }
          );
        })
      );

      const result = await executePipeline<unknown>('/admin/test-no-user');

      expect(result.isLeft()).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(refreshCalls).toBe(0);
    });
  });
});
