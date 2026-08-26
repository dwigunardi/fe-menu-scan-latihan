import { executePipeline } from './pipeline/pipeline-runner';
import { Either, left, right } from './either';
import { ApiError } from './api-error';
import {
  BranchSetting,
  BranchSettingSchema,
  UpdateBranchSettingInput,
  UpdateStoreStatusInput,
  PublicBranchLocation,
  PublicBranchLocationSchema,
} from '../validations/branch-settings.schema';

/**
 * Fetch branch settings & geofence configuration for admin.
 */
export async function fetchAdminBranchSetting(): Promise<Either<ApiError, BranchSetting>> {
  const result = await executePipeline<BranchSetting>('/admin/settings/branch', {
    method: 'GET',
  });

  if (result.isLeft()) {
    return left(result.value);
  }

  const parsed = BranchSettingSchema.safeParse(result.value);
  if (!parsed.success) {
    return left(
      ApiError.contractViolation(
        '/admin/settings/branch',
        parsed.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    );
  }

  return right(parsed.data);
}

/**
 * Update branch settings (coordinates, geofence, schedules).
 */
export async function updateAdminBranchSetting(
  payload: UpdateBranchSettingInput
): Promise<Either<ApiError, BranchSetting>> {
  const result = await executePipeline<BranchSetting>('/admin/settings/branch', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (result.isLeft()) {
    return left(result.value);
  }

  const parsed = BranchSettingSchema.safeParse(result.value);
  if (!parsed.success) {
    return left(
      ApiError.contractViolation(
        '/admin/settings/branch',
        parsed.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    );
  }

  return right(parsed.data);
}

/**
 * Fast toggle store open/close/emergency status.
 */
export async function updateStoreStatus(
  payload: UpdateStoreStatusInput
): Promise<Either<ApiError, BranchSetting>> {
  const result = await executePipeline<BranchSetting>('/admin/settings/branch/store-status', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (result.isLeft()) {
    return left(result.value);
  }

  const parsed = BranchSettingSchema.safeParse(result.value);
  if (!parsed.success) {
    return left(
      ApiError.contractViolation(
        '/admin/settings/branch/store-status',
        parsed.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    );
  }

  return right(parsed.data);
}

/**
 * Public endpoint to fetch cafe location & geofence radius.
 */
export async function fetchPublicBranchLocation(): Promise<
  Either<ApiError, PublicBranchLocation>
> {
  const result = await executePipeline<PublicBranchLocation>('/public/branch/location', {
    method: 'GET',
    skipHandshakeToken: true,
  });

  if (result.isLeft()) {
    return left(result.value);
  }

  const parsed = PublicBranchLocationSchema.safeParse(result.value);
  if (!parsed.success) {
    return left(
      ApiError.contractViolation(
        '/public/branch/location',
        parsed.error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    );
  }

  return right(parsed.data);
}
