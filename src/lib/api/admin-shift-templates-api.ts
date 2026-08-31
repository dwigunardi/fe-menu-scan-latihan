import { apiTransport } from './api-transport';
import { Either } from './either';
import { ApiError } from './api-error';
import {
  ShiftTemplateItem,
  ShiftTemplateItemSchema,
  ShiftTemplatesListSchema,
  CreateShiftTemplateInput,
  UpdateShiftTemplateInput,
  SeedDefaultShiftTemplatesInput,
} from '../validations/shift-template.schema';

const BASE_URL = '/admin/settings/shift-templates';

/**
 * Fetch all master shift templates.
 */
export async function fetchShiftTemplates(): Promise<Either<ApiError, ShiftTemplateItem[]>> {
  return apiTransport(BASE_URL, ShiftTemplatesListSchema, {
    method: 'GET',
  });
}

/**
 * Create a new master shift template.
 */
export async function createShiftTemplate(
  payload: CreateShiftTemplateInput
): Promise<Either<ApiError, ShiftTemplateItem>> {
  return apiTransport(BASE_URL, ShiftTemplateItemSchema, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update an existing master shift template.
 */
export async function updateShiftTemplate(
  id: string,
  payload: UpdateShiftTemplateInput
): Promise<Either<ApiError, ShiftTemplateItem>> {
  return apiTransport(`${BASE_URL}/${id}`, ShiftTemplateItemSchema, {
    method: 'PUT',
    body: payload,
  });
}

/**
 * Delete a master shift template.
 */
export async function deleteShiftTemplate(id: string): Promise<Either<ApiError, ShiftTemplateItem>> {
  return apiTransport(`${BASE_URL}/${id}`, ShiftTemplateItemSchema, {
    method: 'DELETE',
  });
}

/**
 * Seed default shift templates aligned with store hours.
 */
export async function seedDefaultShiftTemplates(
  payload: SeedDefaultShiftTemplatesInput = {}
): Promise<Either<ApiError, ShiftTemplateItem[]>> {
  return apiTransport(`${BASE_URL}/seed-defaults`, ShiftTemplatesListSchema, {
    method: 'POST',
    body: payload,
  });
}
