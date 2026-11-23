import { apiTransport } from './api-transport';
import { Either } from './either';
import { ApiError } from './api-error';
import {
  BranchSetting,
  BranchSettingSchema,
  UpdateBranchSettingInput,
  UpdateStoreStatusInput,
  PublicBranchLocation,
  PublicBranchLocationSchema,
} from '../validations/branch-settings.schema';

const BASE_URL = '/admin/settings/branch';

/**
 * Fetch branch settings & geofence configuration for admin.
 */
export async function fetchAdminBranchSetting(): Promise<Either<ApiError, BranchSetting>> {
  return apiTransport(BASE_URL, BranchSettingSchema, {
    method: 'GET',
  });
}

/**
 * Update branch settings (coordinates, geofence, schedules).
 */
export async function updateAdminBranchSetting(
  payload: UpdateBranchSettingInput
): Promise<Either<ApiError, BranchSetting>> {
  return apiTransport(BASE_URL, BranchSettingSchema, {
    method: 'PUT',
    body: payload,
  });
}

/**
 * Fast toggle store open/close/emergency status.
 */
export async function updateStoreStatus(
  payload: UpdateStoreStatusInput
): Promise<Either<ApiError, BranchSetting>> {
  return apiTransport(`${BASE_URL}/store-status`, BranchSettingSchema, {
    method: 'PUT',
    body: payload,
  });
}

/**
 * Public endpoint to fetch cafe location & geofence radius.
 */
export async function fetchPublicBranchLocation(): Promise<
  Either<ApiError, PublicBranchLocation>
> {
  return apiTransport('/public/branch/location', PublicBranchLocationSchema, {
    method: 'GET',
    skipHandshakeToken: true,
  });
}
