import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminTables,
  getAdminTablesPaginated,
  createAdminTable,
  updateAdminTable,
  resetAdminTable,
  deleteAdminTable,
  getAdminTableZones,
  createAdminTableZone,
  updateAdminTableZone,
  deleteAdminTableZone,
  QueryTableParams,
} from '@/lib/api/admin-tables-api';
import { TableFormInput, TableStatus, TableData, TableZoneFormInput } from '@/lib/validations/table.schema';
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
    onSuccess: (resetTable) => {
      toast.success(`Sesi Meja "${resetTable.tableNumber}" berhasil dikosongkan!`);
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
    onSuccess: (_, variables) => {
      toast.success(`Meja "${variables.tableNumber || ''}" berhasil dihapus!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

// -------------------------------------------------------------
// TABLE ZONES HOOKS
// -------------------------------------------------------------
export function useAdminTableZonesQuery() {
  return useQuery({
    queryKey: adminQueryKeys.tableZones(),
    queryFn: async () => {
      const result = await getAdminTableZones();
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateTableZoneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TableZoneFormInput) => {
      const result = await createAdminTableZone(payload);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (newZone) => {
      toast.success(`Zona "${newZone.name}" berhasil ditambahkan!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useUpdateTableZoneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<TableZoneFormInput> }) => {
      const result = await updateAdminTableZone(id, payload);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (updatedZone) => {
      toast.success(`Zona "${updatedZone.name}" berhasil diperbarui!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useDeleteTableZoneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
      const result = await deleteAdminTableZone(id);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (_, variables) => {
      toast.success(`Zona "${variables.name || ''}" berhasil dihapus!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}
