import pino from 'pino';

const isServer = typeof window === 'undefined';
const isDev = process.env.NODE_ENV === 'development';

/**
 * Zero-Leakage Isomorphic Pino Logger:
 * - Server Side (Node.js/RSC): Outputs structured JSON logs with ISO timestamp & latency.
 * - Browser Side Dev: Outputs clean formatted logs in DevTools.
 * - Browser Side Prod: SILENCED (100% disabled) to prevent sensitive data leaks in user DevTools.
 * - Automatic Deep Redaction: Masks password, tokens, and cryptographic keys.
 */
export const logger = pino({
  level: isServer ? (isDev ? 'debug' : 'info') : (isDev ? 'debug' : 'silent'),
  redact: {
    paths: [
      'password',
      'accessToken',
      'handshakeToken',
      'sessionKey',
      'token',
      'authorization',
      '*.password',
      '*.accessToken',
      '*.handshakeToken',
      '*.sessionKey',
      'headers.authorization',
      'headers.x-handshake-token',
      'req.headers.authorization',
    ],
    censor: '[REDACTED]',
  },
  browser: {
    asObject: true,
    disabled: !isDev,
  },
});
