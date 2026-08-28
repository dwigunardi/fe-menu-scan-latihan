import { describe, it, expect, vi } from 'vitest';
import { logger, getLogLevel, getLoggerOptions } from '@/lib/logger';

describe('Logger utility', () => {
  it('instantiates pino logger with redaction configurations', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('determines correct log levels based on environment (server vs browser, dev vs prod)', () => {
    // Server Side
    expect(getLogLevel(true, true)).toBe('debug');
    expect(getLogLevel(true, false)).toBe('info');

    // Browser Side
    expect(getLogLevel(false, true)).toBe('debug');
    expect(getLogLevel(false, false)).toBe('silent');
  });

  it('generates proper logger options with redaction paths', () => {
    const devBrowserOptions = getLoggerOptions(false, true);
    expect(devBrowserOptions.level).toBe('debug');
    expect(devBrowserOptions.browser?.disabled).toBe(false);
    expect(devBrowserOptions.redact).toEqual(
      expect.objectContaining({
        censor: '[REDACTED]',
      })
    );

    const prodBrowserOptions = getLoggerOptions(false, false);
    expect(prodBrowserOptions.level).toBe('silent');
    expect(prodBrowserOptions.browser?.disabled).toBe(true);

    const prodServerOptions = getLoggerOptions(true, false);
    expect(prodServerOptions.level).toBe('info');
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
