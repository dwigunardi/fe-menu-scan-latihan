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
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.email('Format email tidak valid'),
  phone: z.string().nullable().optional(),
  role: StaffRoleSchema,
  pinCodeSet: z.boolean().default(false),
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

export const UpdateStaffPinInputSchema = z.object({
  pinCode: z.string().regex(/^\d{4}$/, 'PIN harus berupa 4 angka'),
});

export type UpdateStaffPinInput = z.infer<typeof UpdateStaffPinInputSchema>;

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
