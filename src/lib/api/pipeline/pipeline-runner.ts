import { Either, left, right } from '../either';
import { ApiError } from '../api-error';
import { CustomFetchOptions, performHandshake } from '../custom-fetch';
import { PipelineContext, Middleware } from './types';
import { loggerMiddleware } from './logger-middleware';
import { authMiddleware } from './auth-middleware';
import { handshakeMiddleware } from './handshake-middleware';
import { encryptionMiddleware } from './encryption-middleware';

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

    // Auto-retry on Handshake Expired (401)
    if (
      response.status === 401 &&
      context.options.retryOnHandshakeExpired &&
      json?.message?.includes('HANDSHAKE')
    ) {
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
