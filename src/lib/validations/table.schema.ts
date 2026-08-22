import { z } from 'zod';

export const TableStatusSchema = z.enum([
  'VACANT',
  'OCCUPIED',
  'WAITING_PAYMENT',
  'WAITING_CLEANUP',
]);

export type TableStatus = z.infer<typeof TableStatusSchema>;

export const SeatingTypeSchema = z.enum([
  'DINING',
  'SOFA',
  'BAR',
  'BOOTH',
  'FAMILY',
]);

export type SeatingType = z.infer<typeof SeatingTypeSchema>;

export const TableZoneSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama zona wajib diisi'),
  description: z.string().optional().nullable(),
  color: z.string().default('amber').optional().nullable(),
  sortOrder: z.number().int().default(0).optional(),
  tableCount: z.number().optional(),
  vacantCount: z.number().optional(),
  occupiedCount: z.number().optional(),
  totalCapacity: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type TableZoneData = z.infer<typeof TableZoneSchema>;

export const TableZoneFormSchema = z.object({
  name: z.string().min(1, 'Nama zona wajib diisi'),
  description: z.string().optional(),
  color: z.string().default('amber'),
  sortOrder: z.coerce.number().int().default(0),
});

export type TableZoneFormInput = z.infer<typeof TableZoneFormSchema>;

export const TableSchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        ...val,
        tableNumber: val.tableNumber || val.number || '01',
        seatingType: val.seatingType || 'DINING',
        tags: Array.isArray(val.tags) ? val.tags : [],
      };
    }
    return val;
  },
  z.object({
    id: z.string(),
    tableNumber: z.string().min(1, 'Nomor meja wajib diisi'),
    capacity: z.coerce.number().int().min(1, 'Kapasitas minimal 1 orang').default(4),
    status: TableStatusSchema.default('VACANT'),
    zoneId: z.string().optional().nullable(),
    zone: TableZoneSchema.optional().nullable(),
    seatingType: SeatingTypeSchema.default('DINING'),
    tags: z.array(z.string()).default([]),
    activeGuestName: z.string().optional().nullable(),
    currentSessionId: z.string().optional().nullable(),
    qrCodeUrl: z.string().optional().nullable(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
);

export const TableFormSchema = z.object({
  tableNumber: z.string().min(1, 'Nomor meja wajib diisi'),
  capacity: z.coerce.number().int().min(1, 'Kapasitas minimal 1 orang').default(4),
  zoneId: z.string().optional().nullable(),
  seatingType: SeatingTypeSchema.default('DINING'),
  tags: z.array(z.string()).default([]),
});

export type TableData = z.infer<typeof TableSchema>;
export type TableFormInput = z.infer<typeof TableFormSchema>;
