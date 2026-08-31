import { z } from 'zod';

export const DeleteResponseSchema = z.object({
  success: z.boolean().default(true),
}).passthrough();

export type DeleteResponse = z.infer<typeof DeleteResponseSchema>;

export const ActionSuccessResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().optional(),
}).passthrough();

export type ActionSuccessResponse = z.infer<typeof ActionSuccessResponseSchema>;
