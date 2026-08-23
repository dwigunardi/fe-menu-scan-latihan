'use client';

import { useMemo, DragEvent } from 'react';
import { OrderData, OrderStatus } from '@/lib/validations/order.schema';
import { formatCurrency } from '@/lib/utils/format-currency';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
  Clock,
  User,
  ChefHat,
  CheckCircle2,
  Receipt,
  AlertCircle,
  XCircle,
  Flame,
  GripVertical,
} from 'lucide-react';

interface OrderCardProps {
  order: OrderData;
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onOpenReceipt: (order: OrderData) => void;
  isPending?: boolean;
  onDragStart?: (e: DragEvent<HTMLDivElement>, order: OrderData) => void;
  onDragEnd?: (e: DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
  isMobile?: boolean;
}

/**
 * Smart relative time formatter that never overflows card width.
 */
function formatOrderTime(dateString: string): { label: string; elapsedMinutes: number } {
  const created = new Date(dateString).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - created) / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  let label = '';
  if (diffMin < 1) label = 'Baru saja';
  else if (diffMin < 60) label = `${diffMin} mnt lalu`;
  else if (diffHour < 24) label = `${diffHour} jam lalu`;
  else if (diffDay === 1) label = 'Kemarin';
  else if (diffDay < 7) label = `${diffDay} hr lalu`;
  else {
    const d = new Date(dateString);
    label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  return { label, elapsedMinutes: diffMin };
}

export function OrderCard({
  order,
  onUpdateStatus,
  onOpenReceipt,
  isPending,
  onDragStart,
  onDragEnd,
  isDragging,
  isMobile = false,
}: OrderCardProps) {
  const { label: timeLabel, elapsedMinutes } = useMemo(
    () => formatOrderTime(order.createdAt),
    [order.createdAt]
  );

  const fullDateTimeTooltip = useMemo(() => {
    try {
      const d = new Date(order.createdAt);
      const datePart = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `Waktu Pesanan: ${datePart} pukul ${timePart} WIB (${timeLabel})`;
    } catch {
      return `Waktu order: ${order.createdAt}`;
    }
  }, [order.createdAt, timeLabel]);

  const timerColor = useMemo(() => {
    if (order.status === 'PAID') {
      return 'text-stone-500 bg-stone-100 dark:bg-zinc-800 dark:text-zinc-400 border-stone-200 dark:border-zinc-700/60';
    }
    if (elapsedMinutes > 20) {
      return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 animate-pulse font-bold';
    }
    if (elapsedMinutes > 10) {
      return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60 font-semibold';
    }
    return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60';
  }, [elapsedMinutes, order.status]);

  const formattedTableNumber = useMemo(() => {
    const num = order.tableNumber.trim();
    if (num.toUpperCase().startsWith('MEJA')) {
      return num.toUpperCase();
    }
    return `MEJA ${num}`;
  }, [order.tableNumber]);

  return (
    <div
      draggable={!isPending && !isMobile}
      onDragStart={(e) => !isMobile && onDragStart?.(e, order)}
      onDragEnd={(e) => !isMobile && onDragEnd?.(e)}
      className={`rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden select-none group ${
        isMobile ? 'touch-pan-y cursor-default' : 'cursor-grab active:cursor-grabbing'
      } ${
        isDragging
          ? 'opacity-40 scale-[0.98] ring-2 ring-amber-500/50 border-amber-500/80 shadow-2xl rotate-1'
          : 'border-stone-200/90 dark:border-zinc-800 hover:border-amber-400/80 dark:hover:border-amber-500/50'
      }`}
    >
      {/* 1. Header Bar: Grip, Table Badge, and Time Badge */}
      <div className="p-3 border-b border-stone-100 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-900/70 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Table Badge with Drag Handle */}
          <div className="flex items-center gap-1.5 min-w-0">
            {!isMobile && (
              <SimpleTooltip content="Geser kartu untuk memindahkan status" side="top">
                <div
                  className="text-stone-300 dark:text-zinc-600 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors shrink-0 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
              </SimpleTooltip>
            )}
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-black text-xs tracking-wider uppercase shrink-0">
              {formattedTableNumber}
              {order.zoneName && (
                <span className="ml-1.5 font-semibold text-[10px] text-amber-600/80 dark:text-amber-300/80 lowercase">
                  • {order.zoneName}
                </span>
              )}
            </span>
          </div>

          {/* Elapsed Timer Pill */}
          <SimpleTooltip content={fullDateTimeTooltip} side="top">
            <div
              className={`px-2 py-0.5 rounded-lg text-[10.5px] border flex items-center gap-1 shrink-0 font-medium cursor-default ${timerColor}`}
            >
              <Clock className="h-3 w-3 shrink-0" />
              <span className="whitespace-nowrap">{timeLabel}</span>
            </div>
          </SimpleTooltip>
        </div>

        {/* Customer Name & Order ID Info */}
        <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
          <div className="flex items-center gap-1.5 min-w-0 font-bold text-stone-800 dark:text-zinc-200 truncate">
            <User className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">{order.customerName}</span>
          </div>
          <span className="font-mono text-[10.5px] text-stone-400 dark:text-zinc-500 shrink-0">
            {order.orderNumber}
          </span>
        </div>
      </div>

      {/* 2. Order Items List with Quantities, Variants & Cooking Notes */}
      <div className="p-3 space-y-2 flex-1 divide-y divide-stone-100 dark:divide-zinc-800/60">
        {order.orderItems.map((item, idx) => (
          <div key={item.id || idx} className={idx > 0 ? 'pt-2' : ''}>
            <div className="flex items-start justify-between gap-2 text-xs">
              <div className="font-semibold text-stone-900 dark:text-zinc-100 flex items-start gap-1.5 min-w-0 flex-1">
                <span className="h-5 px-1.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 font-extrabold flex items-center justify-center text-[11px] shrink-0">
                  {item.quantity}x
                </span>
                <span className="leading-snug break-words">{item.menuName}</span>
              </div>
              <span className="font-bold text-stone-600 dark:text-zinc-400 shrink-0 text-right whitespace-nowrap pl-1 font-mono">
                {formatCurrency(item.subtotal)}
              </span>
            </div>

            {/* Selected Variants */}
            {item.selectedVariants && item.selectedVariants.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 ml-6">
                {item.selectedVariants.map((v, vIdx) => (
                  <span
                    key={v.id || vIdx}
                    className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800/80 text-stone-600 dark:text-zinc-300 border border-stone-200/50 dark:border-zinc-700/50"
                  >
                    {v.groupName}: {v.optionName}
                    {v.extraPrice > 0 && ` (+${formatCurrency(v.extraPrice)})`}
                  </span>
                ))}
              </div>
            )}

            {/* Special Customer Notes */}
            {item.notes && (
              <div className="mt-1 ml-6 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-[10.5px] flex items-start gap-1.5 font-medium leading-tight">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span className="break-words">Catatan: {item.notes}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Footer: Total Amount & Status Action Buttons */}
      <div className="p-3 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-900/50 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-stone-500 dark:text-zinc-400 font-medium whitespace-nowrap">Total Tagihan:</span>
          <span className="font-black text-amber-700 dark:text-amber-400 text-sm whitespace-nowrap font-mono">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {order.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
                className="flex-1 text-[11px] h-8.5 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/60 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Tolak
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => onUpdateStatus(order.id, 'PREPARING')}
                className="flex-2 text-[11px] h-8.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-xs"
              >
                <Flame className="h-3.5 w-3.5 mr-1" />
                Mulai Masak
              </Button>
            </>
          )}

          {order.status === 'PREPARING' && (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => onUpdateStatus(order.id, 'SERVED')}
              className="w-full text-[11px] h-8.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
            >
              <ChefHat className="h-3.5 w-3.5 mr-1" />
              Sajikan ke Meja
            </Button>
          )}

          {order.status === 'SERVED' && (
            <div className="flex items-center gap-1.5 w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenReceipt(order)}
                className="flex-1 text-[11px] h-8.5 rounded-xl border-stone-300 dark:border-zinc-700 cursor-pointer hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                <Receipt className="h-3.5 w-3.5 mr-1" />
                Struk
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => onUpdateStatus(order.id, 'PAID')}
                className="flex-2 text-[11px] h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Bayar & Selesai
              </Button>
            </div>
          )}

          {order.status === 'PAID' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenReceipt(order)}
              className="w-full text-[11px] h-8.5 rounded-xl text-stone-600 dark:text-zinc-300 border-stone-200 dark:border-zinc-800 cursor-pointer hover:bg-stone-100 dark:hover:bg-zinc-800"
            >
              <Receipt className="h-3.5 w-3.5 mr-1 text-amber-600 dark:text-amber-400" />
              Lihat Struk Pembayaran
            </Button>
          )}

          {order.status === 'CANCELLED' && (
            <span className="w-full py-1 text-center text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
              Pesanan Dibatalkan
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
