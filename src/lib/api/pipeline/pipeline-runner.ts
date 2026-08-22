import { Either, left, right } from '../either';
import { ApiError } from '../api-error';
import { CustomFetchOptions, performHandshake } from '../custom-fetch';
import { PipelineContext, Middleware } from './types';
import { loggerMiddleware } from './logger-middleware';
import { authMiddleware } from './auth-middleware';
import { handshakeMiddleware } from './handshake-middleware';
import { encryptionMiddleware } from './encryption-middleware';
import { refreshTokenApi } from '../auth-api';
import { useAuthStore } from '@/store/use-auth-store';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Standard Middleware Stack
 */
const defaultMiddlewares: Middleware[] = [
  loggerMiddleware,
  authMiddleware,
  handshakeMiddleware,
  encryptionMiddleware,
];

// Single-Flight Mutex Promise to prevent duplicate refresh calls during concurrent 401s
let refreshPromise: Promise<boolean> | null = null;

async function attemptSilentTokenRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const { refreshToken, user } = useAuthStore.getState();

      // 1. If refreshToken exists, attempt silent background rotation
      if (refreshToken) {
        const res = await refreshTokenApi(refreshToken);
        if (res.isRight()) {
          const { accessToken, refreshToken: newRefreshToken } = res.value;
          useAuthStore.getState().updateTokens(accessToken, newRefreshToken);
          return true;
        }
      }

      // 2. If refresh token is expired/missing but user is logged in -> Open Re-Auth Modal (preserve page & work)
      if (user) {
        useAuthStore.getState().openReauthModal();
        return false;
      }

      // 3. If no user session at all -> Clean logout and redirect to login
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && window.location?.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
      return false;
    } catch {
      if (useAuthStore.getState().user) {
        useAuthStore.getState().openReauthModal();
      } else {
        useAuthStore.getState().logout();
      }
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Executes a request through the modular Interceptor Middleware Pipeline.
 */
export async function executePipeline<T = unknown>(
  endpoint: string,
  options: CustomFetchOptions = {},
  customMiddlewares: Middleware[] = defaultMiddlewares
): Promise<Either<ApiError, T>> {
  const fullUrl = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const context: PipelineContext<T> = {
    url: fullUrl,
    method: options.method || 'GET',
    headers,
    body: options.body,
    options: {
      retryOnHandshakeExpired: true,
      retryOnTokenExpired: true,
      ...options,
    },
    sessionKey: null,
  };

  // Terminal Handler: Performs the network transport fetch
  const terminalFetch = async () => {
    const response = await fetch(context.url, {
      method: context.method,
      headers: context.headers,
      body: context.body as BodyInit,
    });

    context.rawResponse = response;

    const json = await response.json().catch(() => null);

    // 1. Auto-retry on Handshake Expired / Invalid (401/400 with handshake in message)
    const isHandshakeError =
      (response.status === 401 || response.status === 400) &&
      (json?.message?.toLowerCase()?.includes('handshake') ||
        json?.error?.toLowerCase()?.includes('handshake') ||
        json?.code === 'HANDSHAKE_FAILED');

    if (isHandshakeError && context.options.retryOnHandshakeExpired) {
      const handshakeResult = await performHandshake();
      if (handshakeResult.isRight()) {
        const retryResult = await executePipeline<T>(endpoint, {
          ...options,
          retryOnHandshakeExpired: false,
        });
        if (retryResult.isLeft()) {
          throw retryResult.value;
        }
        context.responseData = retryResult.value;
        return;
      }
    }

    // 2. Auto-retry on JWT Access Token Expired (401 on protected routes)
    const isAuthRoute =
      endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh');

    if (
      response.status === 401 &&
      !isAuthRoute &&
      context.options.retryOnTokenExpired !== false
    ) {
      const refreshSuccess = await attemptSilentTokenRefresh();
      if (refreshSuccess) {
        // Re-execute pipeline with refreshed token and disabled retry to prevent loops
        const retryResult = await executePipeline<T>(endpoint, {
          ...options,
          retryOnTokenExpired: false,
        });
        if (retryResult.isLeft()) {
          throw retryResult.value;
        }
        context.responseData = retryResult.value;
        return;
      }
    }

    // Handle HTTP Error Response
    if (!response.ok) {
      const statusCode = json?.statusCode || response.status;
      const errorTitle = json?.error || response.statusText || 'API Error';
      const message =
        json?.message ||
        (Array.isArray(json?.details) ? json.details[0]?.message : null) ||
        'Terjadi kesalahan saat memproses permintaan.';

      throw new ApiError(statusCode, errorTitle, message, {
        details: json?.details,
      });
    }

    context.responseData = json?.data !== undefined ? json.data : json;
  };

  try {
    // Compose middlewares in Onion order
    let index = 0;
    const runner = async (): Promise<void> => {
      if (index < customMiddlewares.length) {
        const middleware = customMiddlewares[index++];
        await middleware(context, runner);
      } else {
        await terminalFetch();
      }
    };

    await runner();

    return right(context.responseData as T);
  } catch (err: any) {
    if (err instanceof ApiError) {
      return left(err);
    }
    return left(ApiError.networkError(err?.message || 'Gagal terhubung ke server.'));
  }
}
