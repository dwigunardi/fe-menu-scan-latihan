import { z } from 'zod';
import { hardenedFetch } from './hardened-fetch';
import { customFetch } from './custom-fetch';
import { Either, left, right } from './either';
import { ApiError } from './api-error';
import {
  BannerData,
  BannerSchema,
  BannerFormInput,
} from '../validations/banner.schema';

const BannerListSchema = z.union([
  z.array(BannerSchema),
  z.object({ items: z.array(BannerSchema) }).transform((v) => v.items),
]);

export interface QueryBannerParams {
  search?: string;
  isActive?: boolean;
}

/**
 * Fetches all promo banners for admin management
 */
export async function getAdminBanners(
  params?: QueryBannerParams
): Promise<Either<ApiError, BannerData[]>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));

  const qs = query.toString() ? `?${query.toString()}` : '';
  return hardenedFetch(`/admin/banners${qs}`, BannerListSchema, {
    method: 'GET',
  });
}

/**
 * Fetches active promo banners for public customers
 */
export async function getPublicBanners(): Promise<Either<ApiError, BannerData[]>> {
  return hardenedFetch('/public/banners', BannerListSchema, {
    method: 'GET',
    skipHandshakeToken: true,
  });
}

/**
 * Fetches a single banner by ID
 */
export async function getAdminBannerById(
  id: string
): Promise<Either<ApiError, BannerData>> {
  return hardenedFetch(`/admin/banners/${id}`, BannerSchema, {
    method: 'GET',
  });
}

/**
 * Creates a new promo banner
 */
export async function createAdminBanner(
  payload: BannerFormInput
): Promise<Either<ApiError, BannerData>> {
  return hardenedFetch('/admin/banners', BannerSchema, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Updates an existing promo banner
 */
export async function updateAdminBanner(
  id: string,
  payload: Partial<BannerFormInput>
): Promise<Either<ApiError, BannerData>> {
  return hardenedFetch(`/admin/banners/${id}`, BannerSchema, {
    method: 'PUT',
    body: payload,
  });
}

/**
 * Toggles a banner's active status
 */
export async function toggleAdminBannerStatus(
  id: string,
  isActive: boolean
): Promise<Either<ApiError, BannerData>> {
  return updateAdminBanner(id, { isActive });
}

/**
 * Deletes a promo banner
 */
export async function deleteAdminBanner(
  id: string
): Promise<Either<ApiError, { success: boolean; id: string }>> {
  const res = await customFetch<{ success?: boolean; message?: string }>(
    `/admin/banners/${id}`,
    {
      method: 'DELETE',
    }
  );

  if (res.isLeft()) {
    return left(res.value);
  }

  return right({ success: true, id });
}
