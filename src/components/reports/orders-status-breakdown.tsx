'use client';

import { CheckCircle2, XCircle, Clock, PieChart } from 'lucide-react';
import { OrdersByStatusData } from '@/lib/validations/reports.schema';
import { cn } from '@/lib/utils/cn';

interface OrdersStatusBreakdownProps {
  ordersByStatus?: OrdersByStatusData[];
  isLoading?: boolean;
}

export function OrdersStatusBreakdown({
  ordersByStatus = [],
  isLoading,
}: OrdersStatusBreakdownProps) {
  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-3 animate-pulse">
        <div className="h-5 w-48 bg-stone-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-6 w-full bg-stone-100 dark:bg-zinc-800/60 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-stone-100 dark:bg-zinc-800/60 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalCount = ordersByStatus.reduce((acc, curr) => acc + curr.count, 0);

  const getStatusMeta = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return {
          label: 'Lunas / Selesai',
          icon: CheckCircle2,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-500',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40',
        };
      case 'CANCELLED':
        return {
          label: 'Dibatalkan',
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-500',
          badgeBg: 'bg-red-50 dark:bg-red-950/40 border-red-200/60 dark:border-red-800/40',
        };
      default:
        return {
          label: status,
          icon: Clock,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-500',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40',
        };
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-stone-900 dark:text-zinc-100">
              Distribusi Status Pesanan
            </h3>
            <p className="text-xs text-stone-500">
              Perbandingan pesanan lunas, aktif, dan pembatalan
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-stone-600 dark:text-zinc-400">
          Total: {totalCount}
        </span>
      </div>

      {/* Progress Multi-Bar */}
      {totalCount > 0 ? (
        <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden flex">
          {ordersByStatus.map((item) => {
            const pct = (item.count / totalCount) * 100;
            const meta = getStatusMeta(item.status);
            return (
              <div
                key={item.status}
                style={{ width: `${pct}%` }}
                className={cn('h-full transition-all', meta.bg)}
                title={`${meta.label}: ${item.count} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      ) : null}

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {ordersByStatus.map((item) => {
          const meta = getStatusMeta(item.status);
          const Icon = meta.icon;
          const pct = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : '0';

          return (
            <div
              key={item.status}
              className={cn(
                'p-4 rounded-2xl border flex items-center justify-between',
                meta.badgeBg
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('w-5 h-5', meta.color)} />
                <div>
                  <p className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                    {meta.label}
                  </p>
                  <p className="text-[11px] text-stone-400">{pct}% dari total</p>
                </div>
              </div>
              <p className="text-lg font-bold font-mono text-stone-900 dark:text-zinc-100">
                {item.count}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
