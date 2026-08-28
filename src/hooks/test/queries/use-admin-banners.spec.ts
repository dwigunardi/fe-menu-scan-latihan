import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useAdminBannersQuery,
  usePublicBannersQuery,
  useAdminBannerDetailQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useToggleBannerStatusMutation,
  useDeleteBannerMutation,
} from '@/hooks/queries/use-admin-banners';
import * as bannersApi from '@/lib/api/admin-banners-api';
import { createQueryWrapper } from '@/test/test-utils';
import { useAuthStore } from '@/store/use-auth-store';
import { toast } from 'sonner';
import { left, right } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';
import { adminQueryKeys } from '@/lib/query-keys';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('use-admin-banners hooks', () => {
  const mockBanner = {
    id: 'ban-1',
    title: 'Diskon Kopi 50% Weekend',
    description: 'Promo akhir pekan',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
    targetUrl: '/menu',
    sortOrder: 1,
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '1', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );
  });

  describe('useAdminBannersQuery', () => {
    it('fetches admin banners successfully', async () => {
      vi.spyOn(bannersApi, 'getAdminBanners').mockResolvedValue(right([mockBanner]));
      const { result } = renderHook(() => useAdminBannersQuery(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([mockBanner]);
    });

    it('handles API error Left branch', async () => {
      vi.spyOn(bannersApi, 'getAdminBanners').mockResolvedValue(
        left(new ApiError(500, 'FETCH_FAILED', 'Gagal memuat banner'))
      );
      const { result } = renderHook(() => useAdminBannersQuery(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('usePublicBannersQuery', () => {
    it('fetches public active banners successfully', async () => {
      vi.spyOn(bannersApi, 'getPublicBanners').mockResolvedValue(right([mockBanner]));
      const { result } = renderHook(() => usePublicBannersQuery(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.every((b) => b.isActive)).toBe(true);
    });

    it('handles API error Left branch in public banners', async () => {
      vi.spyOn(bannersApi, 'getPublicBanners').mockResolvedValue(
        left(new ApiError(500, 'FETCH_FAILED', 'Gagal memuat'))
      );
      const { result } = renderHook(() => usePublicBannersQuery(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useAdminBannerDetailQuery', () => {
    it('fetches single banner detail by id', async () => {
      vi.spyOn(bannersApi, 'getAdminBannerById').mockResolvedValue(right(mockBanner));
      const { result } = renderHook(() => useAdminBannerDetailQuery('ban-1'), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.id).toBe('ban-1');
    });

    it('handles API error Left branch on detail', async () => {
      vi.spyOn(bannersApi, 'getAdminBannerById').mockResolvedValue(
        left(new ApiError(404, 'NOT_FOUND', 'Banner tidak ditemukan'))
      );
      const { result } = renderHook(() => useAdminBannerDetailQuery('ban-invalid'), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useCreateBannerMutation', () => {
    it('creates banner successfully and triggers success toast', async () => {
      vi.spyOn(bannersApi, 'createAdminBanner').mockResolvedValue(right(mockBanner));
      const { result } = renderHook(() => useCreateBannerMutation(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync({
        title: 'Diskon 100% Granat',
        imageUrl: 'https://images.unsplash.com/photo-1',
        targetUrl: '/menu',
        sortOrder: 1,
        isActive: true,
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining(mockBanner.title)
      );
    });

    it('throws error when create fails', async () => {
      vi.spyOn(bannersApi, 'createAdminBanner').mockResolvedValue(
        left(new ApiError(400, 'VALIDATION_FAILED', 'Data tidak valid'))
      );
      const { result } = renderHook(() => useCreateBannerMutation(), {
        wrapper: createQueryWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          title: 'Test',
          imageUrl: 'url',
          targetUrl: '/menu',
          sortOrder: 1,
          isActive: true,
        })
      ).rejects.toBeDefined();
    });
  });

  describe('useUpdateBannerMutation', () => {
    it('updates banner successfully and triggers success toast', async () => {
      vi.spyOn(bannersApi, 'updateAdminBanner').mockResolvedValue(right(mockBanner));
      const { result } = renderHook(() => useUpdateBannerMutation(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync({
        id: 'ban-1',
        payload: { title: 'Diskon Kopi 80%' },
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining(mockBanner.title)
      );
    });

    it('throws error when update fails', async () => {
      vi.spyOn(bannersApi, 'updateAdminBanner').mockResolvedValue(
        left(new ApiError(400, 'UPDATE_FAILED', 'Gagal update'))
      );
      const { result } = renderHook(() => useUpdateBannerMutation(), {
        wrapper: createQueryWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          id: 'ban-1',
          payload: { title: 'Failed' },
        })
      ).rejects.toBeDefined();
    });
  });

  describe('useToggleBannerStatusMutation', () => {
    it('toggles banner active status with optimistic update and triggers success toast', async () => {
      const toggledBanner = { ...mockBanner, isActive: false };
      vi.spyOn(bannersApi, 'toggleAdminBannerStatus').mockResolvedValue(right(toggledBanner));

      const { queryClient, wrapper } = createQueryWrapperWithClient();
      queryClient.setQueryData(adminQueryKeys.banners(), [mockBanner]);

      const { result } = renderHook(() => useToggleBannerStatusMutation(), {
        wrapper,
      });

      await result.current.mutateAsync({
        id: 'ban-1',
        isActive: false,
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('NONAKTIF')
      );
    });

    it('rolls back previous cache when toggle fails', async () => {
      vi.spyOn(bannersApi, 'toggleAdminBannerStatus').mockResolvedValue(
        left(new ApiError(500, 'TOGGLE_FAILED', 'Gagal toggle'))
      );

      const { queryClient, wrapper } = createQueryWrapperWithClient();
      queryClient.setQueryData(adminQueryKeys.banners(), [mockBanner]);

      const { result } = renderHook(() => useToggleBannerStatusMutation(), {
        wrapper,
      });

      await expect(
        result.current.mutateAsync({
          id: 'ban-1',
          isActive: false,
        })
      ).rejects.toBeDefined();

      const cache = queryClient.getQueryData<any[]>(adminQueryKeys.banners());
      expect(cache?.[0].isActive).toBe(true);
    });
  });

  describe('useDeleteBannerMutation', () => {
    it('deletes banner with title and without title', async () => {
      vi.spyOn(bannersApi, 'deleteAdminBanner').mockResolvedValue(right({ success: true }));
      const { result } = renderHook(() => useDeleteBannerMutation(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync({
        id: 'ban-1',
        title: 'Diskon Kopi 50% Weekend',
      });
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Diskon Kopi 50% Weekend')
      );

      await result.current.mutateAsync({
        id: 'ban-2',
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('throws error when delete fails', async () => {
      vi.spyOn(bannersApi, 'deleteAdminBanner').mockResolvedValue(
        left(new ApiError(500, 'DELETE_FAILED', 'Gagal hapus'))
      );
      const { result } = renderHook(() => useDeleteBannerMutation(), {
        wrapper: createQueryWrapper(),
      });

      await expect(
        result.current.mutateAsync({ id: 'ban-1' })
      ).rejects.toBeDefined();
    });
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

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
