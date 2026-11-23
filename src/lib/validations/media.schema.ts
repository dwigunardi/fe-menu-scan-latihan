import { z } from 'zod';

export const UploadMediaResultSchema = z.object({
  url: z.string(),
  filename: z.string(),
  size: z.number(),
  mimeType: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type UploadMediaResult = z.infer<typeof UploadMediaResultSchema>;
export const UploadImageResponseSchema = UploadMediaResultSchema;
export type UploadImageResponse = UploadMediaResult;
