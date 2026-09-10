import { z } from 'zod';
import { ROLE } from '../constants/roles';

export const StaffRoleSchema = z.enum([
  ROLE.ADMIN,
  ROLE.CASHIER,
  ROLE.KITCHEN,
  ROLE.WAITER,
]);

export type StaffRole = z.infer<typeof StaffRoleSchema>;

export const StaffItemSchema = z.object({
  id: z.string(),
  employeeId: z.string().nullable().optional(),
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.email('Format email tidak valid'),
  phone: z.string().nullable().optional(),
  role: StaffRoleSchema,
  pinCodeSet: z.boolean().default(false),
  needsOnboarding: z.boolean().optional(),
  dailyShiftHours: z.coerce.number().min(1).max(24).default(8),
  isActive: z.boolean().default(true),
  avatarUrl: z.string().nullable().optional(),
  isEmailVerified: z.boolean().default(false),
  isPhoneVerified: z.boolean().default(false),
  joinedAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type StaffItem = z.infer<typeof StaffItemSchema>;

export const CreateStaffInputSchema = z.object({
  employeeId: z
    .string()
    .regex(/^[A-Za-z0-9\-_/]{2,20}$/, 'NIK/ID Karyawan hanya boleh 2-20 karakter alfanumerik, strip, underscore, atau garis miring')
    .optional()
    .or(z.literal('')),
  name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  email: z.email('Format email tidak valid'),
  phone: z
    .string()
    .min(10, 'Nomor WhatsApp minimal 10 digit')
    .max(15, 'Nomor WhatsApp maksimal 15 digit')
    .regex(/^[0-9+]+$/, 'Nomor WhatsApp hanya boleh angka dan tanda +')
    .optional()
    .or(z.literal('')),
  role: StaffRoleSchema,
  password: z.string().min(6, 'Password minimal 6 karakter'),
  pinCode: z
    .string()
    .regex(/^\d{4}$/, 'PIN harus berupa 4 angka')
    .optional()
    .or(z.literal('')),
  dailyShiftHours: z.coerce.number().min(1, 'Minimal 1 jam').max(24, 'Maksimal 24 jam').default(8),
});

export type CreateStaffInput = z.infer<typeof CreateStaffInputSchema>;

export const UpdateStaffInputSchema = z.object({
  employeeId: z
    .string()
    .regex(/^[A-Za-z0-9\-_/]{2,20}$/, 'NIK/ID Karyawan hanya boleh 2-20 karakter alfanumerik, strip, underscore, atau garis miring')
    .optional()
    .or(z.literal('')),
  name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  email: z.email('Format email tidak valid'),
  phone: z
    .string()
    .min(10, 'Nomor WhatsApp minimal 10 digit')
    .max(15, 'Nomor WhatsApp maksimal 15 digit')
    .regex(/^[0-9+]+$/, 'Nomor WhatsApp hanya boleh angka dan tanda +')
    .optional()
    .or(z.literal('')),
  role: StaffRoleSchema,
  isActive: z.boolean().optional().default(true),
  dailyShiftHours: z.coerce.number().min(1).max(24).default(8),
});

export type UpdateStaffInput = z.infer<typeof UpdateStaffInputSchema>;

export const CompleteOnboardInputSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z
      .string()
      .min(8, 'Password baru minimal 8 karakter')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password baru harus mengandung huruf besar, huruf kecil, dan angka'
      ),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
    pinCode: z
      .string()
      .regex(/^\d{4}$/, 'PIN harus berupa 4 digit angka')
      .refine((pin) => !/^(.)\1{3}$/.test(pin), {
        message: 'PIN tidak boleh menggunakan 4 angka yang sama (contoh: 1111, 0000)',
      })
      .refine(
        (pin) =>
          ![
            '0123',
            '1234',
            '2345',
            '3456',
            '4567',
            '5678',
            '6789',
            '9876',
            '8765',
            '7654',
            '6543',
            '5432',
            '4321',
            '3210',
          ].includes(pin),
        {
          message: 'PIN tidak boleh menggunakan angka berurutan (contoh: 1234, 4321)',
        }
      ),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Password baru tidak boleh sama dengan password sementara saat ini',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok dengan password baru',
    path: ['confirmPassword'],
  });

export type CompleteOnboardInput = z.infer<typeof CompleteOnboardInputSchema>;

export const UpdateStaffPinInputSchema = z.object({
  pinCode: z.string().regex(/^\d{4}$/, 'PIN harus berupa 4 angka'),
});

export type UpdateStaffPinInput = z.infer<typeof UpdateStaffPinInputSchema>;

export const PinUpdateResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().default('PIN 4-digit karyawan berhasil diperbarui'),
}).passthrough();

export type PinUpdateResponse = z.infer<typeof PinUpdateResponseSchema>;

export const DeleteStaffResponseSchema = z.object({
  success: z.boolean().default(true),
}).passthrough();

export type DeleteStaffResponse = z.infer<typeof DeleteStaffResponseSchema>;

export interface StaffQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export const StaffQueryParamsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const StaffPaginatedResponseSchema = z.object({
  items: z.array(StaffItemSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export type StaffPaginatedResponse = z.infer<typeof StaffPaginatedResponseSchema>;
