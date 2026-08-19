import { describe, it, expect } from 'vitest';
import { ApiError } from './api-error';
import { ErrorCode } from './error-codes';
import { translateErrorToFriendlyMessage } from './error-translator';

describe('Error Translator', () => {
  it('translates TABLE_OCCUPIED into user-friendly message', () => {
    const error = new ApiError(409, 'Conflict', 'Meja terisi', {
      code: ErrorCode.TABLE_OCCUPIED,
    });
    const friendly = translateErrorToFriendlyMessage(error);
    expect(friendly.title).toBe('Meja Sedang Digunakan');
    expect(friendly.description).toContain('terdaftar atas nama pelanggan lain');
  });

  it('translates TABLE_NOT_FOUND', () => {
    const error = new ApiError(404, 'Not Found', 'Meja hilang', {
      code: ErrorCode.TABLE_NOT_FOUND,
    });
    const friendly = translateErrorToFriendlyMessage(error);
    expect(friendly.title).toBe('Meja Tidak Ditemukan');
  });

  it('translates TABLE_SESSION_INVALID', () => {
    const error = new ApiError(401, 'Unauthorized', 'Sesi habis', {
      code: ErrorCode.TABLE_SESSION_INVALID,
    });
    const friendly = translateErrorToFriendlyMessage(error);
    expect(friendly.title).toBe('Sesi Meja Berakhir');
    expect(friendly.actionLabel).toBe('Scan Ulang');
  });

  it('translates OUT_OF_STOCK into user-friendly message', () => {
    const error = new ApiError(400, 'Bad Request', 'Stok habis', {
      code: ErrorCode.OUT_OF_STOCK,
    });
    const friendly = translateErrorToFriendlyMessage(error);
    expect(friendly.title).toBe('Stok Menu Habis');
    expect(friendly.description).toContain('habis terjual');
  });

  it('translates MAX_EXTRA_EXCEEDED and VARIANT_REQUIRED', () => {
    const extraErr = new ApiError(400, 'Bad Request', 'Extra', {
      code: ErrorCode.MAX_EXTRA_EXCEEDED,
    });
    expect(translateErrorToFriendlyMessage(extraErr).title).toBe('Batas Topping Terlampaui');

    const variantErr = new ApiError(400, 'Bad Request', 'Varian', {
      code: ErrorCode.VARIANT_REQUIRED,
    });
    expect(translateErrorToFriendlyMessage(variantErr).title).toBe('Pilihan Wajib Belum Dipilih');
  });

  it('translates QRIS_EXPIRED, UNAUTHORIZED, and FORBIDDEN', () => {
    const qrisErr = new ApiError(400, 'Bad Request', 'QRIS Expired', {
      code: ErrorCode.QRIS_EXPIRED,
    });
    expect(translateErrorToFriendlyMessage(qrisErr).title).toBe('Waktu Pembayaran Habis');

    const unauthErr = new ApiError(401, 'Unauthorized', 'Auth', {
      code: ErrorCode.UNAUTHORIZED,
    });
    expect(translateErrorToFriendlyMessage(unauthErr).title).toBe('Akses Ditolak');

    const forbiddenErr = new ApiError(403, 'Forbidden', 'No Perm', {
      code: ErrorCode.FORBIDDEN,
    });
    expect(translateErrorToFriendlyMessage(forbiddenErr).title).toBe('Tidak Memiliki Izin');
  });

  it('translates NOT_FOUND, RATE_LIMITED, and CONTRACT_VIOLATION', () => {
    const notFound = new ApiError(404, 'Not Found', 'NF', { code: ErrorCode.NOT_FOUND });
    expect(translateErrorToFriendlyMessage(notFound).title).toBe('Data Tidak Ditemukan');

    const rateLimit = new ApiError(429, 'Rate Limit', 'RL', { code: ErrorCode.RATE_LIMITED });
    expect(translateErrorToFriendlyMessage(rateLimit).title).toBe('Terlu Banyak Permintaan'.replace('lu', 'lalu'));

    const contractErr = new ApiError(500, 'Contract', 'CV', { code: ErrorCode.CONTRACT_VIOLATION });
    expect(translateErrorToFriendlyMessage(contractErr).title).toBe('Pembaruan Data Diperlukan');
  });

  it('translates gateway and service unavailable errors', () => {
    const bg = new ApiError(502, 'Bad Gateway', 'BG', { code: ErrorCode.BAD_GATEWAY });
    expect(translateErrorToFriendlyMessage(bg).title).toBe('Layanan Sedang Sibuk');

    const su = new ApiError(503, 'Unavailable', 'SU', { code: ErrorCode.SERVICE_UNAVAILABLE });
    expect(translateErrorToFriendlyMessage(su).title).toBe('Layanan Sedang Sibuk');

    const gt = new ApiError(504, 'Timeout', 'GT', { code: ErrorCode.GATEWAY_TIMEOUT });
    expect(translateErrorToFriendlyMessage(gt).title).toBe('Layanan Sedang Sibuk');
  });

  it('translates NETWORK_OFFLINE into connection alert', () => {
    const error = ApiError.networkError();
    const friendly = translateErrorToFriendlyMessage(error);
    expect(friendly.title).toBe('Koneksi Terputus');
    expect(friendly.actionLabel).toBe('Coba Lagi');
  });

  it('translates INTERNAL_SERVER_ERROR or unknown ErrorCode to default', () => {
    const internalErr = new ApiError(500, 'Server Panic', 'Something broke', {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
    });
    const friendly = translateErrorToFriendlyMessage(internalErr);
    expect(friendly.title).toBe('Server Panic');
    expect(friendly.description).toBe('Something broke');
  });

  it('translates generic Error into fallback message', () => {
    const rawError = new Error('Database unexpected failure');
    const friendly = translateErrorToFriendlyMessage(rawError);
    expect(friendly.title).toBe('Terjadi Kesalahan');
    expect(friendly.description).toBe('Database unexpected failure');

    const emptyError = new Error('');
    const friendlyFallback = translateErrorToFriendlyMessage(emptyError, 'Fallback Pesan');
    expect(friendlyFallback.description).toBe('Fallback Pesan');

    const noMsgNoFallback = new Error('');
    expect(translateErrorToFriendlyMessage(noMsgNoFallback).description).toBe('Silakan coba beberapa saat lagi.');
  });
});
