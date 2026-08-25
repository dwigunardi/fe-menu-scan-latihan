'use client';

import { useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/lib/constants/roles';
import {
  ReportDateFilter,
  DateFilterValue,
  RevenueSummaryCards,
  TopSellingTable,
  OrdersStatusBreakdown,
  ExportReportButton,
} from '@/components/reports';
import {
  useAdminRevenueReportQuery,
  useAdminTopSellingQuery,
} from '@/hooks/queries/use-admin-reports';
import { getTodayRange, formatDateIndo } from '@/lib/utils/date-helpers';
import { Button } from '@/components/ui/button';

export default function AdminReportsPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(() => {
    const today = getTodayRange();
    return {
      preset: 'today',
      startDate: today.startDate,
      endDate: today.endDate,
    };
  });

  const queryParams = {
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate,
  };

  const revenueQuery = useAdminRevenueReportQuery(queryParams);
  const topSellingQuery = useAdminTopSellingQuery({ ...queryParams, limit: 10 });

  const isLoading = revenueQuery.isLoading || topSellingQuery.isLoading;
  const isFetching = revenueQuery.isFetching || topSellingQuery.isFetching;

  const handleRefresh = () => {
    revenueQuery.refetch();
    topSellingQuery.refetch();
  };

  const getDateLabel = () => {
    if (dateFilter.preset === 'today') return 'Hari Ini';
    if (dateFilter.preset === '7d') return '7 Hari Terakhir';
    if (dateFilter.preset === 'month') return 'Bulan Ini';
    if (dateFilter.startDate && dateFilter.endDate) {
      return `${formatDateIndo(dateFilter.startDate)} - ${formatDateIndo(dateFilter.endDate)}`;
    }
    return 'Semua Periode';
  };

  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
                Laporan & Analitik Penjualan
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
              Pantau performa pendapatan, total volume pesanan, dan menu terlaris Kumpul Cafe.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="rounded-xl flex items-center gap-1.5 text-xs text-stone-600 dark:text-zinc-400 print:hidden"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Muat Ulang</span>
            </Button>

            <ExportReportButton
              revenueData={revenueQuery.data}
              topSellingItems={topSellingQuery.data}
              dateLabel={getDateLabel()}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="print:hidden">
          <ReportDateFilter
            value={dateFilter}
            onChange={setDateFilter}
            disabled={isFetching}
          />
        </div>

        {/* Date Label Banner (Visible on Print and Screen) */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs font-semibold text-amber-900 dark:text-amber-200">
          <span>Periode Data: {getDateLabel()}</span>
          {revenueQuery.data && (
            <span className="font-mono">
              Total Volume: {revenueQuery.data.totalOrders} Transaksi
            </span>
          )}
        </div>

        {/* KPI Revenue Cards */}
        <RevenueSummaryCards
          data={revenueQuery.data}
          isLoading={revenueQuery.isLoading}
        />

        {/* Main Insights Grid: Top Selling & Orders Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopSellingTable
            items={topSellingQuery.data}
            isLoading={topSellingQuery.isLoading}
          />
          <OrdersStatusBreakdown
            ordersByStatus={revenueQuery.data?.ordersByStatus}
            isLoading={revenueQuery.isLoading}
          />
        </div>
      </div>
    </RoleGuard>
  );
}
