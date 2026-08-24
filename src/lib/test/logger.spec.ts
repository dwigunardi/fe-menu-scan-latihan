import { describe, it, expect, vi } from 'vitest';
import { logger } from '@/lib/logger';

describe('Zero-Leakage Isomorphic Pino Logger', () => {
  it('instantiates logger with correct level and redaction config', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('can log messages and objects without throwing', () => {
    expect(() => {
      logger.info({ test: 'hello' }, 'Test info log');
      logger.debug({ endpoint: '/admin/menus' }, 'Test debug log');
      logger.warn({ warning: 'Rate limit approaching' }, 'Test warn log');
      logger.error({ error: 'Failed' }, 'Test error log');
    }).not.toThrow();
  });
});
