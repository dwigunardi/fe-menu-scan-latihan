import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminBanners,
  getPublicBanners,
  getAdminBannerById,
  createAdminBanner,
  updateAdminBanner,
  toggleAdminBannerStatus,
  deleteAdminBanner,
  QueryBannerParams,
} from '@/lib/api/admin-banners-api';
import { BannerFormInput, BannerData } from '@/lib/validations/banner.schema';
import { adminQueryKeys } from '@/lib/query-keys';
import { notifyApiError } from '@/lib/api/notify-error';
import { toast } from 'sonner';

export function useAdminBannersQuery(params?: QueryBannerParams) {
  return useQuery({
    queryKey: adminQueryKeys.banners(params as Record<string, unknown>),
    queryFn: async () => {
      const result = await getAdminBanners(params);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });
}

export function usePublicBannersQuery() {
  return useQuery({
    queryKey: adminQueryKeys.publicBanners(),
    queryFn: async () => {
      const result = await getPublicBanners();
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useAdminBannerDetailQuery(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.bannerDetail(id),
    queryFn: async () => {
      const result = await getAdminBannerById(id);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    enabled: Boolean(id),
  });
}

export function useCreateBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BannerFormInput) => {
      const result = await createAdminBanner(payload);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (newBanner) => {
      toast.success(`Banner "${newBanner.title}" berhasil diterbitkan!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useUpdateBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<BannerFormInput>;
    }) => {
      const result = await updateAdminBanner(id, payload);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onSuccess: (updated) => {
      toast.success(`Banner "${updated.title}" berhasil diperbarui!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useToggleBannerStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const result = await toggleAdminBannerStatus(id, isActive);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return result.value;
    },
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.all });
      const previousBanners = queryClient.getQueryData<BannerData[]>(adminQueryKeys.banners());

      if (previousBanners) {
        queryClient.setQueryData<BannerData[]>(
          adminQueryKeys.banners(),
          previousBanners.map((b) => (b.id === id ? { ...b, isActive } : b))
        );
      }

      return { previousBanners };
    },
    onError: (err, variables, context) => {
      if (context?.previousBanners) {
        queryClient.setQueryData(adminQueryKeys.banners(), context.previousBanners);
      }
    },
    onSuccess: (updated) => {
      toast.success(
        `Banner "${updated.title}" sekarang ${updated.isActive ? 'AKTIF (Tayang)' : 'NONAKTIF'}`
      );
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useDeleteBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title?: string }) => {
      const result = await deleteAdminBanner(id);
      if (result.isLeft()) {
        notifyApiError(result.value);
        throw result.value;
      }
      return { id, title };
    },
    onSuccess: (data) => {
      toast.success(`Banner ${data.title ? `"${data.title}"` : ''} berhasil dihapus.`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}
