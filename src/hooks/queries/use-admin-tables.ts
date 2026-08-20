import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminTables,
  getAdminTablesPaginated,
  createAdminTable,
  updateAdminTable,
  resetAdminTable,
  deleteAdminTable,
  QueryTableParams,
} from '@/lib/api/admin-tables-api';
import { TableFormInput, TableStatus, TableData } from '@/lib/validations/table.schema';
import { adminQueryKeys } from '@/lib/query-keys';
import { notifyApiError } from '@/lib/api/notify-error';
import { toast } from 'sonner';

export function useAdminTablesQuery(status?: string) {
  return useQuery({
    queryKey: adminQueryKeys.tables(status),
    queryFn: async () => {
      const result = await getAdminTables(status);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminTablesPaginatedQuery(params: QueryTableParams = {}) {
  return useQuery({
    queryKey: adminQueryKeys.tablesPaginated(params as Record<string, unknown>),
    queryFn: async () => {
      const result = await getAdminTablesPaginated(params);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TableFormInput) => {
      const result = await createAdminTable(payload);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (newTable) => {
      toast.success(`Meja "${newTable.tableNumber}" berhasil ditambahkan!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useUpdateTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<TableFormInput & { status: TableStatus }>;
    }) => {
      const result = await updateAdminTable(id, payload);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (updatedTable) => {
      toast.success(`Meja "${updatedTable.tableNumber}" berhasil diperbarui!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useResetTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tableNumber }: { id: string; tableNumber?: string }) => {
      const result = await resetAdminTable(id);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.all });

      const previousData = queryClient.getQueriesData({
        queryKey: ['admin', 'tables'],
      });

      queryClient.setQueriesData<any>(
        { queryKey: ['admin', 'tables'] },
        (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return old.map((t: TableData) =>
              t.id === id ? { ...t, status: 'VACANT', activeGuestName: null, currentSessionId: null } : t
            );
          }
          if (old.items && Array.isArray(old.items)) {
            return {
              ...old,
              items: old.items.map((t: TableData) =>
                t.id === id ? { ...t, status: 'VACANT', activeGuestName: null, currentSessionId: null } : t
              ),
            };
          }
          return old;
        }
      );

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, vars) => {
      if (!_error) {
        toast.success(
          `Sesi ${vars.tableNumber ? `Meja "${vars.tableNumber}"` : 'Meja'} berhasil di-reset menjadi Kosong!`
        );
      }
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useDeleteTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tableNumber }: { id: string; tableNumber?: string }) => {
      const result = await deleteAdminTable(id);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (_data, vars) => {
      toast.success(
        `Meja ${vars.tableNumber ? `"${vars.tableNumber}"` : ''} berhasil dihapus!`
      );
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}
