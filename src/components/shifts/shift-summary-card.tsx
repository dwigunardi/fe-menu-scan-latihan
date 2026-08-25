'use client';

import * as React from 'react';
import {
  Clock,
  User,
  Coins,
  QrCode,
  DollarSign,
  Receipt,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/utils/format-currency';
import { formatDateTimeIndo } from '@/lib/utils/date-helpers';
import { ShiftItem } from '@/lib/validations/shift.schema';

export interface ShiftSummaryCardProps {
  currentShift: ShiftItem | null;
  isLoading: boolean;
  onOpenShiftClick: () => void;
  onCloseShiftClick: () => void;
  onViewZReportClick?: (shift: ShiftItem) => void;
}

export function ShiftSummaryCard({
  currentShift,
  isLoading,
  onOpenShiftClick,
  onCloseShiftClick,
  onViewZReportClick,
}: ShiftSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-40 bg-stone-200 dark:bg-zinc-800 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-stone-100 dark:bg-zinc-800/60 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentShift || currentShift.status !== 'OPEN') {
    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-md shrink-0">
            <Coins className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-zinc-50">
              Belum Ada Shift Kasir yang Aktif
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
              Buka shift kasir terlebih dahulu untuk mencatat kas modal awal dan melacak transaksi tunai.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onOpenShiftClick}
          className="rounded-2xl h-11 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Buka Shift Kasir Baru</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-sm space-y-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900 dark:text-zinc-50">
                Shift Kasir Aktif
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                OPEN
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-stone-500 dark:text-zinc-400">
              <span className="flex items-center gap-1 font-medium text-stone-700 dark:text-zinc-300">
                <User className="w-3.5 h-3.5 text-amber-600" /> {currentShift.staffName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Buka: {formatDateTimeIndo(currentShift.openedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={onCloseShiftClick}
            className="rounded-2xl h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Receipt className="w-4 h-4" />
            <span>Tutup Shift & Z-Report</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Modal Kas Awal */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60 space-y-1">
          <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" /> Kas Modal Awal
          </span>
          <p className="text-base sm:text-lg font-bold font-mono text-stone-900 dark:text-zinc-100">
            {formatRupiah(currentShift.openingCash)}
          </p>
        </div>

        {/* Penjualan Tunai */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Penjualan Tunai ({currentShift.totalCashOrders})
          </span>
          <p className="text-base sm:text-lg font-bold font-mono text-emerald-800 dark:text-emerald-300">
            {formatRupiah(currentShift.totalCashRevenue)}
          </p>
        </div>

        {/* Penjualan QRIS */}
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20 space-y-1">
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-blue-500" /> Penjualan QRIS ({currentShift.totalQrisOrders})
          </span>
          <p className="text-base sm:text-lg font-bold font-mono text-blue-800 dark:text-blue-300">
            {formatRupiah(currentShift.totalQrisRevenue)}
          </p>
        </div>

        {/* Kas Harapan di Laci */}
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-500/30 space-y-1">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-amber-600" /> Kas Harapan di Laci
          </span>
          <p className="text-base sm:text-lg font-black font-mono text-amber-900 dark:text-amber-200">
            {formatRupiah(currentShift.expectedCash)}
          </p>
        </div>
      </div>
    </div>
  );
}
