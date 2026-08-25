import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as hardenedFetchModule from '@/lib/api/hardened-fetch';
import {
  getCurrentShift,
  openShift,
  closeShift,
  getShiftHistory,
} from '@/lib/api/admin-shifts-api';
import { right, left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';
import { ShiftItem } from '@/lib/validations/shift.schema';

describe('Admin Shifts API Client', () => {
  const mockShift: ShiftItem = {
    id: '11111111-1111-1111-1111-111111111111',
    branchId: 'default-branch',
    staffId: 'staff-1',
    staffName: 'Budi Kasir',
    openingCash: 200000,
    expectedCash: 350000,
    actualCash: null,
    cashVariance: null,
    totalCashOrders: 3,
    totalQrisOrders: 5,
    totalCashRevenue: 150000,
    totalQrisRevenue: 250000,
    totalRevenue: 400000,
    status: 'OPEN',
    notes: 'Pecahan 10rb',
    openedAt: '2026-08-25T08:00:00.000Z',
    closedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('getCurrentShift calls /admin/shifts/current and returns active shift', async () => {
    vi.spyOn(hardenedFetchModule, 'hardenedFetch').mockResolvedValueOnce(right(mockShift));

    const result = await getCurrentShift();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value?.staffName).toBe('Budi Kasir');
      expect(result.value?.status).toBe('OPEN');
    }
  });

  it('openShift calls /admin/shifts/open with payload', async () => {
    vi.spyOn(hardenedFetchModule, 'hardenedFetch').mockResolvedValueOnce(right(mockShift));

    const result = await openShift({ openingCash: 200000, notes: 'Modal pagi' });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.openingCash).toBe(200000);
    }
  });

  it('closeShift reconciles physical cash and closes shift', async () => {
    const closedShift: ShiftItem = {
      ...mockShift,
      status: 'CLOSED',
      actualCash: 350000,
      cashVariance: 0,
      closedAt: '2026-08-25T16:00:00.000Z',
    };

    vi.spyOn(hardenedFetchModule, 'hardenedFetch').mockResolvedValueOnce(right(closedShift));

    const result = await closeShift(mockShift.id, { actualCash: 350000 });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.status).toBe('CLOSED');
      expect(result.value.cashVariance).toBe(0);
    }
  });

  it('getShiftHistory retrieves paginated shift history', async () => {
    const mockResponse = {
      items: [mockShift],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    vi.spyOn(hardenedFetchModule, 'hardenedFetch').mockResolvedValueOnce(right(mockResponse));

    const result = await getShiftHistory({ page: 1, limit: 10 });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1);
      expect(result.value.meta.totalItems).toBe(1);
    }
  });
});
