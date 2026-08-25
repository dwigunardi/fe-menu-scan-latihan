import { z } from 'zod';

export const ShiftStatusEnum = z.enum(['OPEN', 'CLOSED']);
export type ShiftStatus = z.infer<typeof ShiftStatusEnum>;

export const ShiftItemSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().default('default-branch'),
  staffId: z.string(),
  staffName: z.string(),
  openingCash: z.number().min(0),
  expectedCash: z.number().min(0).default(0),
  actualCash: z.number().nullable().optional(),
  cashVariance: z.number().nullable().optional(),
  totalCashOrders: z.number().int().min(0).default(0),
  totalQrisOrders: z.number().int().min(0).default(0),
  totalCashRevenue: z.number().min(0).default(0),
  totalQrisRevenue: z.number().min(0).default(0),
  totalRevenue: z.number().min(0).default(0),
  status: ShiftStatusEnum.default('OPEN'),
  notes: z.string().nullable().optional(),
  openedAt: z.string(),
  closedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ShiftItem = z.infer<typeof ShiftItemSchema>;

export const OpenShiftInputSchema = z.object({
  openingCash: z.number().min(0, 'Kas modal awal minimal Rp 0'),
  notes: z.string().optional(),
});

export type OpenShiftInput = z.infer<typeof OpenShiftInputSchema>;

export const CloseShiftInputSchema = z.object({
  actualCash: z.number().min(0, 'Kas fisik minimal Rp 0'),
  notes: z.string().optional(),
});

export type CloseShiftInput = z.infer<typeof CloseShiftInputSchema>;


export const ShiftHistoryQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: ShiftStatusEnum.optional(),
});

export type ShiftHistoryQueryParams = z.infer<typeof ShiftHistoryQuerySchema>;

export const ShiftHistoryResponseSchema = z.object({
  items: z.array(ShiftItemSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export type ShiftHistoryResponse = z.infer<typeof ShiftHistoryResponseSchema>;
