'use client';

import { useState, useMemo, useEffect, useRef, DragEvent } from 'react';
import {
  useAdminOrdersPaginatedQuery,
  useUpdateOrderStatusMutation,
} from '@/hooks/queries/use-admin-orders';
import { OrderData, OrderStatus } from '@/lib/validations/order.schema';
import { formatCurrency } from '@/lib/utils/format-currency';
import { playOrderChime } from '@/lib/utils/audio-chime';
import { OrderCard } from './order-card';
import { OrderReceiptModal } from './order-receipt-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
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
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface KanbanColumnConfig {
  status: OrderStatus;
  title: string;
  icon: typeof BellRing;
  badgeBg: string;
  emptyText: string;
  activeBorderColor: string;
  activeBgColor: string;
  accentTextColor: string;
  iconBgColor: string;
}

const kanbanColumns: KanbanColumnConfig[] = [
  {
    status: 'PENDING',
    title: 'Pesanan Masuk',
    icon: BellRing,
    badgeBg: 'bg-amber-500 text-white',
    emptyText: 'Tidak ada pesanan baru',
    activeBorderColor: 'border-amber-500 ring-2 ring-amber-500/20',
    activeBgColor: 'bg-amber-50/50 dark:bg-amber-950/20',
    accentTextColor: 'text-amber-600',
    iconBgColor: 'bg-amber-500/10 text-amber-600',
  },
  {
    status: 'PREPARING',
    title: 'Sedang Dimasak',
    icon: Flame,
    badgeBg: 'bg-blue-600 text-white',
    emptyText: 'Dapur sedang santai',
    activeBorderColor: 'border-blue-500 ring-2 ring-blue-500/20',
    activeBgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
    accentTextColor: 'text-blue-600',
    iconBgColor: 'bg-blue-500/10 text-blue-600',
  },
  {
    status: 'SERVED',
    title: 'Siap Saji',
    icon: ChefHat,
    badgeBg: 'bg-emerald-600 text-white',
    emptyText: 'Semua telah disajikan',
    activeBorderColor: 'border-emerald-500 ring-2 ring-emerald-500/20',
    activeBgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    accentTextColor: 'text-emerald-600',
    iconBgColor: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    status: 'PAID',
    title: 'Selesai / Lunas',
    icon: CheckCircle2,
    badgeBg: 'bg-stone-600 text-white',
    emptyText: 'Belum ada transaksi lunas',
    activeBorderColor: 'border-stone-500 ring-2 ring-stone-500/20',
    activeBgColor: 'bg-stone-100/60 dark:bg-zinc-900/60',
    accentTextColor: 'text-stone-700 dark:text-zinc-300',
    iconBgColor: 'bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300',
  },
];

interface OrdersViewProps {
  pageTitle?: string;
  pageSubtitle?: string;
}

export function OrdersView({
  pageTitle = 'Kitchen Display System (KDS)',
  pageSubtitle = 'Pantau dan kelola antrean pesanan dapur secara real-time.',
}: OrdersViewProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [mobileActiveTab, setMobileActiveTab] = useState<OrderStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Drag and Drop States
  const [draggedOrder, setDraggedOrder] = useState<OrderData | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<OrderStatus | null>(null);

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
      .reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);

    return {
      totalOrders,
      pendingCount,
      preparingCount,
      servedCount,
      paidCount,
      totalRevenue,
    };
  }, [orders, pendingOrders.length, preparingOrders.length, servedOrders.length, paidOrders.length]);

  const handleUpdateStatus = (id: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleOpenReceipt = (order: OrderData) => {
    setSelectedOrderForReceipt(order);
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, order: OrderData) => {
    setDraggedOrder(order);
    e.dataTransfer.setData('text/plain', JSON.stringify({ orderId: order.id, status: order.status }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedOrder(null);
    setActiveDropZone(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, targetStatus: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropZone !== targetStatus) {
      setActiveDropZone(targetStatus);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setActiveDropZone(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetStatus: OrderStatus) => {
    e.preventDefault();
    let orderToUpdate = draggedOrder;

    if (!orderToUpdate) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.orderId) {
            orderToUpdate = orders.find((o) => o.id === parsed.orderId) || null;
          }
        }
      } catch (e) {
        console.error('Failed to parse dragged order:', e);
      }
    }

    if (orderToUpdate && orderToUpdate.status !== targetStatus) {
      handleUpdateStatus(orderToUpdate.id, targetStatus);
    }
    setDraggedOrder(null);
    setActiveDropZone(null);
  };

  const getOrdersForColumn = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return pendingOrders;
      case 'PREPARING':
        return preparingOrders;
      case 'SERVED':
        return servedOrders;
      case 'PAID':
        return paidOrders;
      default:
        return [];
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-zinc-50 flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-amber-600 shrink-0" />
              <span className="whitespace-nowrap">{pageTitle}</span>
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
              <Sparkles className="h-3 w-3" /> Live Kanban
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
            {pageSubtitle}
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex justify-end items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Sound Toggle */}
          <SimpleTooltip content={isSoundEnabled ? 'Suara Bel Aktif' : 'Suara Bel Dibisukan'} side="bottom">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`h-9 px-3 rounded-xl border-stone-200 dark:border-zinc-800 ${isSoundEnabled
                ? 'text-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
                : 'text-stone-400'
                }`}
            >
              {isSoundEnabled ? (
                <Volume2 className="h-4 w-4 mr-1.5 text-amber-600" />
              ) : (
                <VolumeX className="h-4 w-4 mr-1.5 text-stone-400" />
              )}
              <span className="text-xs font-semibold">
                {isSoundEnabled ? 'Bel Aktif' : 'Mute'}
              </span>
            </Button>
          </SimpleTooltip>

          {/* View Mode Toggle: Kanban vs Table */}
          <div className="flex items-center bg-stone-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-stone-200/80 dark:border-zinc-700/80">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'kanban'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-zinc-200'
                }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'table'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-zinc-200'
                }`}
            >
              <List className="h-3.5 w-3.5" />
              Tabel
            </button>
          </div>

          {/* Refresh Button */}
          <SimpleTooltip content="Muat Ulang Pesanan" side="bottom">
            <Button
              size="icon"
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-9 w-9 rounded-xl border-stone-200 dark:border-zinc-800"
            >
              <RotateCw
                className={`h-4 w-4 text-stone-600 dark:text-zinc-300 ${isRefetching ? 'animate-spin' : ''
                  }`}
              />
            </Button>
          </SimpleTooltip>
        </div>
      </div>

      {/* Summary Metrics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Orders */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider truncate">
              Total Pesanan
            </p>
            <p className="text-lg font-bold text-stone-900 dark:text-zinc-100">
              {metrics.totalOrders}
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider truncate">
              Pesanan Masuk
            </p>
            <p className="text-lg font-bold text-amber-600">
              {metrics.pendingCount}
            </p>
          </div>
        </div>

        {/* Preparing Cooking Orders */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-blue-200/80 dark:border-blue-900/40 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider truncate">
              Sedang Dimasak
            </p>
            <p className="text-lg font-bold text-blue-600">
              {metrics.preparingCount}
            </p>
          </div>
        </div>

        {/* Served Orders */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider truncate">
              Siap Saji
            </p>
            <p className="text-lg font-bold text-emerald-600">
              {metrics.servedCount}
            </p>
          </div>
        </div>

        {/* Total Paid Today Revenue */}
        <div className="col-span-2 md:col-span-2 xl:col-span-1 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
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
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-stone-200/80 dark:border-zinc-800">
        <div className="relative w-full md:w-72 lg:w-80 shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Cari no. pesanan atau nama tamu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-stone-50 dark:bg-zinc-800 border-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${isActive
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
        <div className="space-y-4">
          {/* MOBILE VIEW */}
          <div className="sm:hidden space-y-4">
            <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 dark:bg-zinc-800/80 rounded-2xl border border-stone-200/80 dark:border-zinc-700/80">
              {kanbanColumns.map((col) => {
                const count = getOrdersForColumn(col.status).length;
                const isActive = mobileActiveTab === col.status;
                const Icon = col.icon;
                return (
                  <button
                    key={col.status}
                    type="button"
                    onClick={() => setMobileActiveTab(col.status)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-500 shadow-xs font-bold'
                        : 'text-stone-500 hover:text-stone-900 dark:text-zinc-400'
                    }`}
                  >
                    <div className="relative">
                      <Icon className="h-4 w-4 mb-0.5" />
                      {count > 0 && (
                        <span
                          className={`absolute -top-1.5 -right-3 text-[9px] font-extrabold px-1 rounded-full ${
                            isActive
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-300 dark:bg-zinc-700 text-stone-800 dark:text-zinc-200'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] leading-tight truncate w-full">{col.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {(() => {
              const activeCol = kanbanColumns.find((c) => c.status === mobileActiveTab) || kanbanColumns[0];
              const columnOrders = getOrdersForColumn(activeCol.status);
              const Icon = activeCol.icon;

              return (
                <div className="rounded-3xl p-3.5 border bg-stone-100/70 dark:bg-zinc-950 border-stone-200/80 dark:border-zinc-800/80 space-y-3 w-full">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${activeCol.iconBgColor}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="text-xs font-bold text-stone-800 dark:text-zinc-200 uppercase tracking-wider">
                        {activeCol.title}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg font-extrabold text-xs ${activeCol.badgeBg}`}>
                      {columnOrders.length} Pesanan
                    </span>
                  </div>

                  <div className="space-y-3">
                    {columnOrders.length === 0 ? (
                      <div className="py-16 text-center text-stone-400 dark:text-zinc-600 text-xs font-medium border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl">
                        {activeCol.emptyText}
                      </div>
                    ) : (
                      columnOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onUpdateStatus={handleUpdateStatus}
                          onOpenReceipt={handleOpenReceipt}
                          isPending={updateStatusMutation.isPending}
                          isMobile={true}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* TABLET & DESKTOP MULTI-COLUMN KANBAN BOARD */}
          <div className="hidden sm:flex xl:grid xl:grid-cols-4 gap-4 items-start overflow-x-auto pb-4 pt-1 no-scrollbar sm:scrollbar-thin">
            {kanbanColumns.map((col) => {
              const columnOrders = getOrdersForColumn(col.status);
              const Icon = col.icon;
              const isHovered = activeDropZone === col.status;
              const isDifferentStatus = draggedOrder && draggedOrder.status !== col.status;

              return (
                <div
                  key={col.status}
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.status)}
                  className={`w-[290px] sm:w-[320px] xl:w-auto shrink-0 xl:shrink rounded-3xl p-3.5 border transition-all duration-200 space-y-3 ${isHovered && isDifferentStatus
                    ? `${col.activeBorderColor} ${col.activeBgColor} scale-[1.01] shadow-lg`
                    : 'bg-stone-100/70 dark:bg-zinc-950 border-stone-200/80 dark:border-zinc-800/80'
                    }`}
                >
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${col.iconBgColor}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="text-xs font-bold text-stone-800 dark:text-zinc-200 uppercase tracking-wider">
                        {col.title}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg font-extrabold text-[11px] ${col.badgeBg}`}>
                      {columnOrders.length}
                    </span>
                  </div>

                  {isHovered && isDifferentStatus && (
                    <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-dashed border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold animate-pulse shadow-xs">
                      <ArrowRight className="h-4 w-4" />
                      <span>Lepaskan untuk pindah ke {col.title}</span>
                    </div>
                  )}

                  <div className="space-y-3 min-h-[160px] max-h-[720px] overflow-y-auto pr-1">
                    {columnOrders.length === 0 ? (
                      <div className="py-12 text-center text-stone-400 dark:text-zinc-600 text-xs font-medium border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl">
                        {col.emptyText}
                      </div>
                    ) : (
                      columnOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onUpdateStatus={handleUpdateStatus}
                          onOpenReceipt={handleOpenReceipt}
                          isPending={updateStatusMutation.isPending}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedOrder?.id === order.id}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
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
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          {order.orderItems.map((item, idx) => (
                            <span key={idx} className="text-stone-800 dark:text-zinc-200">
                              <span className="font-bold">{item.quantity}x</span> {item.menuName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-amber-700 dark:text-amber-400">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${order.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                            : order.status === 'PREPARING'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                              : order.status === 'SERVED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : order.status === 'PAID'
                                  ? 'bg-stone-100 text-stone-800 dark:bg-zinc-800 dark:text-zinc-300'
                                  : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-400">
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
                          className="h-7 text-xs text-amber-700 hover:text-amber-800"
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

      {/* Order Receipt Thermal Modal */}
      <OrderReceiptModal
        order={selectedOrderForReceipt}
        isOpen={Boolean(selectedOrderForReceipt)}
        onClose={() => setSelectedOrderForReceipt(null)}
      />
    </div>
  );
}
