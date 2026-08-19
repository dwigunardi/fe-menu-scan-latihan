import { customFetch } from './custom-fetch';
import { Either } from './either';
import { ApiError } from './api-error';
import { CategoryData, MenuFormInput } from '../validations/admin-menu.schema';

export interface AdminMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promoPrice: number | null;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isBestSeller: boolean;
  isRecommended: boolean;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  variantGroups: Array<{
    id: string;
    name: string;
    isRequired: boolean;
    minSelect: number;
    maxSelect: number;
    options: Array<{
      id: string;
      name: string;
      extraPrice: number;
      isAvailable: boolean;
    }>;
  }>;
}

/**
 * Fetches all categories.
 */
export async function getAdminCategories(): Promise<Either<ApiError, CategoryData[]>> {
  return customFetch<CategoryData[]>('/public/categories');
}

/**
 * Creates a new category.
 */
export async function createAdminCategory(payload: {
  name: string;
  sortOrder?: number;
}): Promise<Either<ApiError, CategoryData>> {
  return customFetch<CategoryData>('/admin/categories', {
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
  return customFetch<CategoryData>(`/admin/categories/${id}`, {
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
 * Fetches all menu items with optional category filtering.
 */
export async function getAdminMenus(categoryId?: string): Promise<Either<ApiError, AdminMenuItem[]>> {
  const query = categoryId ? `?categoryId=${categoryId}` : '';
  return customFetch<AdminMenuItem[]>(`/public/menus${query}`);
}

/**
 * Creates a new menu item with variant groups and options.
 */
export async function createAdminMenu(payload: MenuFormInput): Promise<Either<ApiError, AdminMenuItem>> {
  return customFetch<AdminMenuItem>('/admin/menus', {
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
  return customFetch<AdminMenuItem>(`/admin/menus/${id}`, {
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
  return customFetch<AdminMenuItem>(`/admin/menus/${id}/status`, {
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
