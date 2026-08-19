import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useAdminMenusQuery,
  useCreateMenuMutation,
  useUpdateMenuMutation,
  useToggleMenuAvailabilityMutation,
  useDeleteMenuMutation,
} from './use-admin-menus';
import { createQueryWrapper } from '../../test/test-utils';
import { toast } from 'sonner';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:5000/api/v1';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('use-admin-menus hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAdminMenusQuery', () => {
    it('fetches all menus when no categoryId is provided', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminMenusQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(2);
      expect(result.current.data?.[0].name).toBe('Nasi Goreng Spesial');
    });

    it('filters menus when categoryId is supplied', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminMenusQuery('cat-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].categoryId).toBe('cat-1');
    });

    it('handles query error when fetching fails', async () => {
      server.use(
        http.get(`${API_BASE}/public/menus`, () => {
          return HttpResponse.json({ message: 'Error' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminMenusQuery(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useCreateMenuMutation', () => {
    it('creates a new menu item and shows success toast', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateMenuMutation(), { wrapper });

      await result.current.mutateAsync({
        name: 'Mie Goreng Seafood',
        description: 'Mie dengan udang dan cumi',
        price: 32000,
        promoPrice: null,
        imageUrl: null,
        isAvailable: true,
        isBestSeller: false,
        isRecommended: true,
        categoryId: 'cat-1',
        variantGroups: [],
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil dibuat')
      );
    });

    it('throws ApiError when create menu mutation fails', async () => {
      server.use(
        http.post(`${API_BASE}/admin/menus`, () => {
          return HttpResponse.json({ message: 'Creation failed' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateMenuMutation(), { wrapper });

      await expect(
        result.current.mutateAsync({
          name: 'Fail',
          price: 10000,
          isAvailable: true,
          isBestSeller: false,
          isRecommended: false,
          categoryId: 'cat-1',
          variantGroups: [],
        })
      ).rejects.toBeDefined();
    });
  });

  describe('useUpdateMenuMutation', () => {
    it('updates a menu item and shows success toast', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateMenuMutation(), { wrapper });

      await result.current.mutateAsync({
        id: 'menu-1',
        payload: { price: 40000 },
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil diperbarui')
      );
    });

    it('throws ApiError when update menu mutation fails', async () => {
      server.use(
        http.patch(`${API_BASE}/admin/menus/:id`, () => {
          return HttpResponse.json({ message: 'Update failed' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateMenuMutation(), { wrapper });

      await expect(
        result.current.mutateAsync({ id: 'menu-1', payload: { price: 90000 } })
      ).rejects.toBeDefined();
    });
  });

  describe('useToggleMenuAvailabilityMutation', () => {
    it('toggles menu stock availability and triggers success toast with menu name', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useToggleMenuAvailabilityMutation(), { wrapper });

      await result.current.mutateAsync({
        id: 'menu-1',
        isAvailable: false,
        menuName: 'Nasi Goreng Spesial',
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Nasi Goreng Spesial')
      );
    });

    it('toggles menu stock availability without menuName', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useToggleMenuAvailabilityMutation(), { wrapper });

      const res = await result.current.mutateAsync({
        id: 'menu-1',
        isAvailable: true,
      });

      expect(res.isAvailable).toBe(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('handles rollback on mutation failure', async () => {
      server.use(
        http.patch(`${API_BASE}/admin/menus/:id/status`, () => {
          return HttpResponse.json({ message: 'Status failed' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useToggleMenuAvailabilityMutation(), { wrapper });

      await expect(
        result.current.mutateAsync({
          id: 'menu-1',
          isAvailable: false,
          menuName: 'Nasi Goreng Spesial',
        })
      ).rejects.toBeDefined();
    });
  });

  describe('useDeleteMenuMutation', () => {
    it('deletes menu item and shows success toast', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useDeleteMenuMutation(), { wrapper });

      await result.current.mutateAsync('menu-1');

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Menu berhasil dihapus')
      );
    });

    it('throws ApiError when delete menu mutation fails', async () => {
      server.use(
        http.delete(`${API_BASE}/admin/menus/:id`, () => {
          return HttpResponse.json({ message: 'Delete failed' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useDeleteMenuMutation(), { wrapper });

      await expect(result.current.mutateAsync('menu-1')).rejects.toBeDefined();
    });
  });
});
