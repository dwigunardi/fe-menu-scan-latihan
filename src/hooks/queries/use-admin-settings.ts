import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAdminBranchSetting,
  updateAdminBranchSetting,
  updateStoreStatus,
  fetchPublicBranchLocation,
} from '@/lib/api/admin-settings-api';
import {
  BranchSetting,
  UpdateBranchSettingInput,
  UpdateStoreStatusInput,
} from '@/lib/validations/branch-settings.schema';
import { notifyApiError } from '@/lib/api/notify-error';

export const ADMIN_SETTINGS_QUERY_KEYS = {
  all: ['admin-settings'] as const,
  branch: () => [...ADMIN_SETTINGS_QUERY_KEYS.all, 'branch'] as const,
  publicLocation: () => ['public-branch-location'] as const,
};

/**
 * Hook to query admin branch & geofence settings.
 */
export function useAdminBranchSettingQuery() {
  return useQuery({
    queryKey: ADMIN_SETTINGS_QUERY_KEYS.branch(),
    queryFn: async () => {
      const res = await fetchAdminBranchSetting();
      if (res.isLeft()) {
        throw res.value;
      }
      return res.value;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to update branch location, geofence, and schedules.
 */
export function useUpdateBranchSettingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateBranchSettingInput) => {
      const res = await updateAdminBranchSetting(payload);
      if (res.isLeft()) {
        throw res.value;
      }
      return res.value;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(ADMIN_SETTINGS_QUERY_KEYS.branch(), data);
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEYS.publicLocation() });
      toast.success('Pengaturan cabang & geofence berhasil disimpan!');
    },
    onError: (error) => {
      notifyApiError(error, { fallbackMessage: 'Gagal menyimpan pengaturan cabang.' });
    },
  });
}

/**
 * Hook to quick toggle store status.
 */
export function useUpdateStoreStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateStoreStatusInput) => {
      const res = await updateStoreStatus(payload);
      if (res.isLeft()) {
        throw res.value;
      }
      return res.value;
    },
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEYS.branch() });
      const previousSetting = queryClient.getQueryData<BranchSetting>(
        ADMIN_SETTINGS_QUERY_KEYS.branch()
      );

      if (previousSetting) {
        queryClient.setQueryData<BranchSetting>(ADMIN_SETTINGS_QUERY_KEYS.branch(), {
          ...previousSetting,
          isStoreOpen: newStatus.isStoreOpen,
          storeMode: newStatus.storeMode ?? previousSetting.storeMode,
          emergencyReason: newStatus.emergencyReason ?? previousSetting.emergencyReason,
        });
      }

      return { previousSetting };
    },
    onError: (error, _, context) => {
      if (context?.previousSetting) {
        queryClient.setQueryData(ADMIN_SETTINGS_QUERY_KEYS.branch(), context.previousSetting);
      }
      notifyApiError(error, { fallbackMessage: 'Gagal mengubah status toko.' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEYS.branch() });
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEYS.publicLocation() });
    },
    onSuccess: (data) => {
      toast.success(
        data.isStoreOpen
          ? 'Toko sekarang berstatus BUKA (Menerima Pesanan)'
          : 'Toko sekarang berstatus TUTUP SEMENTARA'
      );
    },
  });
}

/**
 * Hook for public branch location & radius.
 */
export function usePublicBranchLocationQuery() {
  return useQuery({
    queryKey: ADMIN_SETTINGS_QUERY_KEYS.publicLocation(),
    queryFn: async () => {
      const res = await fetchPublicBranchLocation();
      if (res.isLeft()) {
        throw res.value;
      }
      return res.value;
    },
    staleTime: 10 * 60 * 1000,
  });
}
