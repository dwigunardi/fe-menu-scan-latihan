import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import {
  getAdminOrders,
  updateAdminOrderStatus,
  QueryOrderParams,
} from '@/lib/api/admin-orders-api';
import { adminQueryKeys } from '@/lib/query-keys';
import { OrderData, OrderStatus } from '@/lib/validations/order.schema';
import { PaginatedResult } from '@/types/pagination';
import { notifyApiError } from '@/lib/api/notify-error';
import { toast } from 'sonner';

/**
 * Hook to fetch paginated admin orders with optional auto-polling.
 */
export function useAdminOrdersPaginatedQuery(
  params: QueryOrderParams = {},
  options?: Partial<UseQueryOptions<PaginatedResult<OrderData>>>
) {
  return useQuery({
    queryKey: adminQueryKeys.ordersPaginated(params as Record<string, unknown>),
    queryFn: async () => {
      const result = await getAdminOrders(params);
      if (result.isLeft()) {
        throw result.value;
      }
      return result.value;
    },
    refetchInterval: 10000, // 10s live auto-refresh for KDS
    ...options,
  });
}

/**
 * Hook to update order status with Optimistic UI updates.
 */
export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: OrderStatus;
    }) => {
      const result = await updateAdminOrderStatus(id, status);
      if (result.isLeft()) {
        throw result.value;
      }
      return result.value;
    },

    // Optimistic Update: move card immediately in cache
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.all });

      const queryKeyPrefix = ['admin', 'orders'];
      const previousQueries = queryClient.getQueriesData<PaginatedResult<OrderData>>({
        queryKey: queryKeyPrefix,
      });

      // Optimistically update all matching queries in cache
      queryClient.setQueriesData<PaginatedResult<OrderData>>(
        { queryKey: queryKeyPrefix },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((order) =>
              order.id === id ? { ...order, status } : order
            ),
          };
        }
      );

      return { previousQueries };
    },

    onError: (err, _variables, context) => {
      console.log(err, _variables, context);
      // Rollback on error
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      notifyApiError(err);
    },

    onSuccess: (updatedOrder) => {
      const statusLabels: Record<OrderStatus, string> = {
        PENDING: 'Pesanan Masuk',
        PREPARING: 'Sedang Dimasak',
        SERVED: 'Siap Disajikan',
        PAID: 'Pesanan Selesai / Lunas',
        CANCELLED: 'Pesanan Dibatalkan',
      };
      toast.success(
        `Pesanan ${updatedOrder.orderNumber} -> ${statusLabels[updatedOrder.status]}`
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tables'] });
    },
  });
}
