import { ApiError } from './api-error';
import { ErrorCode } from './error-codes';

/**
 * True when the backend rejected a cash payment because no cashier shift is open
 * (`PUT /admin/orders/:id/status` → 409 with `code: 'SHIFT_NOT_OPEN'`).
 *
 * Older backends sent the 409 without a code, so a 409 whose message mentions a shift is
 * accepted as a fallback. Other payment conflicts (cancelled order, already paid) never mention one.
 */
export function isNoOpenShiftError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.code === ErrorCode.SHIFT_NOT_OPEN) return true;
  return error.statusCode === 409 && /shift/i.test(error.message);
}
