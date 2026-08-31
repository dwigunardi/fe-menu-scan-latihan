import { z } from 'zod';
import { createPaginatedResponseSchema } from './pagination.schema';

export const NumericCoerce = z.coerce.number();

export const NullableNumericCoerce = z.preprocess(
  (val) => (val === null || val === undefined || val === '' ? null : Number(val)),
  z.number().nullable().optional()
);

export const VariantOptionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nama opsi wajib diisi'),
  extraPrice: z.coerce.number().min(0, 'Harga ekstra tidak boleh negatif').default(0),
  isAvailable: z.boolean().default(true),
});

export const VariantGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nama grup variasi wajib diisi'),
  isRequired: z.boolean().default(false),
  minSelect: z.coerce.number().min(0).default(0),
  maxSelect: z.coerce.number().min(1, 'Maksimal pilihan minimal 1').default(1),
  options: z.array(VariantOptionSchema).min(1, 'Minimal harus ada 1 opsi variasi'),
}).refine((data) => data.maxSelect >= data.minSelect, {
  message: 'Batas maksimal pilihan (maxSelect) harus lebih besar atau sama dengan minimal pilihan (minSelect)',
  path: ['maxSelect'],
});

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  slug: z.string().optional(),
  sortOrder: z.coerce.number().optional().default(0),
  _count: z
    .object({
      menuItems: z.coerce.number().optional().default(0),
    })
    .optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CategoryListSchema = z.union([
  createPaginatedResponseSchema(CategorySchema),
  z.array(CategorySchema),
]);

export const AdminMenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  price: z.coerce.number(),
  promoPrice: NullableNumericCoerce,
  imageUrl: z.string().optional().nullable(),
  isAvailable: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  categoryId: z.string(),
  category: CategorySchema.optional(),
  rating: z.coerce.number().optional().default(5.0),
  reviewCount: z.coerce.number().optional().default(0),
  variantGroups: z.array(VariantGroupSchema).optional().default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const MenuListSchema = z.union([
  createPaginatedResponseSchema(AdminMenuItemSchema),
  z.array(AdminMenuItemSchema),
]);

export const ToggleStatusResponseSchema = z.union([
  AdminMenuItemSchema,
  z.object({
    item: AdminMenuItemSchema,
  }).transform((val) => val.item),
]);

export const MenuFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Nama menu minimal 2 karakter'),
  description: z.string().optional().default(''),
  price: z.coerce.number().min(1000, 'Harga dasar minimal Rp 1.000'),
  promoPrice: NullableNumericCoerce,
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  imageUrl: z.string().optional().default(''),
  isAvailable: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  variantGroups: z.array(VariantGroupSchema).default([]),
});

export const CreateCategoryInputSchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter'),
});

export type VariantOptionInput = z.infer<typeof VariantOptionSchema>;
export type VariantGroupInput = z.infer<typeof VariantGroupSchema>;
export type MenuFormInput = z.infer<typeof MenuFormSchema>;
export type CategoryData = z.infer<typeof CategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;
export type AdminMenuItemType = z.infer<typeof AdminMenuItemSchema>;
