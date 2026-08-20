import { hardenedFetch } from './hardened-fetch';
import { Either, left } from './either';
import { ApiError } from './api-error';
import {
  LoginResponseSchema,
  LoginResponseType,
  RefreshTokenResponseSchema,
  RefreshTokenResponseType,
} from '../validations/auth.schema';
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

  return hardenedFetch('/auth/login', LoginResponseSchema, {
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
  return hardenedFetch('/auth/refresh', RefreshTokenResponseSchema, {
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
