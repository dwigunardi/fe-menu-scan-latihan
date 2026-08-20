import { hardenedFetch } from './hardened-fetch';
import { Either } from './either';
import { ApiError } from './api-error';
import { LoginResponseSchema, LoginResponseType } from '../validations/auth.schema';

export type LoginResponse = LoginResponseType;

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
 * Uses skipEncryption: true & skipHandshakeToken: true for instant, direct login.
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
