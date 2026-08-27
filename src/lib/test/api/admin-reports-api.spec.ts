import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminDashboardOverview,
  getAdminRevenueReport,
  getAdminTopSellingReport,
} from '@/lib/api/admin-reports-api';
import * as hardenedFetchModule from '@/lib/api/hardened-fetch';
import { right, left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';

vi.mock('@/lib/api/hardened-fetch', () => ({
  hardenedFetch: vi.fn(),
}));

describe('Admin Reports API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdminDashboardOverview', () => {
    it('fetches dashboard overview metrics successfully', async () => {
      const mockOverview = {
        kpi: {
          todayRevenue: 1500000,
          todayOrdersCount: 25,
          activeOrdersCount: 3,
          tableOccupancy: {
            totalTables: 10,
            occupiedTables: 4,
            occupancyPercentage: 40,
          },
        },
        recentOrders: [],
        topSellingToday: [],
      };

      vi.mocked(hardenedFetchModule.hardenedFetch).mockResolvedValue(right(mockOverview));

      const result = await getAdminDashboardOverview();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.kpi.todayRevenue).toBe(1500000);
        expect(result.value.kpi.tableOccupancy.occupancyPercentage).toBe(40);
      }
    });

    it('returns ApiError on failure', async () => {
      vi.mocked(hardenedFetchModule.hardenedFetch).mockResolvedValue(left(ApiError.networkError()));

      const result = await getAdminDashboardOverview();

      expect(result.isLeft()).toBe(true);
    });
  });

  describe('getAdminRevenueReport', () => {
    it('fetches revenue report with date range filters', async () => {
      const mockRevenue = {
        totalRevenue: 5000000,
        totalOrders: 80,
        averageOrderValue: 62500,
        ordersByStatus: [{ status: 'COMPLETED', count: 75 }],
      };

      vi.mocked(hardenedFetchModule.hardenedFetch).mockResolvedValue(right(mockRevenue));

      const result = await getAdminRevenueReport({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.totalRevenue).toBe(5000000);
      }
    });
  });

  describe('getAdminTopSellingReport', () => {
    it('fetches top selling items report', async () => {
      const mockTopSelling = [
        {
          menuItemId: 'item-1',
          name: 'Kopi Susu Gula Aren',
          totalQuantitySold: 120,
          totalRevenue: 2400000,
          categoryName: 'Coffee',
        },
      ];

      vi.mocked(hardenedFetchModule.hardenedFetch).mockResolvedValue(right(mockTopSelling));

      const result = await getAdminTopSellingReport({ limit: 5 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value[0].name).toBe('Kopi Susu Gula Aren');
      }
    });
  });
});
