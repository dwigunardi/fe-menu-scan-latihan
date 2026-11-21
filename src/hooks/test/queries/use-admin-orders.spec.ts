import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useAdminOrdersPaginatedQuery,
  useUpdateOrderStatusMutation,
} from '@/hooks/queries/use-admin-orders';
import { createQueryWrapper } from '@/test/test-utils';
import { useAuthStore } from '@/store/use-auth-store';
import { toast } from 'sonner';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('use-admin-orders hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );
  });

  describe('useAdminOrdersPaginatedQuery', () => {
    it('fetches and returns paginated orders', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useAdminOrdersPaginatedQuery({ limit: 20 }, { retry: false }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.items).toBeDefined();
      expect(result.current.data?.items.length).toBeGreaterThan(0);
    });

    it('handles query error when API returns 500', async () => {
      server.use(
        http.get(`${API_BASE}/admin/orders`, () => {
          return HttpResponse.json(
            { statusCode: 500, message: 'Server error' },
            { status: 500 }
          );
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useAdminOrdersPaginatedQuery({}, { retry: false }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useUpdateOrderStatusMutation', () => {
    it('mutates order status and triggers toast feedback', async () => {
      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateOrderStatusMutation(), {
        wrapper,
      });

      result.current.mutate({ id: 'ord-1', status: 'PREPARING' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Sedang Dimasak')
      );
    });

    it('handles mutation rollback on error', async () => {
      server.use(
        http.put(`${API_BASE}/admin/orders/:id/status`, () => {
          return HttpResponse.json(
            { statusCode: 400, message: 'Invalid transition' },
            { status: 400 }
          );
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateOrderStatusMutation(), {
        wrapper,
      });

      result.current.mutate({ id: 'ord-1', status: 'CANCELLED' });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    describe('when no cashier shift is open (409)', () => {
      const NO_SHIFT_MESSAGE =
        'Belum ada shift kasir yang dibuka. Buka shift terlebih dahulu sebelum menerima pembayaran tunai.';

      beforeEach(() => {
        server.use(
          http.put(`${API_BASE}/admin/orders/:id/status`, () =>
            HttpResponse.json(
              { statusCode: 409, error: 'Conflict', message: NO_SHIFT_MESSAGE },
              { status: 409 }
            )
          )
        );
      });

      it('offers a "Buka Shift" action that calls onNoOpenShift', async () => {
        const onNoOpenShift = vi.fn();
        const wrapper = createQueryWrapper();
        const { result } = renderHook(
          () => useUpdateOrderStatusMutation({ onNoOpenShift }),
          { wrapper }
        );

        result.current.mutate({ id: 'ord-1', status: 'PAID' });
        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(toast.error).toHaveBeenCalledTimes(1);
        const [title, opts] = vi.mocked(toast.error).mock.calls[0] as [
          string,
          { description: string; action: { label: string; onClick: () => void } },
        ];
        expect(title).toBe('Shift kasir belum dibuka');
        expect(opts.description).toBe(NO_SHIFT_MESSAGE);
        expect(opts.action.label).toBe('Buka Shift');

        opts.action.onClick();
        expect(onNoOpenShift).toHaveBeenCalledTimes(1);
      });

      it('recognizes the SHIFT_NOT_OPEN code from the response body', async () => {
        server.use(
          http.put(`${API_BASE}/admin/orders/:id/status`, () =>
            HttpResponse.json(
              { statusCode: 409, error: 'Conflict', code: 'SHIFT_NOT_OPEN', message: 'Laci kas masih tertutup.' },
              { status: 409 }
            )
          )
        );
        const wrapper = createQueryWrapper();
        const { result } = renderHook(
          () => useUpdateOrderStatusMutation({ onNoOpenShift: vi.fn() }),
          { wrapper }
        );

        result.current.mutate({ id: 'ord-1', status: 'PAID' });
        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(toast.error).toHaveBeenCalledWith(
          'Shift kasir belum dibuka',
          expect.objectContaining({ description: 'Laci kas masih tertutup.' })
        );
      });

      it('falls back to the generic error toast without onNoOpenShift', async () => {
        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useUpdateOrderStatusMutation(), {
          wrapper,
        });

        result.current.mutate({ id: 'ord-1', status: 'PAID' });
        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(toast.error).toHaveBeenCalledTimes(1);
        expect(toast.error).not.toHaveBeenCalledWith(
          'Shift kasir belum dibuka',
          expect.anything()
        );
      });
    });
  });
});
