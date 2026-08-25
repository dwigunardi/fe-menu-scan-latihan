'use client';

import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Grid2X2,
  UtensilsCrossed,
  BookOpen,
  BarChart3,
  ArrowRight,
  Sparkles,
  Clock,
} from 'lucide-react';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/lib/constants/roles';
import { useAdminDashboardOverviewQuery } from '@/hooks/queries/use-admin-reports';
import { formatRupiah } from '@/lib/utils/format-currency';
import { formatDateTimeIndo } from '@/lib/utils/date-helpers';
import { cn } from '@/lib/utils/cn';

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboardOverviewQuery();

  const kpi = data?.kpi;
  const recentOrders = data?.recentOrders || [];
  const topSellingToday = data?.topSellingToday || [];

  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <div className="space-y-8 pb-12">
        {/* Title & Hub Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
              Dashboard Omset & Operasional
            </h1>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
              Ringkasan performa penjualan dan status operasional Kumpul Cafe hari ini.
            </p>
          </div>

          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-xs transition-all w-fit"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Lihat Laporan Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 animate-pulse space-y-3"
              >
                <div className="h-4 w-24 bg-stone-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-8 w-32 bg-stone-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-3 w-28 bg-stone-100 dark:bg-zinc-800/60 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Omset Hari Ini */}
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-2 relative overflow-hidden shadow-xs hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Omset Hari Ini</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-stone-900 dark:text-zinc-100">
                {formatRupiah(kpi?.todayRevenue ?? 0)}
              </p>
              <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Transaksi lunas hari ini
              </span>
            </div>

            {/* Total Pesanan Hari Ini */}
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-2 relative overflow-hidden shadow-xs hover:border-blue-500/40 transition-colors">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Pesanan</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-stone-900 dark:text-zinc-100">
                {kpi?.todayOrdersCount ?? 0}{' '}
                <span className="text-sm font-normal text-stone-500">Pesanan</span>
              </p>
              <span className="text-[11px] font-medium text-stone-500">
                Volume pemesanan hari ini
              </span>
            </div>

            {/* Kapasitas Meja */}
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-2 relative overflow-hidden shadow-xs hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Kapasitas Meja</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Grid2X2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-stone-900 dark:text-zinc-100">
                {kpi?.tableOccupancy.occupiedTables ?? 0} / {kpi?.tableOccupancy.totalTables ?? 0}
              </p>
              <span className="text-[11px] font-semibold text-amber-600">
                {Math.round(kpi?.tableOccupancy.occupancyPercentage ?? 0)}% Tingkat Keterisian
              </span>
            </div>

            {/* Antrian KDS / Pesanan Aktif */}
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-2 relative overflow-hidden shadow-xs hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Antrian Dapur (KDS)</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <UtensilsCrossed className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-stone-900 dark:text-zinc-100">
                {kpi?.activeOrdersCount ?? 0}{' '}
                <span className="text-sm font-normal text-stone-500">Aktif</span>
              </p>
              <span className="text-[11px] font-medium text-stone-500">
                Sedang diproses / dimasak
              </span>
            </div>
          </div>
        )}

        {/* Live Overview Grid: Recent Orders & Top Selling */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-zinc-100">
                  Aktivitas Pesanan Terbaru
                </h3>
                <p className="text-xs text-stone-500">
                  Daftar transaksi pesanan masuk terakhir di Kumpul Cafe
                </p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>Semua Pesanan</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl">
                Belum ada transaksi pesanan terbaru hari ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-zinc-800 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">No. Pesanan</th>
                      <th className="py-2.5 px-3">Meja / Pelanggan</th>
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/60">
                    {recentOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3 px-3 font-mono font-semibold text-xs text-stone-900 dark:text-zinc-100">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-3 text-xs">
                          <span className="font-semibold text-stone-800 dark:text-zinc-200">
                            Meja {order.tableNumber || '-'}
                          </span>
                          {order.customerName && (
                            <span className="text-stone-400 block text-[11px]">
                              {order.customerName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs text-stone-500 whitespace-nowrap">
                          {formatDateTimeIndo(order.createdAt)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                              order.status === 'PAID' &&
                                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                              order.status === 'CANCELLED' &&
                                'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
                              order.status !== 'PAID' &&
                                order.status !== 'CANCELLED' &&
                                'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            )}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-xs text-stone-900 dark:text-zinc-100">
                          {formatRupiah(order.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Selling Today Preview (1 col) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-stone-900 dark:text-zinc-100">
                Menu Favorit Hari Ini
              </h3>
              <Link
                href="/admin/reports"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>Detail</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {topSellingToday.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl">
                Belum ada pesanan terjual hari ini.
              </div>
            ) : (
              <div className="space-y-3">
                {topSellingToday.map((item, idx) => (
                  <div
                    key={item.menuItemId || idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {item.totalQuantitySold} porsi terjual
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      {formatRupiah(item.totalRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Access Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/reports"
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:border-amber-500 transition-all space-y-2 group"
          >
            <BarChart3 className="h-6 w-6 text-amber-600" />
            <h3 className="font-bold text-base text-stone-900 dark:text-zinc-100 group-hover:text-amber-600">
              Laporan & Analitik Penjualan
            </h3>
            <p className="text-xs text-stone-500">
              Analisis tren omset, cetak laporan berkala, dan ekspor data penjualan ke CSV.
            </p>
          </Link>

          <Link
            href="/admin/menus"
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:border-amber-500 transition-all space-y-2 group"
          >
            <BookOpen className="h-6 w-6 text-amber-600" />
            <h3 className="font-bold text-base text-stone-900 dark:text-zinc-100 group-hover:text-amber-600">
              Katalog Menu & Variasi
            </h3>
            <p className="text-xs text-stone-500">
              Kelola kustomisasi topping, harga promo, dan stok ketersediaan menu secara live.
            </p>
          </Link>

          <Link
            href="/admin/tables"
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:border-emerald-500 transition-all space-y-2 group"
          >
            <Grid2X2 className="h-6 w-6 text-emerald-600" />
            <h3 className="font-bold text-base text-stone-900 dark:text-zinc-100 group-hover:text-emerald-600">
              Denah Meja & Kasir
            </h3>
            <p className="text-xs text-stone-500">
              Visual floor plan meja kafe dan tombol 1-tap reset sesi meja.
            </p>
          </Link>
        </div>
      </div>
    </RoleGuard>
  );
}
