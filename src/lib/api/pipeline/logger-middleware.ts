import { logger } from '@/lib/logger';
import { Middleware } from './types';

/**
 * Structured Logger Middleware:
 * - Records request start, method, and endpoint.
 * - Tracks latency in milliseconds.
 * - Records response status and error information with zero console leakage in production.
 */
export const loggerMiddleware: Middleware = async (ctx, next) => {
  ctx.startTime = performance.now();
  const { method, url } = ctx;

  logger.debug({ method, url }, `🚀 [API Request] ${method} ${url}`);

  try {
    await next();

    const duration = Math.round(performance.now() - (ctx.startTime || 0));
    ctx.durationMs = duration;

    logger.info(
      {
        method,
        url,
        status: ctx.rawResponse?.status,
        durationMs: duration,
      },
      `✅ [API Response] ${method} ${url} (${ctx.rawResponse?.status} - ${duration}ms)`
    );
  } catch (error: any) {
    const duration = Math.round(performance.now() - (ctx.startTime || 0));
    ctx.durationMs = duration;

    logger.error(
      {
        method,
        url,
        status: error?.statusCode || ctx.rawResponse?.status || 500,
        error: error?.message || 'Unknown network/pipeline error',
        durationMs: duration,
        details: error?.details,
      },
      `🚨 [API Error] ${method} ${url} (${duration}ms)`
    );

    throw error;
  }
};
