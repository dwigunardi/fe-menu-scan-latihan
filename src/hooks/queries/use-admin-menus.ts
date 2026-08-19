import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminMenus,
  createAdminMenu,
  updateAdminMenu,
  toggleMenuAvailability,
  deleteAdminMenu,
  AdminMenuItem,
} from '@/lib/api/admin-menus-api';
import { MenuFormInput } from '@/lib/validations/admin-menu.schema';
import { adminQueryKeys } from '@/lib/query-keys';
import { notifyApiError } from '@/lib/api/notify-error';
import { toast } from 'sonner';

export function useAdminMenusQuery(categoryId?: string) {
  return useQuery({
    queryKey: adminQueryKeys.menus(categoryId),
    queryFn: async () => {
      const result = await getAdminMenus(categoryId);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateMenuMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: MenuFormInput) => {
      const result = await createAdminMenu(payload);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (newMenu) => {
      toast.success(`Menu "${newMenu.name}" berhasil dibuat!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useUpdateMenuMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<MenuFormInput>;
    }) => {
      const result = await updateAdminMenu(id, payload);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (updatedMenu) => {
      toast.success(`Menu "${updatedMenu.name}" berhasil diperbarui!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useToggleMenuAvailabilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isAvailable,
    }: {
      id: string;
      isAvailable: boolean;
      menuName?: string;
    }) => {
      const result = await toggleMenuAvailability(id, isAvailable);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onMutate: async ({ id, isAvailable }) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.all });

      const previousMenus = queryClient.getQueriesData<AdminMenuItem[]>({
        queryKey: ['admin', 'menus'],
      });

      queryClient.setQueriesData<AdminMenuItem[]>(
        { queryKey: ['admin', 'menus'] },
        (old) => {
          if (!old) return [];
          return old.map((m) =>
            m.id === id ? { ...m, isAvailable } : m
          );
        }
      );

      return { previousMenus };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMenus) {
        context.previousMenus.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, vars) => {
      if (!_error && vars.menuName) {
        toast.success(
          `Stok "${vars.menuName}" diubah menjadi: ${vars.isAvailable ? 'Tersedia' : 'Habis'}`
        );
      }
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useDeleteMenuMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteAdminMenu(id);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: () => {
      toast.success('Menu berhasil dihapus!');
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}
