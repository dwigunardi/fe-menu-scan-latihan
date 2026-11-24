import { Either, left, right } from '../either';
import { ApiError } from '../api-error';
import { isErrorCode, ErrorCode } from '../error-codes';
import { setLogoutReason } from '@/lib/auth/logout-reason';
import { ApiTransportOptions } from '../types';
import { performHandshake } from '../handshake-session';
import { PipelineContext, Middleware } from './types';
import { loggerMiddleware } from './logger-middleware';
import { authMiddleware } from './auth-middleware';
import { handshakeMiddleware } from './handshake-middleware';
import { encryptionMiddleware } from './encryption-middleware';
import { refreshTokenApi, RefreshTokenResponse, logoutApi } from '../auth-api';
import { AUTH_COOKIE_LOCK, withAuthCookieLock } from '../auth-cookie-lock';
import { getJwtSubject } from '@/lib/utils/jwt';
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

/**
 * Whether a 401 can be fixed by refreshing the access token. The backend sends a `code`:
 * TOKEN_EXPIRED (and TOKEN_MISSING, recoverable through the refresh cookie) can; TOKEN_INVALID,
 * ACCOUNT_DISABLED, INVALID_CREDENTIALS and INVALID_TEMP_PASSWORD cannot. A 401 without a code
 * (older backend) keeps the previous refresh-on-any-401 behavior.
 */
function isRefreshable401(code: unknown): boolean {
  return (
    code === undefined ||
    code === null ||
    code === ErrorCode.TOKEN_EXPIRED ||
    code === ErrorCode.TOKEN_MISSING
  );
}

function redirectToLogin(): void {
  if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
    window.location.href = '/login';
  }
}

/**
 * The account was deactivated or deleted (effective immediately): signing in again will fail, so
 * end the session here and explain why on /login instead of showing the re-login modal.
 */
function endSessionForDisabledAccount(): void {
  const hadSession = Boolean(useAuthStore.getState().user || useAuthStore.getState().accessToken);
  setLogoutReason('account-disabled');
  useAuthStore.getState().logout();
  // Also clear the refresh cookie (once, even when several requests fail together). Not awaited:
  // the failing request may itself hold the cookie lock (e.g. a handover), and logoutApi waits for it.
  if (hadSession) void logoutApi();
  redirectToLogin();
}

/** The access token is unusable (TOKEN_INVALID): a refresh will not help, sign in again. */
function requireSignInAgain(): void {
  if (useAuthStore.getState().user) {
    useAuthStore.getState().openReauthModal();
    return;
  }
  useAuthStore.getState().logout();
  redirectToLogin();
}

/** Web Lock shared by every tab and every cookie-changing auth request (see auth-cookie-lock). */
export const REFRESH_LOCK_NAME = AUTH_COOKIE_LOCK;
/** Pause before retrying a refresh that lost a cross-tab race (no Web Locks available). */
export const REFRESH_RETRY_DELAY_MS = 300;

/**
 * Refreshes with the HttpOnly cookie. All tabs share that one cookie and every refresh rotates
 * it, so two tabs refreshing at once would make the slower one fail with 401. The cookie lock
 * serializes refreshes (and login/handover/logout) across tabs: the second tab then refreshes
 * with the cookie the first one just received. Without Web Locks, a 401 is retried once, since
 * the winner's Set-Cookie has already stored the new cookie in the browser.
 */
async function refreshWithCookie(): Promise<Either<ApiError, RefreshTokenResponse>> {
  const hasLocks = typeof navigator !== 'undefined' && Boolean(navigator.locks?.request);
  if (hasLocks) {
    return withAuthCookieLock((signal) => refreshTokenApi(signal));
  }

  const first = await refreshTokenApi();
  if (first.isRight() || first.value.statusCode !== 401) return first;
  await new Promise((resolve) => setTimeout(resolve, REFRESH_RETRY_DELAY_MS));
  return refreshTokenApi();
}

/**
 * The refresh cookie belongs to whoever last logged in, onboarded or took over a shift in this
 * browser, in any tab. If the new access token is for a different user than this tab shows,
 * this tab is stale: reload the session that tab stored, and only accept the token if they now
 * match. Never put another staff member's token under this tab's profile.
 */
async function adoptRefreshedToken(accessToken: string, sessionUserId: string): Promise<boolean> {
  const tokenUserId = getJwtSubject(accessToken);
  if (!tokenUserId || tokenUserId === sessionUserId) {
    useAuthStore.getState().updateTokens(accessToken);
    return true;
  }

  await useAuthStore.persist.rehydrate();
  if (useAuthStore.getState().user?.id === tokenUserId) {
    useAuthStore.getState().updateTokens(accessToken);
    return true;
  }
  return false;
}

/**
 * Renews the access token with the refresh cookie (single-flight per tab). Exported so that
 * cookie-locked auth calls (handover, onboard) can refresh outside their own lock after a 401.
 */
export async function attemptSilentTokenRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const { user } = useAuthStore.getState();
      const sessionUserId = user?.id;

      // 1. Logged in: renew the access token with the refresh cookie (invisible to JS, so the
      //    stored user is the only sign that a session should exist)
      if (user) {
        const res = await refreshWithCookie();

        // The session changed while refreshing (shift handover, logout, another login). The result
        // belongs to the previous user: never store it under the new profile. Let the caller retry
        // with whatever session is current now.
        if (useAuthStore.getState().user?.id !== sessionUserId) {
          return Boolean(useAuthStore.getState().accessToken);
        }

        if (res.isRight() && sessionUserId && (await adoptRefreshedToken(res.value.accessToken, sessionUserId))) {
          return true;
        }

        // 2. The refresh cookie is gone, expired, revoked, or now belongs to another staff member
        //    -> Re-Auth Modal (preserve page & work)
        if (useAuthStore.getState().user) {
          useAuthStore.getState().openReauthModal();
        }
        return false;
      }

      // 3. If no user session at all -> Clean logout and redirect to login
      useAuthStore.getState().logout();
      redirectToLogin();
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
  options: ApiTransportOptions = {},
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
      // Lets callers cancel a request (e.g. a logout that outlived its timeout)
      signal: context.options.signal ?? undefined,
      // 'include' on auth endpoints so the browser sends and stores the HttpOnly refresh cookie
      // (the API is cross-origin from the FE, e.g. localhost:3000 → localhost:5000)
      credentials: context.options.credentials,
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
    const authErrorCode: unknown = response.status === 401 ? json?.code : undefined;

    if (response.status === 401 && !isAuthRoute) {
      if (authErrorCode === ErrorCode.ACCOUNT_DISABLED) {
        endSessionForDisabledAccount();
      } else if (authErrorCode === ErrorCode.TOKEN_INVALID) {
        requireSignInAgain();
      }
    }

    if (
      response.status === 401 &&
      !isAuthRoute &&
      isRefreshable401(authErrorCode) &&
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
        // Machine-readable code from the backend when it sends one (e.g. SHIFT_NOT_OPEN);
        // otherwise ApiError derives the code from the HTTP status
        code: isErrorCode(json?.code) ? json.code : undefined,
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
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return left(err);
    }
    const message =
      typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
        ? err.message
        : undefined;
    return left(ApiError.networkError(message || 'Gagal terhubung ke server.'));
  }
}
