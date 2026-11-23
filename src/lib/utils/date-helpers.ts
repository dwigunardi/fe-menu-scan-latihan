/**
 * Date helper utilities for reports & dashboard filters
 */

/**
 * Returns ISO strings for the start and end of today (Local Time).
 */
export function getTodayRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/**
 * Returns ISO strings for the past N days.
 */
export function getPastDaysRange(days: number): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/**
 * Returns ISO strings for the start of the current month until today.
 */
export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/**
 * Formats ISO string into Indonesian localized date (e.g. "10 Agu 2026").
 */
export function formatDateIndo(dateStr: string | Date): string {
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
}

/**
 * Formats ISO string into localized date + time (e.g. "10 Agu 2026, 14:30").
 */
export function formatDateTimeIndo(dateStr: string | Date): string {
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '-';
  }
}

const WIB_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * Formats an ISO datetime as "HH:mm" in WIB (Asia/Jakarta), regardless of the device time zone.
 * The output fits `<input type="time">` and the backend's "HH:mm" (WIB) attendance correction input.
 * Returns null for empty or unparseable values.
 */
export function formatTimeWib(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return WIB_TIME_FORMAT.format(d);
}

const WIB_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Returns the calendar date in WIB (Asia/Jakarta) as "YYYY-MM-DD", matching the backend's
 * attendance `date`. Unlike `toISOString().split('T')[0]`, it does not return yesterday's
 * date between 00:00 and 07:00 WIB.
 */
export function getTodayWib(now: Date = new Date()): string {
  return WIB_DATE_FORMAT.format(now);
}
