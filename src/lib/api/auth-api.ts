import { z } from 'zod';
import { apiTransport } from './api-transport';
import { Either, left } from './either';
import { ApiError } from './api-error';
import {
  LoginResponseSchema,
  LoginResponseType,
  RefreshTokenResponseSchema,
  RefreshTokenResponseType,
} from '../validations/auth.schema';
import {
  HandoverCandidate,
  HandoverCandidatesSchema,
  HandoverInput,
} from '../validations/handover.schema';
import { useAuthStore } from '@/store/use-auth-store';
import { withAuthCookieLock, AuthCookieLockTimeoutError } from './auth-cookie-lock';
import { ErrorCode } from './error-codes';
import { getJwtExpiryMs } from '@/lib/utils/jwt';
// Runtime-only use inside functions, so the import cycle with pipeline-runner is safe
import { attemptSilentTokenRefresh } from './pipeline/pipeline-runner';

export type LoginResponse = LoginResponseType;
export type RefreshTokenResponse = RefreshTokenResponseType;

/**
 * Normalizes username (e.g. 'admin') to email (e.g. 'admin@menuscan.com')
 */
export function normalizeStaffEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  return `${trimmed}@menuscan.com`;
}

/**
 * Logs in a staff member via POST /auth/login.
 * Responds `{ accessToken, user }`; the refresh token arrives as the HttpOnly cookie `menuscan_rt`
 * (Set-Cookie), which the browser only stores for a cross-origin request with credentials.
 */
export async function loginStaff(credentials: {
  usernameOrEmail: string;
  password: string;
}): Promise<Either<ApiError, LoginResponse>> {
  const email = normalizeStaffEmail(credentials.usernameOrEmail);

  // Locked so a refresh still in flight (any tab) cannot overwrite or clear the new cookie
  return lockedAuthRequest((signal) =>
    apiTransport('/auth/login', LoginResponseSchema, {
      method: 'POST',
      body: {
        email,
        password: credentials.password,
      },
      skipEncryption: true,
      skipHandshakeToken: true,
      credentials: 'include',
      signal,
    })
  );
}

/**
 * Runs a cookie-changing auth request inside the cross-tab cookie lock. A request that outlives
 * the lock timeout, or whose wait is cancelled, resolves to a Left instead of throwing.
 */
async function lockedAuthRequest<T>(
  request: (signal: AbortSignal) => Promise<Either<ApiError, T>>,
  signal?: AbortSignal
): Promise<Either<ApiError, T>> {
  try {
    return await withAuthCookieLock(request, signal);
  } catch (err) {
    if (err instanceof AuthCookieLockTimeoutError) {
      const { message } = err;
      return left(new ApiError(0, 'Timeout', message, { code: ErrorCode.TIMEOUT }));
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      return left(ApiError.networkError('Permintaan dibatalkan.'));
    }
    throw err;
  }
}

/** Refresh the access token first when it expires within this margin. */
const ACCESS_TOKEN_REFRESH_MARGIN_MS = 30_000;

/**
 * Bearer-authenticated requests that also replace the refresh cookie (onboard, handover) run
 * inside the cookie lock with the pipeline's silent refresh turned off: that refresh takes the
 * same lock and would wait forever. So an access token that is expired or about to expire is
 * refreshed BEFORE taking the lock. Retrying after a 401 instead would resend the PIN or
 * password, and onboard also answers 401 for a wrong temporary password.
 */
async function ensureFreshAccessToken(): Promise<void> {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) return;
  const expiresAt = getJwtExpiryMs(accessToken);
  if (expiresAt !== null && expiresAt - Date.now() < ACCESS_TOKEN_REFRESH_MARGIN_MS) {
    await attemptSilentTokenRefresh();
  }
}

/**
 * Renews the access token via POST /auth/refresh using the HttpOnly refresh cookie.
 * No token in the body: the backend rejects that. The body is `{}` so the request is JSON, which
 * the backend's CSRF guard requires (together with an allowed Origin, sent by the browser).
 * The backend rotates the cookie (Set-Cookie) and answers `{ accessToken }`.
 */
export async function refreshTokenApi(
  signal?: AbortSignal
): Promise<Either<ApiError, RefreshTokenResponse>> {
  return apiTransport('/auth/refresh', RefreshTokenResponseSchema, {
    method: 'POST',
    body: {},
    skipEncryption: true,
    skipHandshakeToken: true,
    credentials: 'include',
    signal,
  });
}

const LogoutResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
});

/**
 * Revokes the session via POST /auth/logout using the HttpOnly refresh cookie.
 * The backend always answers 200 and always clears the cookie (never 401), and only revokes the
 * session if the cookie belongs to the active session, so a late request from an older session
 * cannot end a newer one. No access token is needed.
 */
export async function logoutApi(
  signal?: AbortSignal
): Promise<Either<ApiError, z.infer<typeof LogoutResponseSchema>>> {
  // Locked so a refresh in flight finishes first: the logout then sends the rotated cookie,
  // and a late rotation cannot keep the session alive after sign-out
  return lockedAuthRequest(
    (requestSignal) =>
      apiTransport('/auth/logout', LogoutResponseSchema, {
        method: 'POST',
        body: {},
        skipEncryption: true,
        skipHandshakeToken: true,
        retryOnTokenExpired: false,
        credentials: 'include',
        signal: requestSignal,
      }),
    signal
  );
}

/** Upper bound for the backend part of a logout, so a dead network never blocks signing out. */
export const LOGOUT_TIMEOUT_MS = 3000;

/**
 * Signs the current staff member out: revokes the session and clears the refresh cookie on the
 * backend (best effort, capped at LOGOUT_TIMEOUT_MS and aborted after it), then always clears the
 * local session. Use this instead of calling `useAuthStore.getState().logout()` from the UI:
 * JavaScript cannot delete the HttpOnly cookie, so only the backend can end the session.
 */
export async function signOutStaff(): Promise<void> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      logoutApi(controller.signal),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, LOGOUT_TIMEOUT_MS);
      }),
    ]);
  } catch {
    // Best effort: a failed revoke must never keep the user signed in locally
  } finally {
    clearTimeout(timer);
    controller.abort();
    useAuthStore.getState().logout();
  }
}

/**
 * Re-authenticates the current logged-in staff member using password.
 */
export async function reloginStaff(
  password: string
): Promise<Either<ApiError, LoginResponse>> {
  const currentUser = useAuthStore.getState().user;
  const usernameOrEmail = currentUser?.email || currentUser?.username || 'admin@menuscan.com';

  if (!usernameOrEmail) {
    return left(new ApiError(401, 'Unauthorized', 'Tidak ada akun staf yang aktif.'));
  }

  const result = await loginStaff({
    usernameOrEmail,
    password,
  });

  if (result.isRight()) {
    // The refresh cookie was set by the login response itself
    const { user, accessToken } = result.value;
    useAuthStore.getState().setAuth(user, accessToken);
  }

  return result;
}

/**
 * Completes mandatory first-time staff onboarding via POST /auth/onboard.
 * Takes current temporary password, new secure personal password, and 4-digit attendance PIN.
 *
 * Does NOT touch the auth store: the onboarding page decides when to commit the new
 * session, so that AuthGuard does not redirect away before the briefing step is shown.
 */
export async function onboardStaff(payload: {
  currentPassword: string;
  newPassword: string;
  pinCode: string;
}): Promise<Either<ApiError, LoginResponse>> {
  await ensureFreshAccessToken();
  return lockedAuthRequest((signal) =>
    apiTransport('/auth/onboard', LoginResponseSchema, {
      method: 'POST',
      body: payload,
      skipEncryption: true,
      skipHandshakeToken: true,
      // Onboarding issues a new session: the refresh cookie arrives via Set-Cookie
      credentials: 'include',
      retryOnTokenExpired: false,
      signal,
    })
  );
}

const VerifyPinResponseSchema = z.object({
  valid: z.boolean(),
});

/**
 * Verifies the 4-digit PIN of the currently logged-in staff member via POST /auth/verify-pin.
 * Used by the POS kiosk exit guard. Sent through the full pipeline (handshake + encryption)
 * because the PIN is a credential.
 *
 * Backend contract: 200 `{ valid: boolean }`. A wrong PIN should be answered with
 * `{ valid: false }` (or 400), NOT 401 — a 401 means the cashier session itself expired
 * and goes through the normal silent-refresh / re-auth flow.
 */
/**
 * Staff who can take over this device in a shift handover: active, onboarded, with a PIN,
 * not ADMIN and not the current user. Open to every logged-in staff role.
 */
export async function getHandoverCandidates(): Promise<Either<ApiError, HandoverCandidate[]>> {
  return apiTransport('/auth/handover/candidates', HandoverCandidatesSchema);
}

/**
 * Shift handover via POST /auth/handover (E2E encrypted, the body carries a PIN).
 * The backend verifies the incoming staff's PIN, revokes the outgoing staff's refresh token and
 * returns a new session for the incoming staff in the same shape as a login.
 *
 * Errors: 400 wrong PIN / invalid body (never 401), 404 incoming staff unavailable,
 * 409 `SHIFT_STILL_OPEN` (outgoing staff must close their cash drawer first), 429 PIN lockout.
 */
export async function handoverShift(
  input: HandoverInput
): Promise<Either<ApiError, LoginResponse>> {
  await ensureFreshAccessToken();
  return lockedAuthRequest((signal) =>
    apiTransport('/auth/handover', LoginResponseSchema, {
      method: 'POST',
      body: input,
      // The response sets the incoming staff's refresh cookie (Set-Cookie)
      credentials: 'include',
      retryOnTokenExpired: false,
      signal,
    })
  );
}

export async function verifyStaffPin(
  pinCode: string
): Promise<Either<ApiError, { valid: boolean }>> {
  return apiTransport('/auth/verify-pin', VerifyPinResponseSchema, {
    method: 'POST',
    body: { pinCode },
  });
}

