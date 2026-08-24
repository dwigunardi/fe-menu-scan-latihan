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
import { createQueryWrapper } from '@/test/test-utils';
import { useAuthStore } from '@/store/use-auth-store';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('use-admin-banners hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '1', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );
  });

  it('fetches admin banners successfully', async () => {
    const { result } = renderHook(() => useAdminBannersQuery(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it('fetches public active banners successfully', async () => {
    const { result } = renderHook(() => usePublicBannersQuery(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.every((b) => b.isActive)).toBe(true);
  });

  it('fetches single banner detail by id', async () => {
    const { result } = renderHook(() => useAdminBannerDetailQuery('ban-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('ban-1');
  });

  it('creates banner successfully and triggers success toast', async () => {
    const { result } = renderHook(() => useCreateBannerMutation(), {
      wrapper: createQueryWrapper(),
    });

    await result.current.mutateAsync({
      title: 'Diskon 100% Granat',
      description: 'Promo diskon heboh',
      imageUrl:
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=675&fit=crop',
      targetUrl: '/menu',
      sortOrder: 1,
      isActive: true,
    });

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Diskon 100% Granat')
    );
  });

  it('updates banner successfully and triggers success toast', async () => {
    const { result } = renderHook(() => useUpdateBannerMutation(), {
      wrapper: createQueryWrapper(),
    });

    await result.current.mutateAsync({
      id: 'ban-1',
      payload: { title: 'Diskon Kopi 80%' },
    });

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Diskon Kopi 80%')
    );
  });

  it('toggles banner active status and triggers success toast', async () => {
    const { result } = renderHook(() => useToggleBannerStatusMutation(), {
      wrapper: createQueryWrapper(),
    });

    await result.current.mutateAsync({
      id: 'ban-1',
      isActive: false,
    });

    expect(toast.success).toHaveBeenCalled();
  });

  it('deletes banner successfully and triggers success toast', async () => {
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
  });
});
