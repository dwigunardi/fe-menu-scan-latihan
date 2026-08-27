import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useCurrentShiftQuery,
  useOpenShiftMutation,
  useCloseShiftMutation,
  useShiftHistoryQuery,
} from '@/hooks/queries/use-admin-shifts';
import { createQueryWrapper } from '@/test/test-utils';
import * as shiftsApi from '@/lib/api/admin-shifts-api';
import { right, left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';
import { ShiftItem } from '@/lib/validations/shift.schema';
import { toast } from 'sonner';

vi.mock('@/lib/api/admin-shifts-api', () => ({
  getCurrentShift: vi.fn(),
  openShift: vi.fn(),
  closeShift: vi.fn(),
  getShiftHistory: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('use-admin-shifts query hooks', () => {
  const mockCurrentShift: ShiftItem = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    branchId: 'branch-1',
    staffId: 'staff-101',
    staffName: 'Budi Kasir',
    openingCash: 100000,
    expectedCash: 350000,
    actualCash: null,
    cashVariance: null,
    totalCashOrders: 5,
    totalQrisOrders: 7,
    totalCashRevenue: 250000,
    totalQrisRevenue: 500000,
    totalRevenue: 750000,
    status: 'OPEN',
    notes: 'Shift pagi',
    openedAt: '2026-01-01T08:00:00.000Z',
    closedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCurrentShiftQuery', () => {
    it('fetches active cashier shift', async () => {
      vi.mocked(shiftsApi.getCurrentShift).mockResolvedValue(right(mockCurrentShift));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCurrentShiftQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.staffName).toBe('Budi Kasir');
      expect(result.current.data?.status).toBe('OPEN');
    });

    it('throws error when getCurrentShift fails', async () => {
      vi.mocked(shiftsApi.getCurrentShift).mockResolvedValue(left(ApiError.networkError()));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCurrentShiftQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useOpenShiftMutation', () => {
    it('opens shift successfully and shows toast', async () => {
      vi.mocked(shiftsApi.openShift).mockResolvedValue(right(mockCurrentShift));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useOpenShiftMutation(), { wrapper });

      await result.current.mutateAsync({
        openingCash: 100000,
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Shift Kasir berhasil dibuka oleh Budi Kasir')
      );
    });
  });

  describe('useCloseShiftMutation', () => {
    it('closes shift and shows success toast', async () => {
      const closedShift: ShiftItem = {
        ...mockCurrentShift,
        status: 'CLOSED',
        actualCash: 350000,
        cashVariance: 0,
        closedAt: '2026-01-01T16:00:00.000Z',
      };
      vi.mocked(shiftsApi.closeShift).mockResolvedValue(right(closedShift));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCloseShiftMutation(), { wrapper });

      await result.current.mutateAsync({
        shiftId: mockCurrentShift.id,
        payload: {
          actualCash: 350000,
          notes: 'Selesai shift tanpa kendala',
        },
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Shift Kasir berhasil ditutup')
      );
    });
  });

  describe('useShiftHistoryQuery', () => {
    it('fetches paginated shift history', async () => {
      const mockHistory = {
        items: [mockCurrentShift],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
      vi.mocked(shiftsApi.getShiftHistory).mockResolvedValue(right(mockHistory));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useShiftHistoryQuery({ page: 1, limit: 10 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.meta.totalItems).toBe(1);
    });
  });
});
