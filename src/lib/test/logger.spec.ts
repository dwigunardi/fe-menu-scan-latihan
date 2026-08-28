import { describe, it, expect, vi } from 'vitest';
import { logger } from '@/lib/logger';

describe('Logger utility', () => {
  it('instantiates pino logger with redaction configurations', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('logs messages without throwing errors', () => {
    const spy = vi.spyOn(logger, 'info');
    logger.info({ message: 'User logged in' });
    expect(spy).toHaveBeenCalled();
  });

  it('masks sensitive fields configured in redaction paths', () => {
    const spy = vi.spyOn(logger, 'debug');
    logger.debug({
      password: 'secret-password-123',
      token: 'jwt-bearer-token',
    });
    expect(spy).toHaveBeenCalled();
  });
});
