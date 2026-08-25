'use client';

import { Trophy, UtensilsCrossed } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format-currency';
import { TopSellingItemData } from '@/lib/validations/reports.schema';
import { cn } from '@/lib/utils/cn';

interface TopSellingTableProps {
  items?: TopSellingItemData[];
  isLoading?: boolean;
}

export function TopSellingTable({ items = [], isLoading }: TopSellingTableProps) {
  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-4">
        <div className="h-5 w-40 bg-stone-200 dark:bg-zinc-800 rounded-md animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 w-full bg-stone-100 dark:bg-zinc-800/60 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-stone-900 dark:text-zinc-100">
              Menu Terlaris (Top Selling)
            </h3>
            <p className="text-xs text-stone-500">
              Peringkat menu dengan volume penjualan dan pendapatan tertinggi
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400">
          {items.length} Menu
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl">
          <UtensilsCrossed className="w-8 h-8 mx-auto text-stone-300 dark:text-zinc-700" />
          <p className="text-sm font-semibold text-stone-600 dark:text-zinc-400">
            Belum ada data penjualan pada periode ini
          </p>
          <p className="text-xs text-stone-400">
            Coba ubah filter rentang tanggal untuk melihat data historis lainnya.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-zinc-800 text-xs font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3">Nama Menu</th>
                <th className="py-3 px-3 text-right">Qty Terjual</th>
                <th className="py-3 px-3 text-right">Total Pendapatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/60">
              {items.map((item, index) => {
                const rank = index + 1;
                return (
                  <tr
                    key={item.menuItemId || index}
                    className="hover:bg-stone-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold font-mono',
                          rank === 1 && 'bg-amber-400 text-stone-950 ring-2 ring-amber-400/30',
                          rank === 2 && 'bg-stone-300 dark:bg-zinc-600 text-stone-900 dark:text-zinc-100',
                          rank === 3 && 'bg-amber-700 text-white',
                          rank > 3 && 'bg-stone-100 dark:bg-zinc-800 text-stone-500'
                        )}
                      >
                        {rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-900 dark:text-zinc-100">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-stone-700 dark:text-zinc-300">
                      {item.totalQuantitySold}{' '}
                      <span className="text-xs text-stone-400 font-normal">porsi</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatRupiah(item.totalRevenue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
