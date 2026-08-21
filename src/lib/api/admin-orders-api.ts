import { hardenedFetch } from './hardened-fetch';
import { Either } from './either';
import { ApiError } from './api-error';
import {
  OrderData,
  OrderSchema,
  OrderStatus,
} from '../validations/order.schema';
import { createPaginatedResponseSchema } from '../validations/pagination.schema';
import { PaginatedResult } from '@/types/pagination';

export interface QueryOrderParams {
  page?: number;
  limit?: number;
  status?: OrderStatus | string;
  tableId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

const PaginatedOrderSchema = createPaginatedResponseSchema(OrderSchema);

/**
 * Fetches paginated admin orders with filters for Live KDS & order history.
 * Enforces runtime contract validation via Zod PaginatedOrderSchema.
 */
export async function getAdminOrders(
  params: QueryOrderParams = {}
): Promise<Either<ApiError, PaginatedResult<OrderData>>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.tableId) query.set('tableId', params.tableId);
  if (params.search) query.set('search', params.search);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const qs = query.toString();
  return hardenedFetch(
    `/admin/orders${qs ? `?${qs}` : ''}`,
    PaginatedOrderSchema
  );
}

/**
 * Updates order status (PENDING -> PREPARING -> SERVED -> PAID / CANCELLED).
 */
export async function updateAdminOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Either<ApiError, OrderData>> {
  return hardenedFetch(`/admin/orders/${id}/status`, OrderSchema, {
    method: 'PATCH',
    body: { status },
  });
}
