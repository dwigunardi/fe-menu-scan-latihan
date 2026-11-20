import { logger } from '@/lib/logger';
import { Middleware } from './types';

/** Optional fields read from a thrown error (ApiError, Error, or anything else). */
interface LoggedError {
  statusCode?: number;
  message?: string;
  errorTitle?: string;
  code?: string;
  details?: unknown;
}

/**
 * Sanitizes request payload by masking sensitive fields like passwords/tokens.
 */
function sanitizeRequestBody(body: unknown): unknown {
  if (!body) return undefined;
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return sanitizeRequestBody(parsed);
    } catch {
      return body;
    }
  }
  if (typeof body === 'object') {
    const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
    if ('password' in clone) clone.password = '***';
    if ('refreshToken' in clone) clone.refreshToken = '***';
    return clone;
  }
  return body;
}

/**
 * Extracts query parameters from URL string into a key-value object.
 */
function extractQueryParams(url: string): Record<string, string> | undefined {
  try {
    const parsedUrl = new URL(url, 'http://localhost');
    const entries = Array.from(parsedUrl.searchParams.entries());
    if (entries.length === 0) return undefined;
    return Object.fromEntries(entries);
  } catch {
    return undefined;
  }
}

/**
 * Structured Logger Middleware:
 * - Records request start, method, endpoint, query params, and body payload (POST/PATCH/PUT).
 * - Tracks latency in milliseconds.
 * - Records response status and error information with sanitized data.
 */
export const loggerMiddleware: Middleware = async (ctx, next) => {
  ctx.startTime = performance.now();
  const { method, url } = ctx;

  // Capture original unencrypted body for developer debugging
  const originalBody = sanitizeRequestBody(ctx.body);
  const queryParams = extractQueryParams(url);

  const requestLogPayload: Record<string, unknown> = {
    method,
    url,
  };

  if (queryParams) requestLogPayload.params = queryParams;
  if (
    ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase()) &&
    originalBody !== undefined
  ) {
    requestLogPayload.body = originalBody;
  }

  logger.debug(requestLogPayload, `🚀 [API Request] ${method} ${url}`);

  try {
    await next();

    const duration = Math.round(performance.now() - (ctx.startTime || 0));
    ctx.durationMs = duration;

    const responseLogPayload: Record<string, unknown> = {
      method,
      url,
      status: ctx.rawResponse?.status,
      durationMs: duration,
    };

    if (queryParams) responseLogPayload.params = queryParams;
    if (
      ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase()) &&
      originalBody !== undefined
    ) {
      responseLogPayload.body = originalBody;
    }

    logger.info(
      responseLogPayload,
      `✅ [API Response] ${method} ${url} (${ctx.rawResponse?.status} - ${duration}ms)`
    );
  } catch (error: unknown) {
    const duration = Math.round(performance.now() - (ctx.startTime || 0));
    ctx.durationMs = duration;

    // Errors here are usually ApiError or fetch/TypeError, but may be anything thrown downstream
    const err: LoggedError =
      typeof error === 'object' && error !== null ? (error as LoggedError) : {};

    const status = err.statusCode || ctx.rawResponse?.status || 500;
    const isNetworkError =
      err.message?.toLowerCase().includes('failed to fetch') ||
      err.message?.toLowerCase().includes('network') ||
      !ctx.rawResponse;

    const logPayload: Record<string, unknown> = {
      method,
      url,
      status,
      title: err.errorTitle || 'API Error',
      code: err.code || 'UNKNOWN_ERROR',
      error: err.message || 'Unknown network/pipeline error',
      durationMs: duration,
      details: err.details || undefined,
    };

    if (queryParams) logPayload.params = queryParams;
    if (
      ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase()) &&
      originalBody !== undefined
    ) {
      logPayload.body = originalBody;
    }

    const logMsg = `🚨 [API Error] ${method} ${url} (${duration}ms)`;

    // In dev mode, use warn for network/offline or client (4xx) errors so Next.js doesn't show full-screen fatal overlay
    if (status < 500 || isNetworkError) {
      logger.warn(logPayload, logMsg);
    } else {
      logger.error(logPayload, logMsg);
    }

    throw error;
  }
};
