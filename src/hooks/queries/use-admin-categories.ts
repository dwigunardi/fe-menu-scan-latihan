import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '@/lib/api/admin-menus-api';
import { adminQueryKeys } from '@/lib/query-keys';
import { notifyApiError } from '@/lib/api/notify-error';
import { toast } from 'sonner';

export function useAdminCategoriesQuery() {
  return useQuery({
    queryKey: adminQueryKeys.categories(),
    queryFn: async () => {
      const result = await getAdminCategories();
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; sortOrder?: number }) => {
      const result = await createAdminCategory(payload);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (newCat) => {
      toast.success(`Kategori "${newCat.name}" berhasil ditambahkan!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories() });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; sortOrder?: number };
    }) => {
      const result = await updateAdminCategory(id, payload);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (updatedCat) => {
      toast.success(`Kategori "${updatedCat.name}" berhasil diperbarui!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories() });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
      const result = await deleteAdminCategory(id);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (_data, vars) => {
      toast.success(`Kategori "${vars.name || 'terpilih'}" berhasil dihapus!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories() });
    },
  });
}
