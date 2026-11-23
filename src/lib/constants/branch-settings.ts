/**
 * Store Operation Modes Enum & Constants
 */
export const STORE_MODE = {
  SHIFT_DRIVEN: 'SHIFT_DRIVEN',
  CLOCK_DRIVEN: 'CLOCK_DRIVEN',
  QRIS_ONLY: 'QRIS_ONLY',
  EMERGENCY_CLOSED: 'EMERGENCY_CLOSED',
} as const;

export type StoreMode = (typeof STORE_MODE)[keyof typeof STORE_MODE];

export const ALL_STORE_MODES: readonly StoreMode[] = Object.values(STORE_MODE);

/**
 * Contingency Action Options when cashier is absent
 */
export const ABSENCE_CONTINGENCY_OPTION = {
  ACTING_CASHIER: 'ACTING_CASHIER',
  QRIS_ONLY: 'QRIS_ONLY',
  EMERGENCY_CLOSE: 'EMERGENCY_CLOSE',
} as const;

export type AbsenceContingencyOption =
  (typeof ABSENCE_CONTINGENCY_OPTION)[keyof typeof ABSENCE_CONTINGENCY_OPTION];

export const ALL_ABSENCE_CONTINGENCY_OPTIONS: readonly AbsenceContingencyOption[] =
  Object.values(ABSENCE_CONTINGENCY_OPTION);

/**
 * Days of the week Enum & Constants
 */
export const DAY_OF_WEEK = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY',
} as const;

export type DayOfWeek = (typeof DAY_OF_WEEK)[keyof typeof DAY_OF_WEEK];

export const ALL_DAYS_OF_WEEK: readonly DayOfWeek[] = Object.values(DAY_OF_WEEK);
