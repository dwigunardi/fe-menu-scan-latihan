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
 * Uses skipEncryption: true & skipHandshakeToken: true for direct login.
 * Validated by LoginResponseSchema at runtime.
 */
export async function loginStaff(credentials: {
  usernameOrEmail: string;
  password: string;
}): Promise<Either<ApiError, LoginResponse>> {
  const email = normalizeStaffEmail(credentials.usernameOrEmail);

  return apiTransport('/auth/login', LoginResponseSchema, {
    method: 'POST',
    body: {
      email,
      password: credentials.password,
    },
    skipEncryption: true,
    skipHandshakeToken: true,
  });
}

/**
 * Renews access token using active refreshToken via POST /auth/refresh.
 */
export async function refreshTokenApi(
  refreshToken: string
): Promise<Either<ApiError, RefreshTokenResponse>> {
  return apiTransport('/auth/refresh', RefreshTokenResponseSchema, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
    body: {
      refreshToken,
    },
    skipEncryption: true,
    skipHandshakeToken: true,
  });
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
    const { user, accessToken, refreshToken } = result.value;
    useAuthStore.getState().setAuth(user, accessToken, refreshToken);
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
  return apiTransport('/auth/onboard', LoginResponseSchema, {
    method: 'POST',
    body: payload,
    skipEncryption: true,
    skipHandshakeToken: true,
  });
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
  return apiTransport('/auth/handover', LoginResponseSchema, {
    method: 'POST',
    body: input,
  });
}

export async function verifyStaffPin(
  pinCode: string
): Promise<Either<ApiError, { valid: boolean }>> {
  return apiTransport('/auth/verify-pin', VerifyPinResponseSchema, {
    method: 'POST',
    body: { pinCode },
  });
}

