'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  useAdminOrdersPaginatedQuery,
  useUpdateOrderStatusMutation,
} from '@/hooks/queries/use-admin-orders';
import { OrderData, OrderStatus } from '@/lib/validations/order.schema';
import { formatCurrency } from '@/lib/utils/format-currency';
import { playOrderChime } from '@/lib/utils/audio-chime';
import { OrderCard } from '@/components/admin/order-card';
import { OrderReceiptModal } from '@/components/admin/order-receipt-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Flame,
  ChefHat,
  BellRing,
  CheckCircle2,
  Receipt,
  Search,
  Volume2,
  VolumeX,
  LayoutGrid,
  List,
  RotateCw,
  Clock,
  CircleDollarSign,
  ShoppingBag,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Selected Order for Receipt Modal
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] =
    useState<OrderData | null>(null);

  // Fetch paginated live orders
  const {
    data: paginatedData,
    isLoading,
    isRefetching,
    refetch,
  } = useAdminOrdersPaginatedQuery({
    limit: 100,
    search: search.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const updateStatusMutation = useUpdateOrderStatusMutation();

  const orders = paginatedData?.items || [];

  // Track pending orders count to trigger chime on new incoming orders
  const prevPendingCountRef = useRef<number>(0);

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'PENDING'),
    [orders]
  );
  const preparingOrders = useMemo(
    () => orders.filter((o) => o.status === 'PREPARING'),
    [orders]
  );
  const servedOrders = useMemo(
    () => orders.filter((o) => o.status === 'SERVED'),
    [orders]
  );
  const paidOrders = useMemo(
    () => orders.filter((o) => o.status === 'PAID'),
    [orders]
  );

  useEffect(() => {
    const currentPendingCount = pendingOrders.length;
    if (
      isSoundEnabled &&
      currentPendingCount > prevPendingCountRef.current &&
      prevPendingCountRef.current !== 0
    ) {
      playOrderChime();
    }
    prevPendingCountRef.current = currentPendingCount;
  }, [pendingOrders.length, isSoundEnabled]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const pendingCount = pendingOrders.length;
    const preparingCount = preparingOrders.length;
    const servedCount = servedOrders.length;
    const paidCount = paidOrders.length;

    const totalRevenue = orders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      totalOrders,
      pendingCount,
      preparingCount,
      servedCount,
      paidCount,
      totalRevenue,
    };
  }, [orders, pendingOrders, preparingOrders, servedOrders, paidOrders]);

  const handleUpdateStatus = (id: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleOpenReceipt = (order: OrderData) => {
    setSelectedOrderForReceipt(order);
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-zinc-50">
              Kitchen Display & Pesanan
            </h1>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
            Pantau antrean pesanan dapur, barista, dan kasir secara real-time.
          </p>
        </div>

        {/* Action Buttons: Sound, View Switcher, Refresh */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="h-9 px-3 rounded-xl border-stone-200 dark:border-zinc-800 text-xs"
            title={isSoundEnabled ? 'Suara Bel Aktif' : 'Suara Bel Dibisukan'}
          >
            {isSoundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-emerald-600 mr-1.5" />
                <span className="hidden sm:inline">Bel Aktif</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-stone-400 mr-1.5" />
                <span className="hidden sm:inline">Bisu</span>
              </>
            )}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-stone-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:text-zinc-400'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban KDS</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-amber-600 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:text-zinc-400'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Tabel Riwayat</span>
            </button>
          </div>

          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 w-9 p-0 rounded-xl"
            title="Refresh Data"
          >
            <RotateCw
              className={`h-4 w-4 text-stone-600 dark:text-zinc-300 ${
                isRefetching ? 'animate-spin' : ''
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Summary Metrics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Orders */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Total Pesanan
            </p>
            <p className="text-lg font-bold text-stone-900 dark:text-zinc-100">
              {metrics.totalOrders}
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Pesanan Masuk
            </p>
            <p className="text-lg font-bold text-amber-600">
              {metrics.pendingCount}
            </p>
          </div>
        </div>

        {/* Preparing Cooking Orders */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-blue-200/80 dark:border-blue-900/40 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Sedang Dimasak
            </p>
            <p className="text-lg font-bold text-blue-600">
              {metrics.preparingCount}
            </p>
          </div>
        </div>

        {/* Served Orders */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Siap Saji
            </p>
            <p className="text-lg font-bold text-emerald-600">
              {metrics.servedCount}
            </p>
          </div>
        </div>

        {/* Total Paid Today Revenue */}
        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider truncate">
              Omzet Lunas
            </p>
            <p className="text-base font-extrabold text-stone-900 dark:text-zinc-100 truncate">
              {formatCurrency(metrics.totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-stone-200/80 dark:border-zinc-800">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Cari no. pesanan atau nama tamu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-stone-50 dark:bg-zinc-800 border-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'PENDING', 'PREPARING', 'SERVED', 'PAID'].map((status) => {
            const labels: Record<string, string> = {
              ALL: 'Semua',
              PENDING: 'Masuk',
              PREPARING: 'Dimasak',
              SERVED: 'Siap Saji',
              PAID: 'Lunas',
            };
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200'
                }`}
              >
                {labels[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: KANBAN VIEW or TABLE VIEW */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-600 border-t-transparent" />
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
              Memuat Antrean Pesanan...
            </p>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD 4 COLUMNS */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {/* 1. Kolom PENDING */}
          <div className="rounded-3xl bg-stone-100/70 dark:bg-zinc-950 p-3.5 border border-stone-200/80 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <BellRing className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold text-stone-800 dark:text-zinc-200 uppercase tracking-wider">
                  Pesanan Masuk
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white font-extrabold text-[11px]">
                {pendingOrders.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[150px]">
              {pendingOrders.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs font-medium border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl">
                  Tidak ada pesanan baru
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onOpenReceipt={handleOpenReceipt}
                    isPending={updateStatusMutation.isPending}
                  />
                ))
              )}
            </div>
          </div>

          {/* 2. Kolom PREPARING */}
          <div className="rounded-3xl bg-stone-100/70 dark:bg-zinc-950 p-3.5 border border-stone-200/80 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Flame className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold text-stone-800 dark:text-zinc-200 uppercase tracking-wider">
                  Sedang Dimasak
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-extrabold text-[11px]">
                {preparingOrders.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[150px]">
              {preparingOrders.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs font-medium border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl">
                  Dapur sedang santai
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onOpenReceipt={handleOpenReceipt}
                    isPending={updateStatusMutation.isPending}
                  />
                ))
              )}
            </div>
          </div>

          {/* 3. Kolom SERVED */}
          <div className="rounded-3xl bg-stone-100/70 dark:bg-zinc-950 p-3.5 border border-stone-200/80 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ChefHat className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold text-stone-800 dark:text-zinc-200 uppercase tracking-wider">
                  Siap Saji
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-extrabold text-[11px]">
                {servedOrders.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[150px]">
              {servedOrders.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs font-medium border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl">
                  Semua telah disajikan
                </div>
              ) : (
                servedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onOpenReceipt={handleOpenReceipt}
                    isPending={updateStatusMutation.isPending}
                  />
                ))
              )}
            </div>
          </div>

          {/* 4. Kolom PAID */}
          <div className="rounded-3xl bg-stone-100/70 dark:bg-zinc-950 p-3.5 border border-stone-200/80 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold text-stone-800 dark:text-zinc-200 uppercase tracking-wider">
                  Selesai / Lunas
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-stone-600 text-white font-extrabold text-[11px]">
                {paidOrders.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[150px] max-h-[700px] overflow-y-auto pr-1">
              {paidOrders.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs font-medium border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl">
                  Belum ada pesanan lunas
                </div>
              ) : (
                paidOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onOpenReceipt={handleOpenReceipt}
                    isPending={updateStatusMutation.isPending}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TABLE AUDIT VIEW */
        <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-zinc-800/60 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-bold">No. Pesanan</th>
                  <th className="py-3 px-4 font-bold">Meja</th>
                  <th className="py-3 px-4 font-bold">Tamu</th>
                  <th className="py-3 px-4 font-bold">Menu Pesanan</th>
                  <th className="py-3 px-4 font-bold">Total</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Waktu</th>
                  <th className="py-3 px-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/60 font-medium">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-400">
                      Tidak ada data pesanan yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-stone-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-zinc-100">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-bold text-[11px]">
                          {order.tableNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700 dark:text-zinc-300">
                        {order.customerName}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-stone-600 dark:text-zinc-400">
                        {order.orderItems
                          .map((i) => `${i.quantity}x ${i.menuName}`)
                          .join(', ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-700 dark:text-amber-400">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            order.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : order.status === 'PREPARING'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : order.status === 'SERVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : order.status === 'PAID'
                              ? 'bg-stone-100 text-stone-800 dark:bg-zinc-800 dark:text-zinc-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-400 text-[11px]">
                        {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenReceipt(order)}
                          className="h-8 px-2.5 text-xs text-stone-600 hover:text-amber-600"
                        >
                          <Receipt className="h-3.5 w-3.5 mr-1" />
                          Struk
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt Modal Preview & Thermal Printer */}
      <OrderReceiptModal
        isOpen={Boolean(selectedOrderForReceipt)}
        onClose={() => setSelectedOrderForReceipt(null)}
        order={selectedOrderForReceipt}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
