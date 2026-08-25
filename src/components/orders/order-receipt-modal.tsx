'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OrderData, OrderStatus } from '@/lib/validations/order.schema';
import { formatCurrency } from '@/lib/utils/format-currency';
import { Printer, CheckCircle2, Coffee } from 'lucide-react';

interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: OrderData | null;
  onUpdateStatus?: (id: string, newStatus: OrderStatus) => void;
}

export function OrderReceiptModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
}: OrderReceiptModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = order.status === 'PAID';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800">
        <DialogHeader className="sr-only">
          <DialogTitle>Struk Pembayaran {order.orderNumber}</DialogTitle>
        </DialogHeader>

        {/* Printable Thermal Receipt Card (58mm / 80mm Simulation) */}
        <div id="thermal-receipt" className="p-5 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 font-mono text-xs text-stone-800 dark:text-zinc-200 space-y-3 print:border-none print:p-0 print:m-0">
          {/* Header */}
          <div className="text-center space-y-1 pb-2 border-b border-dashed border-stone-300 dark:border-zinc-700">
            <div className="flex items-center justify-center gap-1.5 font-bold text-sm tracking-wider uppercase">
              <Coffee className="h-4 w-4 text-amber-600" />
              <span>KUMPUL CAFE & RESTO</span>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-zinc-400">
              Jl. Kopi Sejahtera No. 88, Kota Kafe
            </p>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500">
              Telp: 0812-3456-7890
            </p>
          </div>

          {/* Meta Information */}
          <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-stone-300 dark:border-zinc-700">
            <div className="flex justify-between">
              <span className="text-stone-500">No. Pesanan:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Meja:</span>
              <span className="font-bold">
                {order.tableNumber.toUpperCase().startsWith('MEJA')
                  ? order.tableNumber.toUpperCase()
                  : `MEJA ${order.tableNumber}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Pelanggan:</span>
              <span className="font-bold">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Waktu:</span>
              <span>{new Date(order.createdAt).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Status Pembayaran:</span>
              <span
                className={`font-bold ${
                  isPaid ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {isPaid ? 'LUNAS (PAID)' : 'BELUM DIBAYAR'}
              </span>
            </div>
          </div>

          {/* Itemized Order Breakdown */}
          <div className="space-y-2 pb-2 border-b border-dashed border-stone-300 dark:border-zinc-700">
            {order.orderItems.map((item, idx) => (
              <div key={item.id || idx} className="space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span>
                    {item.quantity}x {item.menuName}
                  </span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
                {item.selectedVariants && item.selectedVariants.length > 0 && (
                  <div className="text-[10px] text-stone-500 dark:text-zinc-400 pl-3">
                    {item.selectedVariants
                      .map(
                        (v) =>
                          `${v.optionName}${
                            v.extraPrice > 0 ? ` (+${formatCurrency(v.extraPrice)})` : ''
                          }`
                      )
                      .join(', ')}
                  </div>
                )}
                {item.notes && (
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 italic pl-3">
                    Catatan: {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs pt-1">
            <div className="flex justify-between font-extrabold text-sm text-stone-900 dark:text-zinc-100">
              <span>TOTAL TAGIHAN</span>
              <span className="text-amber-600 dark:text-amber-400">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[10px] text-stone-400 dark:text-zinc-500 border-t border-dashed border-stone-200 dark:border-zinc-800">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p className="text-[9px]">Kumpul Cafe Digital POS & KDS</p>
          </div>
        </div>

        {/* Dialog Actions (Hidden when printing) */}
        <div className="flex items-center justify-between gap-2 pt-3 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl"
          >
            Tutup
          </Button>

          <div className="flex items-center gap-2">
            {!isPaid && onUpdateStatus && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onUpdateStatus(order.id, 'PAID');
                  onClose();
                }}
                className="text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Tandai Lunas
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="text-xs rounded-xl bg-stone-900 hover:bg-black text-white dark:bg-stone-100 dark:text-stone-900 font-bold"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Cetak Struk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
