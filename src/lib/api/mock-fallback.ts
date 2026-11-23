import { ApiError } from './api-error';

/**
 * Dev-only localStorage mock fallback for modules whose backend endpoints may not exist yet
 * (staff, shifts).
 *
 * Disabled by default. Enable with `NEXT_PUBLIC_ENABLE_MOCK_FALLBACK=true` in `.env.local`
 * when developing without a backend. Never enable it in production: the UI would report
 * success for data that was never saved on the server.
 */
export function isMockFallbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK === 'true';
}

/**
 * Status codes that mean "the backend is unreachable or the endpoint is not implemented".
 * Everything else (400 validation, 401/403 auth, 409 conflict, 5xx failures) is a real
 * answer from the server and must be surfaced to the user, never masked by mock data.
 */
const FALLBACK_STATUS_CODES = new Set([
  0, // network error / server offline
  404, // endpoint not implemented yet
  501, // not implemented
]);

export function shouldUseMockFallback(error: ApiError): boolean {
  return isMockFallbackEnabled() && FALLBACK_STATUS_CODES.has(error.statusCode);
}
