import { apiTransport } from './api-transport';
import { Either } from './either';
import { ApiError } from './api-error';
import {
  DashboardOverviewData,
  DashboardOverviewSchema,
  RevenueReportData,
  RevenueReportSchema,
  TopSellingReportData,
  TopSellingReportSchema,
  ReportFilterParams,
} from '../validations/reports.schema';

/**
 * Fetches single-call aggregated dashboard overview metrics
 * Includes: KPIs (todayRevenue, orders, active, occupancy), Recent Orders, and Top Selling Today.
 */
export async function getAdminDashboardOverview(): Promise<
  Either<ApiError, DashboardOverviewData>
> {
  return apiTransport(
    '/admin/reports/dashboard-overview',
    DashboardOverviewSchema
  );
}

/**
 * Fetches revenue summary metrics with optional date range filters (startDate, endDate).
 */
export async function getAdminRevenueReport(
  params: ReportFilterParams = {}
): Promise<Either<ApiError, RevenueReportData>> {
  const query = new URLSearchParams();
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const qs = query.toString();
  return apiTransport(
    `/admin/reports/revenue${qs ? `?${qs}` : ''}`,
    RevenueReportSchema
  );
}

/**
 * Fetches top selling menu items ranked by quantity sold and revenue.
 */
export async function getAdminTopSellingReport(
  params: ReportFilterParams = {}
): Promise<Either<ApiError, TopSellingReportData>> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const qs = query.toString();
  return apiTransport(
    `/admin/reports/top-selling${qs ? `?${qs}` : ''}`,
    TopSellingReportSchema
  );
}
