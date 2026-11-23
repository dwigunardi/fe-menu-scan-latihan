import { z } from 'zod';

export const PaginationMetaSchema = z.object({
  page: z.coerce.number().int(),
  limit: z.coerce.number().int(),
  totalItems: z.coerce.number().int(),
  totalPages: z.coerce.number().int(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

export type PaginationMetaType = z.infer<typeof PaginationMetaSchema>;

/**
 * Creates a reusable Paginated Result Zod Schema for any item type.
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
}
