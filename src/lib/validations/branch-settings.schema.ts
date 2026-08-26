import { z } from 'zod';

export const DayScheduleSchema = z.object({
  day: z.enum([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ]),
  isOpen: z.boolean().default(true),
  openTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm (contoh: 08:00)'),
  closeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm (contoh: 22:00)'),
});

export type DaySchedule = z.infer<typeof DayScheduleSchema>;

export const StoreModeEnum = z.enum([
  'SHIFT_DRIVEN',
  'CLOCK_DRIVEN',
  'QRIS_ONLY',
  'EMERGENCY_CLOSED',
]);

export type StoreMode = z.infer<typeof StoreModeEnum>;

export const BranchSettingSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Nama cabang minimal 2 karakter').default('Kumpul Cafe - Cabang Pusat'),
  address: z
    .string()
    .min(5, 'Alamat cabang minimal 5 karakter')
    .default('Jl. Tebet Raya No. 45, Jakarta Selatan'),
  latitude: z.coerce.number().min(-90).max(90, 'Latitude tidak valid').default(-6.2297465),
  longitude: z.coerce.number().min(-180).max(180, 'Longitude tidak valid').default(106.8557342),
  geofenceRadius: z.coerce
    .number()
    .min(50, 'Radius minimal 50 meter')
    .max(500, 'Radius maksimal 500 meter')
    .default(100),
  openTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm')
    .default('08:00'),
  closeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm')
    .default('22:00'),
  lateGracePeriod: z.coerce
    .number()
    .min(0, 'Toleransi minimal 0 menit')
    .max(120, 'Toleransi maksimal 120 menit')
    .default(15),
  isStoreOpen: z.boolean().default(true),
  storeMode: StoreModeEnum.default('SHIFT_DRIVEN'),
  emergencyReason: z.string().nullable().optional(),
  timezone: z.string().default('Asia/Jakarta'),
  phone: z.string().nullable().optional(),
  email: z.string().email('Format email tidak valid').nullable().optional(),
  schedules: z.array(DayScheduleSchema).optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BranchSetting = z.infer<typeof BranchSettingSchema>;

export const UpdateBranchSettingInputSchema = z.object({
  name: z.string().min(2, 'Nama cabang minimal 2 karakter'),
  address: z.string().min(5, 'Alamat cabang minimal 5 karakter'),
  latitude: z.coerce.number().min(-90).max(90, 'Latitude tidak valid'),
  longitude: z.coerce.number().min(-180).max(180, 'Longitude tidak valid'),
  geofenceRadius: z.coerce
    .number()
    .min(50, 'Radius minimal 50 meter')
    .max(500, 'Radius maksimal 500 meter'),
  openTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm (contoh: 08:00)'),
  closeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm (contoh: 22:00)'),
  lateGracePeriod: z.coerce
    .number()
    .min(0, 'Toleransi minimal 0 menit')
    .max(120, 'Toleransi maksimal 120 menit'),
  storeMode: StoreModeEnum,
  timezone: z.string().default('Asia/Jakarta'),
  phone: z.string().optional().nullable(),
  email: z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  schedules: z.array(DayScheduleSchema).optional().nullable(),
});

export type UpdateBranchSettingInput = z.infer<typeof UpdateBranchSettingInputSchema>;

export const UpdateStoreStatusInputSchema = z.object({
  isStoreOpen: z.boolean(),
  storeMode: StoreModeEnum.optional(),
  emergencyReason: z.string().optional().nullable(),
});

export type UpdateStoreStatusInput = z.infer<typeof UpdateStoreStatusInputSchema>;

export const PublicBranchLocationSchema = z.object({
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  geofenceRadius: z.number(),
  isStoreOpen: z.boolean(),
  storeMode: StoreModeEnum,
  openTime: z.string(),
  closeTime: z.string(),
  timezone: z.string(),
});

export type PublicBranchLocation = z.infer<typeof PublicBranchLocationSchema>;
