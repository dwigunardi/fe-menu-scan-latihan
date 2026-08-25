'use client';

import * as React from 'react';
import { useRef } from 'react';
import { Printer, X, Receipt, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils/format-currency';
import { formatDateIndo, formatDateTimeIndo } from '@/lib/utils/date-helpers';
import { ShiftItem } from '@/lib/validations/shift.schema';

export interface ZReportReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ShiftItem | null;
}

export function ZReportReceiptModal({
  isOpen,
  onClose,
  shift,
}: ZReportReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!shift) return null;

  const handlePrint = () => {
    window.print();
  };

  const variance = shift.cashVariance ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 shadow-2xl">
        <DialogHeader className="p-4 bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <DialogTitle className="text-base font-bold text-stone-900 dark:text-zinc-50">
              Struk Z-Report Tutup Shift
            </DialogTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 flex justify-center max-h-[70vh] overflow-y-auto">
          <div
            ref={receiptRef}
            className="w-full max-w-[340px] bg-white text-black p-5 rounded-xl shadow-md border border-stone-300 font-mono text-xs leading-relaxed print:m-0 print:p-0 print:shadow-none print:border-none print:w-full"
          >
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-400">
              <h2 className="text-base font-black tracking-wider uppercase">KUMPUL CAFE</h2>
              <p className="text-[10px] text-stone-600">Digital F&B Multi-Branch System</p>
              <div className="inline-block px-2 py-0.5 mt-1 bg-stone-900 text-white text-[10px] font-bold rounded">
                Z-REPORT (TUTUP SHIFT)
              </div>
            </div>

            {/* Metadata Info */}
            <div className="py-3 space-y-1 text-[11px] border-b border-dashed border-stone-400">
              <div className="flex justify-between">
                <span className="text-stone-600">Shift ID:</span>
                <span className="font-bold">{shift.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Kasir:</span>
                <span className="font-bold">{shift.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Buka:</span>
                <span>{shift.openedAt ? formatDateTimeIndo(shift.openedAt) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Tutup:</span>
                <span>{shift.closedAt ? formatDateTimeIndo(shift.closedAt) : 'Shift Berjalan'}</span>
              </div>
            </div>

            {/* Sales & Payment Breakdown */}
            <div className="py-3 space-y-2 border-b border-dashed border-stone-400">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                Ringkasan Transaksi:
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Penjualan Tunai ({shift.totalCashOrders}x)</span>
                <span className="font-bold">{formatRupiah(shift.totalCashRevenue)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Penjualan QRIS ({shift.totalQrisOrders}x)</span>
                <span className="font-bold">{formatRupiah(shift.totalQrisRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-stone-200">
                <span>TOTAL OMSET SHIFT</span>
                <span>{formatRupiah(shift.totalRevenue)}</span>
              </div>
            </div>

            {/* Cash Drawer Reconciliation */}
            <div className="py-3 space-y-2 border-b border-dashed border-stone-400">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                Rekonsiliasi Laci Kas:
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Modal Kas Awal</span>
                <span>{formatRupiah(shift.openingCash)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Total Masuk Tunai</span>
                <span>+{formatRupiah(shift.totalCashRevenue)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold pt-1 border-t border-stone-200">
                <span>Kas Seharusnya (Expected)</span>
                <span>{formatRupiah(shift.expectedCash)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span>Uang Fisik Aktual (Actual)</span>
                <span>{shift.actualCash !== null && shift.actualCash !== undefined ? formatRupiah(shift.actualCash) : '-'}</span>
              </div>

              {/* Variance Result */}
              <div className={`p-1.5 rounded flex justify-between text-xs font-black ${
                variance === 0
                  ? 'bg-stone-100 text-stone-900'
                  : variance < 0
                  ? 'bg-stone-200 text-black'
                  : 'bg-stone-100 text-black'
              }`}>
                <span>SELISIH (VARIANCE):</span>
                <span>
                  {variance === 0 ? 'RP 0 (KLOP)' : `${variance > 0 ? '+' : ''}${formatRupiah(variance)}`}
                </span>
              </div>
            </div>

            {/* Notes */}
            {shift.notes && (
              <div className="py-2.5 text-[10px] text-stone-600 border-b border-dashed border-stone-400">
                <span className="font-bold">Catatan:</span> {shift.notes}
              </div>
            )}

            {/* Footer Signatures */}
            <div className="pt-4 text-center space-y-4">
              <p className="text-[10px] text-stone-500">
                Laporan ini sah sebagai bukti serah terima kasir shift.
              </p>
              <div className="grid grid-cols-2 gap-4 text-center pt-6 text-[10px]">
                <div>
                  <div className="border-b border-stone-400 pb-8" />
                  <p className="pt-1 font-bold">Kasir Bertugas</p>
                </div>
                <div>
                  <div className="border-b border-stone-400 pb-8" />
                  <p className="pt-1 font-bold">Supervisor / Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-2xl text-xs h-10"
          >
            Tutup
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="rounded-2xl text-xs h-10 bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Z-Report</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
