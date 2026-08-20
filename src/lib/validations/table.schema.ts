import { z } from 'zod';

export const TableStatusSchema = z.enum([
  'VACANT',
  'OCCUPIED',
  'WAITING_PAYMENT',
  'WAITING_CLEANUP',
]);

export type TableStatus = z.infer<typeof TableStatusSchema>;

export const TableSchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        ...val,
        tableNumber: val.tableNumber || val.number || '01',
      };
    }
    return val;
  },
  z.object({
    id: z.string(),
    tableNumber: z.string().min(1, 'Nomor meja wajib diisi'),
    capacity: z.coerce.number().int().min(1, 'Kapasitas minimal 1 orang').default(4),
    status: TableStatusSchema.default('VACANT'),
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
});

export type TableData = z.infer<typeof TableSchema>;
export type TableFormInput = z.infer<typeof TableFormSchema>;
