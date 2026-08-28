import { describe, it, expect } from 'vitest';
import {
  getTodayRange,
  getPastDaysRange,
  getCurrentMonthRange,
  formatDateIndo,
  formatDateTimeIndo,
} from '@/lib/utils/date-helpers';

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
