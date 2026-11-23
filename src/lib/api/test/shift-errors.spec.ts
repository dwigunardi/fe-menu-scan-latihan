import { describe, it, expect } from 'vitest';
import { isNoOpenShiftError } from '@/lib/api/shift-errors';
import { ApiError } from '@/lib/api/api-error';
import { ErrorCode } from '@/lib/api/error-codes';

describe('isNoOpenShiftError', () => {
  it('matches the SHIFT_NOT_OPEN code regardless of the message text', () => {
    const error = new ApiError(409, 'Conflict', 'Pesan apa pun', {
      code: ErrorCode.SHIFT_NOT_OPEN,
    });
    expect(isNoOpenShiftError(error)).toBe(true);
  });

  it('falls back to the message for a 409 without a code (older backend)', () => {
    const error = new ApiError(
      409,
      'Conflict',
      'Belum ada shift kasir yang dibuka. Buka shift terlebih dahulu sebelum menerima pembayaran tunai.'
    );
    expect(isNoOpenShiftError(error)).toBe(true);
  });

  it('ignores other payment conflicts', () => {
    expect(
      isNoOpenShiftError(
        new ApiError(409, 'Conflict', 'Order ORD-1 sudah dibayar dengan metode QRIS')
      )
    ).toBe(false);
    expect(
      isNoOpenShiftError(
        new ApiError(409, 'Conflict', 'Order ORD-1 sudah dibatalkan dan tidak dapat dibayar')
      )
    ).toBe(false);
  });

  it('ignores non-409 errors and non-ApiError values', () => {
    expect(isNoOpenShiftError(new ApiError(400, 'Bad Request', 'shift tidak valid'))).toBe(false);
    expect(isNoOpenShiftError(new Error('shift'))).toBe(false);
    expect(isNoOpenShiftError(undefined)).toBe(false);
  });
});
