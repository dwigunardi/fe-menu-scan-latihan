import { ErrorCode, resolveErrorCodeFromStatus } from './error-codes';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly errorTitle: string;
  readonly details?: ApiErrorDetail[];
  readonly isOperational: boolean;

  constructor(
    statusCode: number,
    errorTitle: string,
    message: string,
    options?: {
      code?: ErrorCode;
      details?: ApiErrorDetail[];
      isOperational?: boolean;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorTitle = errorTitle;
    this.code = options?.code ?? resolveErrorCodeFromStatus(statusCode);
    this.details = options?.details;
    this.isOperational = options?.isOperational ?? true;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static networkError(message = 'Koneksi internet terputus atau server tidak dapat dihubungi.'): ApiError {
    return new ApiError(0, 'Network Error', message, {
      code: ErrorCode.NETWORK_OFFLINE,
    });
  }

  static contractViolation(endpoint: string, details: ApiErrorDetail[]): ApiError {
    return new ApiError(
      500,
      'Contract Violation',
      `Data response dari server (${endpoint}) tidak sesuai dengan format schema yang diharapkan.`,
      {
        code: ErrorCode.CONTRACT_VIOLATION,
        details,
        isOperational: false,
      }
    );
  }

  static handshakeFailed(message = 'Gagal melakukan negosiasi kunci keamanan dengan server.'): ApiError {
    return new ApiError(500, 'Handshake Failed', message, {
      code: ErrorCode.HANDSHAKE_FAILED,
    });
  }
}
