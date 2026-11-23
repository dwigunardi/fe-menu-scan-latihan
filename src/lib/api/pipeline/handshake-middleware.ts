import { ensureHandshakeSession } from '../handshake-session';
import { Middleware } from './types';

/**
 * Handshake Middleware:
 * Ensures active ECDH session key & token, and injects 'x-handshake-token' header.
 * If handshake session is temporarily unavailable, gracefully falls back to standard HTTP transport.
 */
export const handshakeMiddleware: Middleware = async (ctx, next) => {
  if (!ctx.options.skipHandshakeToken) {
    const sessionResult = await ensureHandshakeSession();

    if (sessionResult.isLeft()) {
      throw sessionResult.value;
    }

    ctx.sessionKey = sessionResult.value.sessionKey;
    ctx.headers['x-handshake-token'] = sessionResult.value.handshakeToken;
  }

  await next();
};
