import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executePipeline } from '@/lib/api/pipeline/pipeline-runner';
import { authMiddleware } from '@/lib/api/pipeline/auth-middleware';
import { handshakeMiddleware } from '@/lib/api/pipeline/handshake-middleware';
import { loggerMiddleware } from '@/lib/api/pipeline/logger-middleware';
import { encryptionMiddleware } from '@/lib/api/pipeline/encryption-middleware';
import { PipelineContext } from '@/lib/api/pipeline/types';
import { useAuthStore } from '@/store/use-auth-store';
import { useHandshakeStore } from '@/store/use-handshake-store';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { ApiError } from '@/lib/api/api-error';

const API_BASE = 'http://localhost:5000/api/v1';

describe('Interceptor Middleware Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      const result = await executePipeline<any>('/public/categories?limit=-1');
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

    it('silently refreshes token on 401 and retries the original request', async () => {
      useAuthStore.getState().setAuth(
        { id: 'u1', name: 'Admin', role: 'ADMIN' },
        'expired-access-token',
        'valid-refresh-token'
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

      const result = await executePipeline<any>('/admin/test-protected');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.success).toBe(true);
      }
      expect(useAuthStore.getState().accessToken).toBe('renewed-access-token-789');
    });

    it('triggers reauth modal when refresh token is invalid on 401', async () => {
      useAuthStore.getState().setAuth(
        { id: 'u1', name: 'Admin', role: 'ADMIN' },
        'expired-access-token',
        'expired-refresh-token'
      );

      server.use(
        http.get(`${API_BASE}/admin/test-expired-all`, () => {
          return HttpResponse.json(
            { statusCode: 401, error: 'Unauthorized', message: 'Token expired' },
            { status: 401 }
          );
        })
      );

      const result = await executePipeline<any>('/admin/test-expired-all');

      expect(result.isLeft()).toBe(true);
      expect(useAuthStore.getState().isReauthModalOpen).toBe(true);
    });

    it('logs out and redirects when 401 occurs with no active user session', async () => {
      useAuthStore.getState().logout();

      server.use(
        http.get(`${API_BASE}/admin/test-no-user`, () => {
          return HttpResponse.json(
            { statusCode: 401, error: 'Unauthorized', message: 'No session' },
            { status: 401 }
          );
        })
      );

      const result = await executePipeline<any>('/admin/test-no-user');

      expect(result.isLeft()).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
