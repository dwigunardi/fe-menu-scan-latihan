import { z } from 'zod';
import { hardenedFetch } from './hardened-fetch';
import { customFetch } from './custom-fetch';
import { Either, right } from './either';
import { ApiError } from './api-error';
import {
  CategoryData,
  CategorySchema,
  AdminMenuItemSchema,
  AdminMenuItemType,
  MenuFormInput,
} from '../validations/admin-menu.schema';
import { createPaginatedResponseSchema } from '../validations/pagination.schema';
import { PaginatedResult } from '@/types/pagination';

export type AdminMenuItem = AdminMenuItemType;

export interface QueryMenuParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  isAvailable?: boolean;
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt' | 'isAvailable';
  sortOrder?: 'asc' | 'desc';
}

const CategoryListSchema = z.union([
  createPaginatedResponseSchema(CategorySchema),
  z.array(CategorySchema),
]);

const MenuListSchema = z.union([
  createPaginatedResponseSchema(AdminMenuItemSchema),
  z.array(AdminMenuItemSchema),
]);

/**
 * Fetches all categories (unbounded via limit: -1).
 */
export async function getAdminCategories(): Promise<Either<ApiError, CategoryData[]>> {
  const res = await hardenedFetch('/public/categories?limit=-1', CategoryListSchema);
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
  return hardenedFetch('/admin/categories', CategorySchema, {
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
  return hardenedFetch(`/admin/categories/${id}`, CategorySchema, {
    method: 'PATCH',
    body: payload,
  });
}

/**
 * Deletes a category.
 */
export async function deleteAdminCategory(id: string): Promise<Either<ApiError, { success: boolean }>> {
  return customFetch<{ success: boolean }>(`/admin/categories/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetches public menu list (unpaginated via limit: -1).
 */
export async function getAdminMenus(categoryId?: string): Promise<Either<ApiError, AdminMenuItem[]>> {
  const catQuery = categoryId && categoryId !== 'ALL' ? `&categoryId=${categoryId}` : '';
  const res = await hardenedFetch(`/public/menus?limit=-1${catQuery}`, MenuListSchema);
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
  return hardenedFetch(
    `/admin/menus${qs ? `?${qs}` : ''}`,
    createPaginatedResponseSchema(AdminMenuItemSchema)
  );
}

/**
 * Fetches single menu detail for preview or edit.
 */
export async function getAdminMenuDetail(id: string): Promise<Either<ApiError, AdminMenuItem>> {
  return hardenedFetch(`/public/menus/${id}`, AdminMenuItemSchema);
}

/**
 * Creates a new menu item.
 */
export async function createAdminMenu(
  payload: MenuFormInput
): Promise<Either<ApiError, AdminMenuItem>> {
  return hardenedFetch('/admin/menus', AdminMenuItemSchema, {
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
  return hardenedFetch(`/admin/menus/${id}`, AdminMenuItemSchema, {
    method: 'PATCH',
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
  return hardenedFetch(`/admin/menus/${id}/status`, AdminMenuItemSchema, {
    method: 'PATCH',
    body: { isAvailable },
  });
}

/**
 * Deletes a menu item.
 */
export async function deleteAdminMenu(id: string): Promise<Either<ApiError, { success: boolean }>> {
  return customFetch<{ success: boolean }>(`/admin/menus/${id}`, {
    method: 'DELETE',
  });
}
