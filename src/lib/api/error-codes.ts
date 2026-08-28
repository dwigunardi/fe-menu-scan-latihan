/**
 * Standardized Error Codes across HTTP and Kumpul Cafe domain exceptions.
 */
export enum ErrorCode {
  // HTTP Standard Errors
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_GATEWAY = 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',

  // Client & Network Errors
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',

  // Security & Crypto Errors
  HANDSHAKE_REQUIRED = 'HANDSHAKE_REQUIRED',
  HANDSHAKE_EXPIRED = 'HANDSHAKE_EXPIRED',
  HANDSHAKE_FAILED = 'HANDSHAKE_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',

  // Schema & Contract Errors
  CONTRACT_VIOLATION = 'CONTRACT_VIOLATION',

  // Restaurant & Cafe Domain Errors
  TABLE_OCCUPIED = 'TABLE_OCCUPIED',
  TABLE_NOT_FOUND = 'TABLE_NOT_FOUND',
  TABLE_SESSION_INVALID = 'TABLE_SESSION_INVALID',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  VARIANT_REQUIRED = 'VARIANT_REQUIRED',
  MAX_EXTRA_EXCEEDED = 'MAX_EXTRA_EXCEEDED',
  ORDER_ALREADY_PAID = 'ORDER_ALREADY_PAID',
  QRIS_EXPIRED = 'QRIS_EXPIRED',

  // File & Media Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
}

/**
 * Resolves standard HTTP status code into ErrorCode enum.
 */
export function resolveErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 422:
      return ErrorCode.UNPROCESSABLE_ENTITY;
    case 429:
      return ErrorCode.RATE_LIMITED;
    case 502:
      return ErrorCode.BAD_GATEWAY;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    case 504:
      return ErrorCode.GATEWAY_TIMEOUT;
    case 500:
    default:
      return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}
