'use client';

import { useState } from 'react';
import { Clock, Plus, RefreshCw, Receipt } from 'lucide-react';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE_GROUPS } from '@/lib/constants/roles';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/common/pagination';
import {
  useCurrentShiftQuery,
  useShiftHistoryQuery,
} from '@/hooks/queries/use-admin-shifts';
import {
  OpenShiftModal,
  CloseShiftModal,
  ZReportReceiptModal,
  ShiftSummaryCard,
  ShiftHistoryTable,
} from '@/components/shifts';
import { ShiftItem } from '@/lib/validations/shift.schema';

export default function AdminShiftsPage() {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Modals state
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState<boolean>(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState<boolean>(false);
  const [selectedZReportShift, setSelectedZReportShift] = useState<ShiftItem | null>(null);

  // Queries
  const {
    data: currentShift,
    isLoading: isCurrentShiftLoading,
    isFetching: isCurrentShiftFetching,
    refetch: refetchCurrentShift,
  } = useCurrentShiftQuery();

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
    refetch: refetchHistory,
  } = useShiftHistoryQuery({ page, limit });

  const shifts = historyData?.items || [];
  const meta = historyData?.meta || {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const handleRefresh = () => {
    refetchCurrentShift();
    refetchHistory();
  };

  const handleShiftClosed = (closedShift: ShiftItem) => {
    setIsCloseShiftModalOpen(false);
    setSelectedZReportShift(closedShift);
  };

  const isFetching = isCurrentShiftFetching || isHistoryFetching;

  return (
    <RoleGuard allowedRoles={ROLE_GROUPS.CASHIER_OR_ADMIN}>
      <div className="space-y-6 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
                Manajemen Shift & Z-Report
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
              Catat modal kas awal, pantau arus kas laci berjalan, dan lakukan audit rekonsiliasi tutup kasir.
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
              className="rounded-2xl flex items-center gap-1.5 text-xs text-stone-600 dark:text-zinc-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Muat Ulang</span>
            </Button>

            {(!currentShift || currentShift.status !== 'OPEN') && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsOpenShiftModalOpen(true)}
                className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Buka Shift</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active Shift Summary Widget */}
        <ShiftSummaryCard
          currentShift={currentShift || null}
          isLoading={isCurrentShiftLoading}
          onOpenShiftClick={() => setIsOpenShiftModalOpen(true)}
          onCloseShiftClick={() => setIsCloseShiftModalOpen(true)}
          onViewZReportClick={(s) => setSelectedZReportShift(s)}
        />

        {/* Shift History & Audit Table */}
        <div className="space-y-4">
          <ShiftHistoryTable
            shifts={shifts}
            isLoading={isHistoryLoading}
            onViewZReport={(shift) => setSelectedZReportShift(shift)}
          />

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                page={page}
                limit={limit}
                totalItems={meta.totalItems}
                totalPages={meta.totalPages}
                hasNextPage={meta.hasNextPage}
                hasPrevPage={meta.hasPrevPage}
                isLoading={isHistoryLoading}
                onPageChange={(p) => setPage(p)}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
                itemLabel="shift"
              />
            </div>
          )}

        </div>

        {/* Modals */}
        <OpenShiftModal
          isOpen={isOpenShiftModalOpen}
          onClose={() => setIsOpenShiftModalOpen(false)}
        />

        {currentShift && (
          <CloseShiftModal
            isOpen={isCloseShiftModalOpen}
            onClose={() => setIsCloseShiftModalOpen(false)}
            shift={currentShift}
            onShiftClosed={handleShiftClosed}
          />
        )}

        <ZReportReceiptModal
          isOpen={!!selectedZReportShift}
          onClose={() => setSelectedZReportShift(null)}
          shift={selectedZReportShift}
        />
      </div>
    </RoleGuard>
  );
}
