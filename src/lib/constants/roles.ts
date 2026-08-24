/**
 * System-wide User Role Enum & Constants
 */
export const ROLE = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
  KITCHEN: 'KITCHEN',
  WAITER: 'WAITER',
  // Localized / backend fallback synonyms
  KASIR: 'KASIR',
  DAPUR: 'DAPUR',
  PELAYAN: 'PELAYAN',
} as const;

export const USER_ROLE = ROLE;

export type UserRole = (typeof ROLE)[keyof typeof ROLE];

export const ALL_ROLES: readonly UserRole[] = Object.values(ROLE);

/**
 * Predefined role groups for clean, reusable access control
 */
export const ROLE_GROUPS = {
  ADMIN_ONLY: [ROLE.ADMIN] as const,
  CASHIER_OR_ADMIN: [ROLE.ADMIN, ROLE.CASHIER, ROLE.KASIR] as const,
  KITCHEN_OR_ADMIN: [ROLE.ADMIN, ROLE.KITCHEN, ROLE.DAPUR, ROLE.CASHIER, ROLE.KASIR] as const,
  WAITER_OR_ADMIN: [ROLE.ADMIN, ROLE.WAITER, ROLE.PELAYAN] as const,
  ALL_STAFF: ALL_ROLES,
} as const;
