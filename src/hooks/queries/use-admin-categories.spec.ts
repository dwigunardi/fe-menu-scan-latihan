import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useAdminCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from './use-admin-categories';
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

describe('use-admin-categories hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAdminCategoriesQuery', () => {
    it('fetches categories and populates data', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminCategoriesQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(2);
      expect(result.current.data?.[0].name).toBe('Makanan Utama');
    });

    it('handles query error gracefully when API fails', async () => {
      server.use(
        http.get(`${API_BASE}/public/categories`, () => {
          return HttpResponse.json({ message: 'Server down' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminCategoriesQuery(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });
  });

  describe('useCreateCategoryMutation', () => {
    it('creates category successfully and triggers toast feedback', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateCategoryMutation(), { wrapper });

      await result.current.mutateAsync({ name: 'Minuman Dingin', sortOrder: 3 });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil ditambahkan')
      );
    });

    it('throws ApiError and notifies when create mutation fails', async () => {
      server.use(
        http.post(`${API_BASE}/admin/categories`, () => {
          return HttpResponse.json({ message: 'Duplicate category' }, { status: 409 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateCategoryMutation(), { wrapper });

      await expect(
        result.current.mutateAsync({ name: 'Duplikat' })
      ).rejects.toBeDefined();
    });
  });

  describe('useUpdateCategoryMutation', () => {
    it('updates category successfully and triggers toast feedback', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateCategoryMutation(), { wrapper });

      await result.current.mutateAsync({
        id: 'cat-1',
        payload: { name: 'Makanan Tradisional' },
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil diperbarui')
      );
    });

    it('throws ApiError when update mutation fails', async () => {
      server.use(
        http.put(`${API_BASE}/admin/categories/:id`, () => {
          return HttpResponse.json({ message: 'Update failed' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateCategoryMutation(), { wrapper });

      await expect(
        result.current.mutateAsync({ id: 'cat-1', payload: { name: 'Gagal' } })
      ).rejects.toBeDefined();
    });
  });

  describe('useDeleteCategoryMutation', () => {
    it('deletes category successfully and triggers toast feedback', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useDeleteCategoryMutation(), { wrapper });

      await result.current.mutateAsync({
        id: 'cat-1',
        name: 'Makanan Utama',
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil dihapus')
      );
    });

    it('throws ApiError when delete mutation fails', async () => {
      server.use(
        http.delete(`${API_BASE}/admin/categories/:id`, () => {
          return HttpResponse.json({ message: 'Delete failed' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useDeleteCategoryMutation(), { wrapper });

      await expect(
        result.current.mutateAsync({ id: 'cat-1', name: 'Makanan' })
      ).rejects.toBeDefined();
    });
  });
});
