import { z } from 'zod';

/**
 * Runtime schema for Promo Banner contract from backend
 */
export const BannerSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Judul banner wajib diisi'),
  description: z.string().nullable().optional(),
  imageUrl: z.string().min(1, 'Gambar banner wajib diunggah'),
  targetUrl: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BannerData = z.infer<typeof BannerSchema>;

/**
 * Form input schema for creating / updating a promo banner
 */
export const BannerFormSchema = z.object({
  title: z
    .string()
    .min(3, 'Judul banner minimal 3 karakter')
    .max(100, 'Judul banner maksimal 100 karakter'),
  description: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional(),
  imageUrl: z
    .string()
    .min(1, 'Gambar banner wajib dipilih atau diunggah'),
  targetUrl: z
    .string()
    .max(255, 'Target URL maksimal 255 karakter')
    .optional(),
  sortOrder: z.number().int('Urutan harus berupa bilangan bulat').min(0, 'Urutan minimal 0'),
  isActive: z.boolean(),
});

export type BannerFormInput = z.infer<typeof BannerFormSchema>;
