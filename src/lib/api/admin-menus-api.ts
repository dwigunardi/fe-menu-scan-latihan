import { z } from 'zod';
import { apiTransport } from './api-transport';
import { Either, right } from './either';
import { ApiError } from './api-error';
import {
  CategoryData,
  CategorySchema,
  CategoryListSchema,
  AdminMenuItemSchema,
  AdminMenuItemType,
  MenuListSchema,
  ToggleStatusResponseSchema,
  MenuFormInput,
} from '../validations/admin-menu.schema';
import { createPaginatedResponseSchema } from '../validations/pagination.schema';
import { DeleteResponseSchema } from '../validations/common.schema';
import {
  UploadImageResponseSchema,
  UploadImageResponse,
} from '../validations/media.schema';
import { PaginatedResult } from '@/types/pagination';

export type AdminMenuItem = AdminMenuItemType;
export type { CategoryData, UploadImageResponse };

export interface QueryMenuParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  isAvailable?: boolean;
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt' | 'isAvailable';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fetches all categories (unbounded via limit: -1).
 */
export async function getAdminCategories(): Promise<Either<ApiError, CategoryData[]>> {
  const res = await apiTransport('/public/categories?limit=-1', CategoryListSchema);
  if (res.isLeft()) return res as Either<ApiError, CategoryData[]>;
  const data = res.value;
  const items = Array.isArray(data) ? data : (data?.items || []);
  return right(items);
}

/**
 * Creates a new category.
 */
export async function createAdminCategory(payload: {
  name: string;
  sortOrder?: number;
}): Promise<Either<ApiError, CategoryData>> {
  return apiTransport('/admin/categories', CategorySchema, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Updates an existing category.
 */
export async function updateAdminCategory(
  id: string,
  payload: {
    name?: string;
    sortOrder?: number;
  }
): Promise<Either<ApiError, CategoryData>> {
  return apiTransport(`/admin/categories/${id}`, CategorySchema, {
    method: 'PUT',
    body: payload,
  });
}

/**
 * Deletes a category.
 */
export async function deleteAdminCategory(id: string): Promise<Either<ApiError, { success: boolean }>> {
  return apiTransport(`/admin/categories/${id}`, DeleteResponseSchema, {
    method: 'DELETE',
  });
}

/**
 * Fetches public menu list (unpaginated via limit: -1).
 */
export async function getAdminMenus(categoryId?: string): Promise<Either<ApiError, AdminMenuItem[]>> {
  const catQuery = categoryId && categoryId !== 'ALL' ? `&categoryId=${categoryId}` : '';
  const res = await apiTransport(`/public/menus?limit=-1${catQuery}`, MenuListSchema);
  if (res.isLeft()) return res as Either<ApiError, AdminMenuItem[]>;
  const data = res.value;
  const items = Array.isArray(data) ? data : (data?.items || []);
  return right(items);
}

/**
 * Fetches paginated admin menu catalog with search and sorting.
 * Runtime contract enforced by Zod createPaginatedResponseSchema.
 */
export async function getAdminMenusPaginated(
  params: QueryMenuParams = {}
): Promise<Either<ApiError, PaginatedResult<AdminMenuItem>>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.categoryId && params.categoryId !== 'ALL') query.set('categoryId', params.categoryId);
  if (params.search) query.set('search', params.search);
  if (params.isAvailable !== undefined) query.set('isAvailable', String(params.isAvailable));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const qs = query.toString();
  return apiTransport(
    `/admin/menus${qs ? `?${qs}` : ''}`,
    createPaginatedResponseSchema(AdminMenuItemSchema)
  );
}

/**
 * Fetches single menu detail for preview or edit.
 */
export async function getAdminMenuDetail(id: string): Promise<Either<ApiError, AdminMenuItem>> {
  return apiTransport(`/public/menus/${id}`, AdminMenuItemSchema);
}

/**
 * Creates a new menu item.
 */
export async function createAdminMenu(
  payload: MenuFormInput
): Promise<Either<ApiError, AdminMenuItem>> {
  return apiTransport('/admin/menus', AdminMenuItemSchema, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Updates an existing menu item.
 */
export async function updateAdminMenu(
  id: string,
  payload: Partial<MenuFormInput>
): Promise<Either<ApiError, AdminMenuItem>> {
  return apiTransport(`/admin/menus/${id}`, AdminMenuItemSchema, {
    method: 'PUT',
    body: payload,
  });
}

/**
 * Toggles availability (stok) of a menu item with instant update.
 */
export async function toggleMenuAvailability(
  id: string,
  isAvailable: boolean
): Promise<Either<ApiError, AdminMenuItem>> {
  return apiTransport(`/admin/menus/${id}/status`, ToggleStatusResponseSchema as z.ZodType<AdminMenuItem>, {
    method: 'PUT',
    body: { isAvailable },
  });
}

/**
 * Deletes a menu item.
 */
export async function deleteAdminMenu(id: string): Promise<Either<ApiError, { success: boolean }>> {
  return apiTransport(`/admin/menus/${id}`, DeleteResponseSchema, {
    method: 'DELETE',
  });
}

/**
 * Formats image URL to handle both absolute URLs and backend static assets (/uploads/...).
 */
export function formatImageUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  // Frontend public static assets in /public folder
  if (
    url.startsWith('/banners/') ||
    url.startsWith('/illustrations/') ||
    url.startsWith('/icons/') ||
    url.startsWith('/images/') ||
    url.startsWith('/favicon')
  ) {
    return url;
  }
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';
  const cleanBase = apiBase.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  return `${cleanBase}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * Uploads and sanitizes a menu image file, converting automatically to WebP.
 */
export async function uploadAdminMenuImage(
  file: File
): Promise<Either<ApiError, UploadImageResponse>> {
  const formData = new FormData();
  formData.append('file', file);

  return apiTransport('/admin/uploads/image', UploadImageResponseSchema, {
    method: 'POST',
    body: formData,
    skipEncryption: true,
  });
}
