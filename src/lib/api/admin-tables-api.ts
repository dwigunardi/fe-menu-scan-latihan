import { z } from 'zod';
import { hardenedFetch } from './hardened-fetch';
import { Either, right } from './either';
import { ApiError } from './api-error';
import {
  TableData,
  TableSchema,
  TableFormInput,
  TableStatus,
  TableZoneData,
  TableZoneSchema,
  TableZoneFormInput,
} from '../validations/table.schema';
import { createPaginatedResponseSchema } from '../validations/pagination.schema';
import { PaginatedResult } from '@/types/pagination';

export interface QueryTableParams {
  page?: number;
  limit?: number;
  status?: TableStatus | string;
  zoneId?: string;
  seatingType?: string;
  search?: string;
  sortBy?: 'number' | 'status' | 'createdAt' | 'tableNumber' | 'capacity';
  sortOrder?: 'asc' | 'desc';
}

const TableListSchema = z.union([
  createPaginatedResponseSchema(TableSchema),
  z.array(TableSchema),
]);

const TableZoneListSchema = z.array(TableZoneSchema);

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
 */
export async function getAdminTablesPaginated(
  params: QueryTableParams = {}
): Promise<Either<ApiError, PaginatedResult<TableData>>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.zoneId && params.zoneId !== 'ALL') query.set('zoneId', params.zoneId);
  if (params.seatingType && params.seatingType !== 'ALL') query.set('seatingType', params.seatingType);
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
    body: {
      number: payload.tableNumber,
      ...payload,
    },
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
    method: 'PUT',
    body: {
      ...(payload.tableNumber ? { number: payload.tableNumber } : {}),
      ...payload,
    },
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
  return hardenedFetch(`/admin/tables/${id}`, z.object({ success: z.boolean() }), {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// TABLE ZONES APIs
// -------------------------------------------------------------
export async function getAdminTableZones(): Promise<Either<ApiError, TableZoneData[]>> {
  return hardenedFetch('/admin/table-zones', TableZoneListSchema);
}

export async function createAdminTableZone(
  payload: TableZoneFormInput
): Promise<Either<ApiError, TableZoneData>> {
  return hardenedFetch('/admin/table-zones', TableZoneSchema, {
    method: 'POST',
    body: payload,
  });
}

export async function updateAdminTableZone(
  id: string,
  payload: Partial<TableZoneFormInput>
): Promise<Either<ApiError, TableZoneData>> {
  return hardenedFetch(`/admin/table-zones/${id}`, TableZoneSchema, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteAdminTableZone(id: string): Promise<Either<ApiError, { success: boolean }>> {
  return hardenedFetch(`/admin/table-zones/${id}`, z.object({ success: z.boolean() }), {
    method: 'DELETE',
  });
}
