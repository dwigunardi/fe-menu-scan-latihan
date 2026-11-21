import { ApiError } from './api-error';

/**
 * True when the backend rejected a cash payment because no cashier shift is open
 * (`PUT /admin/orders/:id/status` → 409 "Belum ada shift kasir yang dibuka...").
 *
 * The backend sends no machine-readable code for this case, so the 409 is told apart
 * from the other payment conflicts (cancelled order, already paid) by its message.
 */
export function isNoOpenShiftError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.statusCode === 409 &&
    /shift/i.test(error.message)
  );
}
