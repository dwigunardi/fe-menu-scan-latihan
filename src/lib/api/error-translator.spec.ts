import { describe, it, expect } from 'vitest';
import { ApiError } from './api-error';
import { ErrorCode } from './error-codes';
import { translateErrorToFriendlyMessage } from './error-translator';

describe('Error Translator', () => {
  it('should translate TABLE_OCCUPIED into user-friendly message', () => {
    const error = new ApiError(409, 'Conflict', 'Meja terisi', {
      code: ErrorCode.TABLE_OCCUPIED,
    });

    const friendly = translateErrorToFriendlyMessage(error);
    expect(friendly.title).toBe('Meja Sedang Digunakan');
    expect(friendly.description).toContain('terdaftar atas nama pelanggan lain');
  });

  it('should translate OUT_OF_STOCK into user-friendly message', () => {
    const error = new ApiError(400, 'Bad Request', 'Stok habis', {
      code: ErrorCode.OUT_OF_STOCK,
    });

    const friendly = translateErrorToFriendlyMessage(error);
    expect(friendly.title).toBe('Stok Menu Habis');
    expect(friendly.description).toContain('habis terjual');
  });

  it('should translate NETWORK_OFFLINE into connection alert', () => {
    const error = ApiError.networkError();

    const friendly = translateErrorToFriendlyMessage(error);
    expect(friendly.title).toBe('Koneksi Terputus');
    expect(friendly.actionLabel).toBe('Coba Lagi');
  });

  it('should translate generic Error into fallback message', () => {
    const rawError = new Error('Database unexpected failure');

    const friendly = translateErrorToFriendlyMessage(rawError);
    expect(friendly.title).toBe('Terjadi Kesalahan');
    expect(friendly.description).toBe('Database unexpected failure');
  });
});
