import { z } from 'zod';

export const ShiftTemplateItemSchema = z.object({
  id: z.string(),
  branchId: z.string().default('default-branch'),
  name: z.string().min(2, 'Nama template shift minimal 2 karakter'),
  code: z.string().min(2, 'Kode shift minimal 2 karakter'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm (contoh: 08:00)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm (contoh: 16:00)'),
  breakMinutes: z.coerce.number().min(0).max(240).default(60),
  colorBadge: z.string().default('emerald'),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ShiftTemplateItem = z.infer<typeof ShiftTemplateItemSchema>;

export const CreateShiftTemplateInputSchema = z.object({
  name: z.string().min(2, 'Nama template shift minimal 2 karakter'),
  code: z.string().min(2, 'Kode shift minimal 2 karakter'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm (contoh: 08:00)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm (contoh: 16:00)'),
  breakMinutes: z.coerce.number().min(0).max(240).default(60),
  colorBadge: z.string().default('emerald'),
  isActive: z.boolean().default(true),
});

export type CreateShiftTemplateInput = z.infer<typeof CreateShiftTemplateInputSchema>;

export const UpdateShiftTemplateInputSchema = CreateShiftTemplateInputSchema.partial();
export type UpdateShiftTemplateInput = z.infer<typeof UpdateShiftTemplateInputSchema>;

export const SeedDefaultShiftTemplatesInputSchema = z.object({
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm (contoh: 08:00)').optional(),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm (contoh: 22:00)').optional(),
});

export type SeedDefaultShiftTemplatesInput = z.infer<typeof SeedDefaultShiftTemplatesInputSchema>;
