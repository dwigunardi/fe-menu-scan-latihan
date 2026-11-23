import { describe, it, expect } from 'vitest';
import {
  getTodayRange,
  getPastDaysRange,
  getCurrentMonthRange,
  formatDateIndo,
  formatDateTimeIndo,
  formatTimeWib,
} from '@/lib/utils/date-helpers';

describe('formatTimeWib', () => {
  it('formats a UTC ISO datetime as HH:mm in WIB (UTC+7)', () => {
    expect(formatTimeWib('2026-11-21T15:05:00.000Z')).toBe('22:05');
    expect(formatTimeWib('2026-11-21T01:00:00.000Z')).toBe('08:00');
  });

  it('uses 00 for midnight instead of 24', () => {
    expect(formatTimeWib('2026-11-21T17:00:00.000Z')).toBe('00:00');
  });

  it('returns null for empty or invalid values', () => {
    expect(formatTimeWib(null)).toBeNull();
    expect(formatTimeWib(undefined)).toBeNull();
    expect(formatTimeWib('')).toBeNull();
    expect(formatTimeWib('bukan-tanggal')).toBeNull();
  });
});

describe('Date Helpers Utility', () => {
  it('returns valid ISO strings for getTodayRange', () => {
    const { startDate, endDate } = getTodayRange();
    expect(startDate).toBeDefined();
    expect(endDate).toBeDefined();
    expect(new Date(startDate).getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
  });

  it('returns valid ISO strings for getPastDaysRange', () => {
    const { startDate, endDate } = getPastDaysRange(7);
    expect(startDate).toBeDefined();
    expect(endDate).toBeDefined();
    expect(new Date(startDate).getTime()).toBeLessThan(new Date(endDate).getTime());
  });

  it('returns valid ISO strings for getCurrentMonthRange', () => {
    const { startDate, endDate } = getCurrentMonthRange();
    expect(startDate).toBeDefined();
    expect(endDate).toBeDefined();
    expect(new Date(startDate).getDate()).toBe(1);
  });

  describe('formatDateIndo', () => {
    it('formats ISO date string properly', () => {
      const formatted = formatDateIndo('2026-08-17T10:00:00.000Z');
      expect(formatted).toContain('2026');
    });

    it('formats Date object properly', () => {
      const formatted = formatDateIndo(new Date('2026-08-17T10:00:00.000Z'));
      expect(formatted).toContain('2026');
    });

    it('returns "-" for invalid date string or invalid object', () => {
      expect(formatDateIndo('invalid-date-string')).toBe('-');
      expect(formatDateIndo(new Date('invalid'))).toBe('-');
    });
  });

  describe('formatDateTimeIndo', () => {
    it('formats ISO date time string properly', () => {
      const formatted = formatDateTimeIndo('2026-08-17T14:30:00.000Z');
      expect(formatted).toContain('2026');
    });

    it('formats Date object properly', () => {
      const formatted = formatDateTimeIndo(new Date('2026-08-17T14:30:00.000Z'));
      expect(formatted).toContain('2026');
    });

    it('returns "-" for invalid date string or invalid object', () => {
      expect(formatDateTimeIndo('invalid-date-string')).toBe('-');
      expect(formatDateTimeIndo(new Date('invalid'))).toBe('-');
    });
  });
});
