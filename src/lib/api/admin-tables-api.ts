import { z } from 'zod';
import { hardenedFetch } from './hardened-fetch';
import { customFetch } from './custom-fetch';
import { Either, right } from './either';
import { ApiError } from './api-error';
import {
  TableData,
  TableSchema,
  TableFormInput,
  TableStatus,
} from '../validations/table.schema';
import { createPaginatedResponseSchema } from '../validations/pagination.schema';
import { PaginatedResult } from '@/types/pagination';

export interface QueryTableParams {
  page?: number;
  limit?: number;
  status?: TableStatus | string;
  search?: string;
  sortBy?: 'number' | 'status' | 'createdAt' | 'tableNumber' | 'capacity';
  sortOrder?: 'asc' | 'desc';
}

const TableListSchema = z.union([
  createPaginatedResponseSchema(TableSchema),
  z.array(TableSchema),
]);

/**
 * Fetches all tables (unbounded via limit: -1).
 */
export async function getAdminTables(status?: string): Promise<Either<ApiError, TableData[]>> {
  const statusQuery = status && status !== 'ALL' ? `&status=${status}` : '';
  const res = await hardenedFetch(`/admin/tables?limit=-1${statusQuery}`, TableListSchema);
  if (res.isLeft()) return res as Either<ApiError, TableData[]>;
  const data = res.value;
  const items = Array.isArray(data) ? data : (data?.items || []);
  return right(items);
}

/**
 * Fetches paginated admin table list with search and status filters.
 * Runtime contract enforced by Zod createPaginatedResponseSchema(TableSchema).
 */
export async function getAdminTablesPaginated(
  params: QueryTableParams = {}
): Promise<Either<ApiError, PaginatedResult<TableData>>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.sortBy) {
    const backendSortBy = params.sortBy === 'tableNumber' ? 'number' : params.sortBy;
    query.set('sortBy', backendSortBy);
  }
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const qs = query.toString();
  return hardenedFetch(
    `/admin/tables${qs ? `?${qs}` : ''}`,
    createPaginatedResponseSchema(TableSchema)
  );
}

/**
 * Creates a new table.
 */
export async function createAdminTable(
  payload: TableFormInput
): Promise<Either<ApiError, TableData>> {
  return hardenedFetch('/admin/tables', TableSchema, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Updates an existing table.
 */
export async function updateAdminTable(
  id: string,
  payload: Partial<TableFormInput & { status: TableStatus }>
): Promise<Either<ApiError, TableData>> {
  return hardenedFetch(`/admin/tables/${id}`, TableSchema, {
    method: 'PATCH',
    body: payload,
  });
}

/**
 * Resets an active table session (sets status to VACANT and clears active guest).
 */
export async function resetAdminTable(id: string): Promise<Either<ApiError, TableData>> {
  return hardenedFetch(`/admin/tables/${id}/reset`, TableSchema, {
    method: 'POST',
  });
}

/**
 * Deletes a table.
 */
export async function deleteAdminTable(id: string): Promise<Either<ApiError, { success: boolean }>> {
  return customFetch<{ success: boolean }>(`/admin/tables/${id}`, {
    method: 'DELETE',
  });
}
