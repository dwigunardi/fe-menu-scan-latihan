import { describe, it, expect } from 'vitest';
import { ErrorCode, resolveErrorCodeFromStatus } from './error-codes';

describe('error-codes', () => {
  describe('resolveErrorCodeFromStatus', () => {
    it('maps standard 4xx client status codes accurately', () => {
      expect(resolveErrorCodeFromStatus(400)).toBe(ErrorCode.BAD_REQUEST);
      expect(resolveErrorCodeFromStatus(401)).toBe(ErrorCode.UNAUTHORIZED);
      expect(resolveErrorCodeFromStatus(403)).toBe(ErrorCode.FORBIDDEN);
      expect(resolveErrorCodeFromStatus(404)).toBe(ErrorCode.NOT_FOUND);
      expect(resolveErrorCodeFromStatus(409)).toBe(ErrorCode.CONFLICT);
      expect(resolveErrorCodeFromStatus(422)).toBe(ErrorCode.UNPROCESSABLE_ENTITY);
      expect(resolveErrorCodeFromStatus(429)).toBe(ErrorCode.RATE_LIMITED);
    });

    it('maps standard 5xx server status codes accurately', () => {
      expect(resolveErrorCodeFromStatus(500)).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(resolveErrorCodeFromStatus(502)).toBe(ErrorCode.BAD_GATEWAY);
      expect(resolveErrorCodeFromStatus(503)).toBe(ErrorCode.SERVICE_UNAVAILABLE);
      expect(resolveErrorCodeFromStatus(504)).toBe(ErrorCode.GATEWAY_TIMEOUT);
    });

    it('falls back to INTERNAL_SERVER_ERROR for unhandled or unknown status codes', () => {
      expect(resolveErrorCodeFromStatus(418)).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(resolveErrorCodeFromStatus(999)).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    });
  });
});
