import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useAdminBranchSettingQuery,
  useUpdateBranchSettingMutation,
  useUpdateStoreStatusMutation,
  usePublicBranchLocationQuery,
  ADMIN_SETTINGS_QUERY_KEYS,
} from '@/hooks/queries/use-admin-settings';
import { createQueryWrapper } from '@/test/test-utils';
import * as settingsApi from '@/lib/api/admin-settings-api';
import { right, left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';
import { STORE_MODE } from '@/lib/constants/branch-settings';
import { toast } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/lib/api/admin-settings-api', () => ({
  fetchAdminBranchSetting: vi.fn(),
  updateAdminBranchSetting: vi.fn(),
  updateStoreStatus: vi.fn(),
  fetchPublicBranchLocation: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createQueryWrapperWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
}

describe('use-admin-settings query hooks', () => {
  const mockSetting = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Kumpul Cafe - Cabang Pusat',
    address: 'Jl. Tebet Raya No. 45',
    latitude: -6.2297465,
    longitude: 106.8557342,
    geofenceRadius: 100,
    openTime: '08:00',
    closeTime: '22:00',
    lateGracePeriod: 15,
    isStoreOpen: true,
    storeMode: STORE_MODE.SHIFT_DRIVEN,
    timezone: 'Asia/Jakarta',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAdminBranchSettingQuery', () => {
    it('fetches branch settings successfully', async () => {
      vi.mocked(settingsApi.fetchAdminBranchSetting).mockResolvedValue(right(mockSetting));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminBranchSettingQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.name).toBe('Kumpul Cafe - Cabang Pusat');
      expect(result.current.data?.geofenceRadius).toBe(100);
    });

    it('throws error when fetch fails', async () => {
      vi.mocked(settingsApi.fetchAdminBranchSetting).mockResolvedValue(
        left(ApiError.networkError())
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminBranchSettingQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUpdateBranchSettingMutation', () => {
    it('updates branch setting and shows success toast', async () => {
      const updated = { ...mockSetting, name: 'Kumpul Cafe Tebet Baru' };
      vi.mocked(settingsApi.updateAdminBranchSetting).mockResolvedValue(right(updated));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateBranchSettingMutation(), { wrapper });

      await result.current.mutateAsync({
        name: 'Kumpul Cafe Tebet Baru',
        address: 'Jl. Tebet Raya No. 45',
        latitude: -6.2297465,
        longitude: 106.8557342,
        geofenceRadius: 100,
        openTime: '08:00',
        closeTime: '22:00',
        lateGracePeriod: 15,
        storeMode: STORE_MODE.SHIFT_DRIVEN,
        timezone: 'Asia/Jakarta',
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil disimpan')
      );
    });

    it('throws error and triggers onError callback when update fails', async () => {
      vi.mocked(settingsApi.updateAdminBranchSetting).mockResolvedValue(
        left(new ApiError(400, 'UPDATE_FAILED', 'Gagal update'))
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateBranchSettingMutation(), { wrapper });

      await expect(
        result.current.mutateAsync({
          name: 'Test',
          address: 'Test',
          latitude: 0,
          longitude: 0,
          geofenceRadius: 50,
          openTime: '08:00',
          closeTime: '22:00',
          lateGracePeriod: 10,
          storeMode: STORE_MODE.SHIFT_DRIVEN,
          timezone: 'Asia/Jakarta',
        })
      ).rejects.toBeDefined();
    });
  });

  describe('useUpdateStoreStatusMutation', () => {
    it('updates store status to open and shows success toast', async () => {
      vi.mocked(settingsApi.updateStoreStatus).mockResolvedValue(
        right({ ...mockSetting, isStoreOpen: true, storeMode: STORE_MODE.SHIFT_DRIVEN })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateStoreStatusMutation(), { wrapper });

      await result.current.mutateAsync({
        isStoreOpen: true,
        storeMode: STORE_MODE.SHIFT_DRIVEN,
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('BUKA')
      );
    });

    it('updates store status to closed with emergency reason', async () => {
      vi.mocked(settingsApi.updateStoreStatus).mockResolvedValue(
        right({ ...mockSetting, isStoreOpen: false, storeMode: STORE_MODE.EMERGENCY_CLOSED })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateStoreStatusMutation(), { wrapper });

      await result.current.mutateAsync({
        isStoreOpen: false,
        storeMode: STORE_MODE.EMERGENCY_CLOSED,
        emergencyReason: 'Perbaikan Listrik',
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('TUTUP SEMENTARA')
      );
    });

    it('optimistically updates and rolls back on error', async () => {
      vi.mocked(settingsApi.updateStoreStatus).mockResolvedValue(
        left(new ApiError(500, 'STORE_UPDATE_FAILED', 'Gagal update status'))
      );

      const { queryClient, wrapper } = createQueryWrapperWithClient();
      queryClient.setQueryData(ADMIN_SETTINGS_QUERY_KEYS.branch(), mockSetting);

      const { result } = renderHook(() => useUpdateStoreStatusMutation(), { wrapper });

      await expect(
        result.current.mutateAsync({
          isStoreOpen: false,
        })
      ).rejects.toBeDefined();

      const setting = queryClient.getQueryData<any>(ADMIN_SETTINGS_QUERY_KEYS.branch());
      expect(setting.isStoreOpen).toBe(true);
    });
  });

  describe('usePublicBranchLocationQuery', () => {
    it('fetches public branch location', async () => {
      vi.mocked(settingsApi.fetchPublicBranchLocation).mockResolvedValue(
        right({
          name: 'Kumpul Cafe',
          address: 'Jl. Tebet',
          latitude: -6.2297465,
          longitude: 106.8557342,
          geofenceRadius: 100,
          isStoreOpen: true,
          storeMode: STORE_MODE.SHIFT_DRIVEN,
          openTime: '08:00',
          closeTime: '22:00',
          timezone: 'Asia/Jakarta',
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => usePublicBranchLocationQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.latitude).toBeCloseTo(-6.2297465);
    });

    it('handles error Left branch on public location query', async () => {
      vi.mocked(settingsApi.fetchPublicBranchLocation).mockResolvedValue(
        left(ApiError.networkError())
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => usePublicBranchLocationQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
