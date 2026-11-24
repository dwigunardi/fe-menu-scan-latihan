import { ErrorCode } from './error-codes';
import { ApiError } from './api-error';

export interface FriendlyErrorMessage {
  title: string;
  description: string;
  actionLabel?: string;
}

// NestJS throttler's default 429 text ("ThrottlerException: Too Many Requests") is not for end users
const GENERIC_THROTTLE_MESSAGE = /throttler|too many requests/i;

/**
 * Returns the backend's own 429 message when it is meant for users, e.g. the PIN lockout
 * "Terlalu banyak percobaan PIN. Coba lagi dalam 4 menit." Returns null for other errors and
 * for the generic throttler text, so callers can fall back to their own wording.
 */
export function getRateLimitMessage(error: ApiError): string | null {
  if (error.statusCode !== 429 || !error.message) return null;
  return GENERIC_THROTTLE_MESSAGE.test(error.message) ? null : error.message;
}

/**
 * Translates technical error codes and API exceptions into human-friendly,
 * polite, and informative Indonesian UI messages for Kumpul Cafe customers and staff.
 */
export function translateErrorToFriendlyMessage(
  error: ApiError | Error,
  customFallback?: string
): FriendlyErrorMessage {
  if (!(error instanceof ApiError)) {
    return {
      title: 'Terjadi Kesalahan',
      description: error.message || customFallback || 'Silakan coba beberapa saat lagi.',
      actionLabel: 'Coba Lagi',
    };
  }

  switch (error.code) {
    case ErrorCode.NETWORK_OFFLINE:
      return {
        title: 'Server Tidak Terjangkau / Offline',
        description:
          error.message ||
          'Tidak dapat terhubung ke server. Periksa koneksi internet atau status server.',
        actionLabel: 'Coba Lagi',
      };

    case ErrorCode.HANDSHAKE_FAILED:
      return {
        title: 'Gagal Negosiasi Keamanan',
        description:
          error.message ||
          'Gagal melakukan pertukaran kunci enkripsi dengan server. Silakan muat ulang halaman.',
        actionLabel: 'Muat Ulang',
      };

    case ErrorCode.TABLE_OCCUPIED:
      return {
        title: 'Meja Sedang Digunakan',
        description: 'Meja ini sudah terdaftar atas nama pelanggan lain. Anda dapat bergabung atau memilih meja lain.',
        actionLabel: 'Lihat Opsi',
      };

    case ErrorCode.TABLE_NOT_FOUND:
      return {
        title: 'Meja Tidak Ditemukan',
        description: 'Nomor meja pada QR Code tidak terdaftar di sistem kafe.',
      };

    case ErrorCode.TABLE_SESSION_INVALID:
      return {
        title: 'Sesi Meja Berakhir',
        description: 'Sesi meja Anda telah di-reset oleh kasir. Silakan scan ulang QR meja.',
        actionLabel: 'Scan Ulang',
      };

    case ErrorCode.OUT_OF_STOCK:
      return {
        title: 'Stok Menu Habis',
        description: 'Mohon maaf, menu atau varian yang Anda pilih baru saja habis terjual.',
      };

    case ErrorCode.MAX_EXTRA_EXCEEDED:
      return {
        title: 'Batas Topping Terlampaui',
        description: 'Jumlah pilihan ekstra/topping melebihi batas maksimal yang diperbolehkan.',
      };

    case ErrorCode.VARIANT_REQUIRED:
      return {
        title: 'Pilihan Wajib Belum Dipilih',
        description: 'Silakan pilih varian wajib (seperti ukuran atau suhu) sebelum menambahkan ke keranjang.',
      };

    case ErrorCode.QRIS_EXPIRED:
      return {
        title: 'Waktu Pembayaran Habis',
        description: 'Kode QRIS telah kadaluarsa (melebihi 15 menit). Silakan buat pesanan baru.',
        actionLabel: 'Pesan Ulang',
      };

    case ErrorCode.UNAUTHORIZED:
      return {
        title: 'Akses Ditolak',
        description: 'Silakan login terlebih dahulu untuk mengakses fitur ini.',
        actionLabel: 'Login',
      };

    // Backend 401 codes. The login message comes from the backend in English
    // ("Invalid email or password"), so this one uses fixed Indonesian text.
    case ErrorCode.INVALID_CREDENTIALS:
      return {
        title: 'Login Gagal',
        description: 'Email atau password salah.',
      };

    case ErrorCode.INVALID_TEMP_PASSWORD:
      return {
        title: 'Password Sementara Salah',
        description: error.message || 'Password sementara yang Anda masukkan tidak sesuai.',
      };

    case ErrorCode.ACCOUNT_DISABLED:
      return {
        title: 'Akun Dinonaktifkan',
        description: 'Akun ini sudah tidak aktif. Hubungi admin cabang untuk mengaktifkannya kembali.',
      };

    case ErrorCode.TOKEN_EXPIRED:
    case ErrorCode.TOKEN_MISSING:
    case ErrorCode.TOKEN_INVALID:
      return {
        title: 'Sesi Berakhir',
        description: 'Silakan login kembali untuk melanjutkan.',
        actionLabel: 'Login',
      };

    case ErrorCode.FORBIDDEN:
      return {
        title: 'Tidak Memiliki Izin',
        description: 'Akun Anda tidak memiliki hak akses untuk tindakan ini.',
      };

    case ErrorCode.NOT_FOUND:
      return {
        title: 'Data Tidak Ditemukan',
        description: 'Item atau informasi yang dicari tidak tersedia di sistem.',
      };

    case ErrorCode.RATE_LIMITED:
      return {
        title: 'Terlalu Banyak Permintaan',
        // Keep the backend's wait time (PIN lockout lasts minutes, not seconds)
        description:
          getRateLimitMessage(error) ?? 'Mohon tunggu beberapa detik sebelum mencoba kembali.',
      };

    case ErrorCode.CONTRACT_VIOLATION:
      return {
        title: 'Pembaruan Data Diperlukan',
        description: 'Terjadi ketidaksesuaian data sementara. Halaman akan dimuat ulang secara otomatis.',
        actionLabel: 'Muat Ulang',
      };

    case ErrorCode.BAD_GATEWAY:
    case ErrorCode.SERVICE_UNAVAILABLE:
    case ErrorCode.GATEWAY_TIMEOUT:
      return {
        title: 'Layanan Sedang Sibuk',
        description: 'Server kafe sedang dalam pemeliharaan singkat atau kelebihan beban. Coba sebentar lagi.',
        actionLabel: 'Coba Lagi',
      };

    case ErrorCode.INTERNAL_SERVER_ERROR:
    default:
      return {
        title: error.errorTitle || 'Terjadi Kendala',
        description: error.message || customFallback || 'Terjadi kesalahan sistem. Tim kami sedang menanganinya.',
        actionLabel: 'Coba Lagi',
      };
  }
}
