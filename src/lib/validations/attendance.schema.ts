import { z } from 'zod';
import { ATTENDANCE_STATUS, LEAVE_TYPE, LEAVE_STATUS } from '../constants/attendance';
import { StaffRoleSchema } from './staff.schema';

export const AttendanceStatusSchema = z.enum([
  ATTENDANCE_STATUS.ON_TIME,
  ATTENDANCE_STATUS.LATE,
  ATTENDANCE_STATUS.EARLY_LEAVE,
  ATTENDANCE_STATUS.COMPLETED,
  ATTENDANCE_STATUS.SICK,
  ATTENDANCE_STATUS.LEAVE,
  ATTENDANCE_STATUS.ABSENT,
]);

export const LeaveTypeSchema = z.enum([
  LEAVE_TYPE.SICK,
  LEAVE_TYPE.ANNUAL_LEAVE,
  LEAVE_TYPE.URGENT_MATTER,
  LEAVE_TYPE.OTHER,
]);

export const LeaveStatusSchema = z.enum([
  LEAVE_STATUS.PENDING,
  LEAVE_STATUS.APPROVED,
  LEAVE_STATUS.REJECTED,
]);

export const AttendanceItemSchema = z.object({
  id: z.string(),
  branchId: z.string().default('default-branch'),
  staffId: z.string(),
  staffName: z.string(),
  staffRole: StaffRoleSchema,
  avatarUrl: z.string().nullable().optional(),
  date: z.string(), // YYYY-MM-DD
  clockInTime: z.string().nullable().optional(),
  clockOutTime: z.string().nullable().optional(),
  status: AttendanceStatusSchema.default(ATTENDANCE_STATUS.ON_TIME),
  clockInLat: z.number().nullable().optional(),
  clockInLon: z.number().nullable().optional(),
  clockInDistanceMeters: z.number().nullable().optional(),
  isWithinGeofence: z.boolean().default(true),
  workDurationMinutes: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  leaveType: LeaveTypeSchema.nullable().optional(),
  leaveStatus: LeaveStatusSchema.nullable().optional(),
  leaveReason: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type AttendanceItem = z.infer<typeof AttendanceItemSchema>;

export const ClockInInputSchema = z.object({
  staffId: z.string().min(1, 'Pilih staf yang akan presensi'),
  pinCode: z.string().regex(/^\d{4}$/, 'PIN harus berupa 4 angka'),
  latitude: z.number({ message: 'Koordinat latitude GPS wajib tersedia' }),
  longitude: z.number({ message: 'Koordinat longitude GPS wajib tersedia' }),
  notes: z.string().optional(),
});

export type ClockInInput = z.infer<typeof ClockInInputSchema>;

export const ClockOutInputSchema = z.object({
  staffId: z.string().min(1, 'Pilih staf yang akan presensi pulang'),
  pinCode: z.string().regex(/^\d{4}$/, 'PIN harus berupa 4 angka'),
  latitude: z.number({ message: 'Koordinat latitude GPS wajib tersedia' }),
  longitude: z.number({ message: 'Koordinat longitude GPS wajib tersedia' }),
  notes: z.string().optional(),
});

export type ClockOutInput = z.infer<typeof ClockOutInputSchema>;

export const LeaveRequestInputSchema = z.object({
  staffId: z.string().min(1, 'Pilih nama staf'),
  leaveType: LeaveTypeSchema,
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  reason: z.string().min(3, 'Alasan izin minimal 3 karakter'),
});

export type LeaveRequestInput = z.infer<typeof LeaveRequestInputSchema>;

export const LeaveResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type LeaveResponse = z.infer<typeof LeaveResponseSchema>;

export const AttendanceQueryParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: AttendanceStatusSchema.optional(),
  role: StaffRoleSchema.optional(),
  search: z.string().optional(),
});

export type AttendanceQueryParams = z.input<typeof AttendanceQueryParamsSchema>;

export const AttendanceSummarySchema = z.object({
  totalStaff: z.number().default(0),
  presentCount: z.number().default(0),
  onTimeCount: z.number().default(0),
  lateCount: z.number().default(0),
  earlyLeaveCount: z.number().default(0),
  leaveCount: z.number().default(0),
  absentCount: z.number().default(0),
  attendanceRatePercent: z.number().default(0),
});

export type AttendanceSummaryData = z.infer<typeof AttendanceSummarySchema>;

export const AttendancePaginatedResponseSchema = z.object({
  items: z.array(AttendanceItemSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export type AttendancePaginatedResponse = z.infer<typeof AttendancePaginatedResponseSchema>;
