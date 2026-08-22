import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useAdminTablesQuery,
  useAdminTablesPaginatedQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useResetTableMutation,
  useDeleteTableMutation,
  useAdminTableZonesQuery,
  useCreateTableZoneMutation,
  useUpdateTableZoneMutation,
  useDeleteTableZoneMutation,
} from './use-admin-tables';
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

describe('use-admin-tables hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAdminTablesQuery', () => {
    it('fetches all tables successfully', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminTablesQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(2);
    });

    it('handles query error when fetching fails', async () => {
      server.use(
        http.get(`${API_BASE}/admin/tables`, () => {
          return HttpResponse.json({ message: 'Server error' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminTablesQuery(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useAdminTablesPaginatedQuery', () => {
    it('fetches paginated tables successfully', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useAdminTablesPaginatedQuery({ page: 1, limit: 10 }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.items.length).toBe(2);
      expect(result.current.data?.meta.totalItems).toBe(2);
    });
  });

  describe('useCreateTableMutation', () => {
    it('creates a new table and shows success toast', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateTableMutation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          tableNumber: 'VIP-02',
          capacity: 6,
        });
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil ditambahkan')
      );
    });

    it('throws ApiError when create table mutation fails', async () => {
      server.use(
        http.post(`${API_BASE}/admin/tables`, () => {
          return HttpResponse.json({ message: 'Failed to create table' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateTableMutation(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ tableNumber: 'ERR-1', capacity: 4 });
        })
      ).rejects.toThrow();
    });
  });

  describe('useUpdateTableMutation', () => {
    it('updates a table and shows success toast', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateTableMutation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'table-1',
          payload: { capacity: 8 },
        });
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil diperbarui')
      );
    });

    it('throws ApiError when update table mutation fails', async () => {
      server.use(
        http.put(`${API_BASE}/admin/tables/:id`, () => {
          return HttpResponse.json({ message: 'Failed to update table' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateTableMutation(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ id: 'table-1', payload: { capacity: 9 } });
        })
      ).rejects.toThrow();
    });
  });

  describe('useResetTableMutation', () => {
    it('resets a table session and shows success toast', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useResetTableMutation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'table-2',
          tableNumber: 'T-02',
        });
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil')
      );
    });

    it('handles rollback on reset mutation failure', async () => {
      server.use(
        http.post(`${API_BASE}/admin/tables/:id/reset`, () => {
          return HttpResponse.json({ message: 'Reset failed' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useResetTableMutation(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ id: 'table-2' });
        })
      ).rejects.toThrow();
    });
  });

  describe('useDeleteTableMutation', () => {
    it('deletes a table and shows success toast', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useDeleteTableMutation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'table-1',
          tableNumber: 'T-01',
        });
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil dihapus')
      );
    });

    it('throws ApiError when delete table mutation fails', async () => {
      server.use(
        http.delete(`${API_BASE}/admin/tables/:id`, () => {
          return HttpResponse.json({ message: 'Delete failed' }, { status: 500 });
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useDeleteTableMutation(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ id: 'table-1' });
        })
      ).rejects.toThrow();
    });
  });
  describe('Table Zones Hooks', () => {
    it('fetches all table zones successfully', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminTableZonesQuery(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.length).toBe(3);
      expect(result.current.data?.[0].name).toBe('Indoor (AC Non-Smoking)');
    });

    it('creates a new table zone and shows success toast', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateTableZoneMutation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          name: 'Rooftop 2F',
          description: 'Area atas kafe',
          color: 'purple',
          sortOrder: 4,
        });
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil ditambahkan')
      );
    });

    it('updates a table zone and shows success toast', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateTableZoneMutation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'zone-1',
          payload: { name: 'Indoor AC Updated' },
        });
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil diperbarui')
      );
    });

    it('deletes a table zone and shows success toast', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useDeleteTableZoneMutation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'zone-1',
          name: 'Indoor (AC Non-Smoking)',
        });
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil dihapus')
      );
    });
  });
});
