'use client';

import { DollarSign, ShoppingBag, Receipt, Sparkles } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format-currency';
import { RevenueReportData } from '@/lib/validations/reports.schema';

interface RevenueSummaryCardsProps {
  data?: RevenueReportData;
  isLoading?: boolean;
}

export function RevenueSummaryCards({ data, isLoading }: RevenueSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 animate-pulse space-y-3"
          >
            <div className="h-4 w-24 bg-stone-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-8 w-40 bg-stone-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-3 w-32 bg-stone-100 dark:bg-zinc-800/60 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  const totalRevenue = data?.totalRevenue ?? 0;
  const totalOrders = data?.totalOrders ?? 0;
  const averageOrderValue = data?.averageOrderValue ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Revenue */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-2 relative overflow-hidden shadow-xs hover:border-amber-500/40 transition-colors">
        <div className="flex items-center justify-between text-stone-500">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Pendapatan</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono text-stone-900 dark:text-zinc-100">
          {formatRupiah(totalRevenue)}
        </p>
        <p className="text-[11px] font-medium text-stone-500 dark:text-zinc-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Total akumulasi transaksi terbayar
        </p>
      </div>

      {/* Total Orders */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-2 relative overflow-hidden shadow-xs hover:border-blue-500/40 transition-colors">
        <div className="flex items-center justify-between text-stone-500">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Transaksi</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ShoppingBag className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono text-stone-900 dark:text-zinc-100">
          {totalOrders} <span className="text-sm font-normal text-stone-500">Pesanan</span>
        </p>
        <p className="text-[11px] font-medium text-stone-500 dark:text-zinc-400">
          Volume transaksi dalam periode terpilih
        </p>
      </div>

      {/* Average Order Value (AOV) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-2 relative overflow-hidden shadow-xs hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between text-stone-500">
          <span className="text-xs font-semibold uppercase tracking-wider">Rata-Rata Nilai Pesanan</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Receipt className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono text-stone-900 dark:text-zinc-100">
          {formatRupiah(Math.round(averageOrderValue))}
        </p>
        <p className="text-[11px] font-medium text-stone-500 dark:text-zinc-400">
          AOV (Average Order Value) per tiket
        </p>
      </div>
    </div>
  );
}
