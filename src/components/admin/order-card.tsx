'use client';

import { useMemo } from 'react';
import { OrderData, OrderStatus } from '@/lib/validations/order.schema';
import { formatCurrency } from '@/lib/utils/format-currency';
import { Button } from '@/components/ui/button';
import {
  Clock,
  User,
  ChefHat,
  CheckCircle2,
  Receipt,
  AlertCircle,
  XCircle,
  Flame,
} from 'lucide-react';

interface OrderCardProps {
  order: OrderData;
  onUpdateStatus: (id: string, newStatus: OrderStatus) => void;
  onOpenReceipt: (order: OrderData) => void;
  isPending?: boolean;
}

export function OrderCard({
  order,
  onUpdateStatus,
  onOpenReceipt,
  isPending,
}: OrderCardProps) {
  // Elapsed time calculation
  const elapsedMinutes = useMemo(() => {
    const created = new Date(order.createdAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - created) / 60000));
  }, [order.createdAt]);

  const timerColor = useMemo(() => {
    if (order.status === 'PAID') return 'text-stone-400 bg-stone-100 dark:bg-zinc-800';
    if (elapsedMinutes > 15) return 'text-red-700 bg-red-100 dark:bg-red-950/60 animate-pulse font-bold';
    if (elapsedMinutes > 8) return 'text-amber-700 bg-amber-100 dark:bg-amber-950/60 font-semibold';
    return 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60';
  }, [elapsedMinutes, order.status]);

  return (
    <div className="rounded-2xl border border-stone-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      {/* Card Header: Table Badge, Order Number & Elapsed Timer */}
      <div className="p-3.5 border-b border-stone-100 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2.5 py-1 rounded-xl bg-amber-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-xs">
            {order.tableNumber.toUpperCase().startsWith('MEJA')
              ? order.tableNumber.toUpperCase()
              : `MEJA ${order.tableNumber}`}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-900 dark:text-zinc-100 truncate">
              {order.orderNumber}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400 flex items-center gap-1 truncate">
              <User className="h-3 w-3 text-stone-400" />
              {order.customerName}
            </p>
          </div>
        </div>

        {/* Elapsed Timer Pill */}
        <div className={`px-2 py-0.5 rounded-lg text-[11px] flex items-center gap-1 shrink-0 ${timerColor}`}>
          <Clock className="h-3 w-3" />
          <span>{elapsedMinutes} mnt lalu</span>
        </div>
      </div>

      {/* Card Body: Ordered Items with Variants & Notes */}
      <div className="p-3.5 space-y-2.5 flex-1 divide-y divide-stone-100 dark:divide-zinc-800/60">
        {order.orderItems.map((item, idx) => (
          <div key={item.id || idx} className={idx > 0 ? 'pt-2' : ''}>
            <div className="flex items-start justify-between gap-2 text-xs">
              <div className="font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 font-extrabold flex items-center justify-center text-[11px]">
                  {item.quantity}x
                </span>
                <span>{item.menuName}</span>
              </div>
              <span className="font-semibold text-stone-600 dark:text-zinc-400 shrink-0">
                {formatCurrency(item.subtotal)}
              </span>
            </div>

            {/* Variants Pills */}
            {item.selectedVariants && item.selectedVariants.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 ml-6.5">
                {item.selectedVariants.map((v, vIdx) => (
                  <span
                    key={v.id || vIdx}
                    className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border border-stone-200/50 dark:border-zinc-700/50"
                  >
                    {v.groupName}: {v.optionName}
                    {v.extraPrice > 0 && ` (+${formatCurrency(v.extraPrice)})`}
                  </span>
                ))}
              </div>
            )}

            {/* Special Cooking Notes Highlight */}
            {item.notes && (
              <div className="mt-1 ml-6.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] flex items-center gap-1 font-medium">
                <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" />
                <span>Catatan: {item.notes}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Card Footer: Total Amount & Status Transitions */}
      <div className="p-3 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/40 dark:bg-zinc-900/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500 dark:text-zinc-400">Total Tagihan:</span>
          <span className="font-extrabold text-amber-700 dark:text-amber-400 text-sm">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          {order.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
                className="flex-1 text-[11px] h-8 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Tolak
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => onUpdateStatus(order.id, 'PREPARING')}
                className="flex-2 text-[11px] h-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
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
              className="w-full text-[11px] h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
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
                className="flex-1 text-[11px] h-8 rounded-xl border-stone-300 dark:border-zinc-700"
              >
                <Receipt className="h-3.5 w-3.5 mr-1" />
                Struk
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => onUpdateStatus(order.id, 'PAID')}
                className="flex-2 text-[11px] h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
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
              className="w-full text-[11px] h-8 rounded-xl text-stone-600 dark:text-zinc-300"
            >
              <Receipt className="h-3.5 w-3.5 mr-1" />
              Lihat Struk Pembayaran
            </Button>
          )}

          {order.status === 'CANCELLED' && (
            <span className="w-full py-1 text-center text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 rounded-xl">
              Pesanan Dibatalkan
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
