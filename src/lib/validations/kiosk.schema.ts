import { z } from 'zod';
import { AttendanceStatusSchema } from './attendance.schema';

/** Today's attendance of one staff member (WIB date), as returned in the kiosk roster. */
export const KioskTodayAttendanceSchema = z.object({
  attendanceId: z.string(),
  clockInTime: z.string().nullable(), // ISO datetime (UTC)
  clockOutTime: z.string().nullable(), // ISO datetime (UTC)
  status: AttendanceStatusSchema,
});

/**
 * One staff card on the attendance kiosk (GET /admin/attendance/kiosk-roster, ADMIN + CASHIER).
 * Minimal fields on purpose: no email or phone, since the kiosk is a shared screen.
 */
export const KioskRosterItemSchema = z.object({
  id: z.string(),
  employeeId: z.string().nullable(),
  name: z.string(),
  role: z.enum(['ADMIN', 'CASHIER', 'KITCHEN', 'WAITER']),
  avatarUrl: z.string().nullable(),
  /** Staff without a PIN cannot clock in or out yet. */
  hasPin: z.boolean(),
  /** null when the staff has no attendance record today. */
  today: KioskTodayAttendanceSchema.nullable(),
});

export const KioskRosterSchema = z.array(KioskRosterItemSchema);

export type KioskTodayAttendance = z.infer<typeof KioskTodayAttendanceSchema>;
export type KioskRosterItem = z.infer<typeof KioskRosterItemSchema>;
