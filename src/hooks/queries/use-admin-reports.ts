import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  getAdminDashboardOverview,
  getAdminRevenueReport,
  getAdminTopSellingReport,
} from '@/lib/api/admin-reports-api';
import { adminQueryKeys } from '@/lib/query-keys';
import {
  DashboardOverviewData,
  RevenueReportData,
  TopSellingReportData,
  ReportFilterParams,
} from '@/lib/validations/reports.schema';

/**
 * Hook to fetch live consolidated dashboard overview metrics.
 * Refetches every 30 seconds by default for live monitoring.
 */
export function useAdminDashboardOverviewQuery(
  options?: Partial<UseQueryOptions<DashboardOverviewData>>
) {
  return useQuery({
    queryKey: adminQueryKeys.reportsOverview(),
    queryFn: async () => {
      const result = await getAdminDashboardOverview();
      if (result.isLeft()) {
        throw result.value;
      }
      return result.value;
    },
    staleTime: 30000,
    refetchInterval: 30000,
    ...options,
  });
}

/**
 * Hook to fetch revenue & order status statistics for a specific date range.
 */
export function useAdminRevenueReportQuery(
  params: ReportFilterParams = {},
  options?: Partial<UseQueryOptions<RevenueReportData>>
) {
  return useQuery({
    queryKey: adminQueryKeys.reportsRevenue(params as Record<string, unknown>),
    queryFn: async () => {
      const result = await getAdminRevenueReport(params);
      if (result.isLeft()) {
        throw result.value;
      }
      return result.value;
    },
    staleTime: 60000,
    ...options,
  });
}

/**
 * Hook to fetch top-selling menu items by quantity and revenue.
 */
export function useAdminTopSellingQuery(
  params: ReportFilterParams = {},
  options?: Partial<UseQueryOptions<TopSellingReportData>>
) {
  return useQuery({
    queryKey: adminQueryKeys.reportsTopSelling(params as Record<string, unknown>),
    queryFn: async () => {
      const result = await getAdminTopSellingReport(params);
      if (result.isLeft()) {
        throw result.value;
      }
      return result.value;
    },
    staleTime: 60000,
    ...options,
  });
}
