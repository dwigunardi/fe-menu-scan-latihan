import { z } from 'zod';

export const VariantOptionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nama opsi wajib diisi'),
  extraPrice: z.number().min(0, 'Harga ekstra tidak boleh negatif').default(0),
  isAvailable: z.boolean().default(true),
});

export const VariantGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nama grup variasi wajib diisi'),
  isRequired: z.boolean().default(false),
  minSelect: z.number().min(0).default(0),
  maxSelect: z.number().min(1, 'Maksimal pilihan minimal 1').default(1),
  options: z.array(VariantOptionSchema).min(1, 'Minimal harus ada 1 opsi variasi'),
}).refine((data) => data.maxSelect >= data.minSelect, {
  message: 'Batas maksimal pilihan (maxSelect) harus lebih besar atau sama dengan minimal pilihan (minSelect)',
  path: ['maxSelect'],
});

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  slug: z.string().optional(),
  sortOrder: z.number().optional().default(0),
  _count: z
    .object({
      menuItems: z.number().optional().default(0),
    })
    .optional(),
  createdAt: z.string().optional(),
});

export const MenuFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Nama menu minimal 2 karakter'),
  description: z.string().optional().default(''),
  price: z.number().min(1000, 'Harga dasar minimal Rp 1.000'),
  promoPrice: z.number().nullable().optional(),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  imageUrl: z.string().optional().default(''),
  isAvailable: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  variantGroups: z.array(VariantGroupSchema).default([]),
});

export type VariantOptionInput = z.infer<typeof VariantOptionSchema>;
export type VariantGroupInput = z.infer<typeof VariantGroupSchema>;
export type MenuFormInput = z.infer<typeof MenuFormSchema>;
export type CategoryData = z.infer<typeof CategorySchema>;
