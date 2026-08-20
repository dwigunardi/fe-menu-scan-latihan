import { encryptPayload, decryptPayload } from '../../crypto/ecdh';
import { ApiError } from '../api-error';
import { ErrorCode } from '../error-codes';
import { Middleware } from './types';

/**
 * Encryption Middleware:
 * Transparently encrypts outgoing request payloads and decrypts incoming response envelopes.
 */
export const encryptionMiddleware: Middleware = async (ctx, next) => {
  // 1. Outgoing Payload Encryption
  if (ctx.body && !ctx.options.skipEncryption && ctx.sessionKey) {
    const encryptedEnvelope = await encryptPayload(ctx.body, ctx.sessionKey);
    ctx.body = JSON.stringify(encryptedEnvelope);
    ctx.headers['Content-Type'] = 'application/json';
  } else if (ctx.body && typeof ctx.body === 'object' && !(ctx.body instanceof FormData)) {
    ctx.body = JSON.stringify(ctx.body);
    ctx.headers['Content-Type'] = 'application/json';
  }

  await next();

  // 2. Incoming Response Decryption
  const json = ctx.responseData as any;
  if (json?.encrypted && json?.payload && json?.iv && json?.tag) {
    if (!ctx.sessionKey) {
      throw new ApiError(
        500,
        'Decryption Error',
        'Session key tidak tersedia untuk mendekripsi response.',
        { code: ErrorCode.DECRYPTION_FAILED }
      );
    }

    try {
      ctx.responseData = await decryptPayload(json, ctx.sessionKey);
    } catch {
      throw new ApiError(
        500,
        'Decryption Error',
        'Gagal mendekripsi response aman dari server.',
        { code: ErrorCode.DECRYPTION_FAILED }
      );
    }
  }
};
