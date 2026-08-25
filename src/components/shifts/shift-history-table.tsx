'use client';

import * as React from 'react';
import { Clock, Eye, Receipt, SlidersHorizontal, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah } from '@/lib/utils/format-currency';
import { formatDateTimeIndo } from '@/lib/utils/date-helpers';
import { ShiftItem } from '@/lib/validations/shift.schema';

export interface ShiftHistoryTableProps {
  shifts: ShiftItem[];
  isLoading: boolean;
  onViewZReport: (shift: ShiftItem) => void;
}

export function ShiftHistoryTable({
  shifts,
  isLoading,
  onViewZReport,
}: ShiftHistoryTableProps) {
  return (
    <div className="rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
      <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-zinc-50">
            Riwayat Log Shift Kasir & Audit Z-Report
          </h3>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Daftar seluruh pergantian shift kasir beserta rekapitulasi selisih kas.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50/80 dark:bg-zinc-800/50 hover:bg-stone-50/80 border-b border-stone-200/60 dark:border-zinc-800">
              <TableHead className="py-3 px-4 font-bold text-xs">Waktu Buka / Tutup</TableHead>
              <TableHead className="py-3 px-4 font-bold text-xs">Kasir</TableHead>
              <TableHead className="py-3 px-4 font-bold text-xs text-right">Kas Awal</TableHead>
              <TableHead className="py-3 px-4 font-bold text-xs text-right">Total Omset</TableHead>
              <TableHead className="py-3 px-4 font-bold text-xs text-right">Kas Fisik</TableHead>
              <TableHead className="py-3 px-4 font-bold text-xs text-center">Selisih (Variance)</TableHead>
              <TableHead className="py-3 px-4 font-bold text-xs text-center">Status</TableHead>
              <TableHead className="py-3 px-4 font-bold text-xs text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="py-3.5 px-4"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="py-3.5 px-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-3.5 px-4"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="py-3.5 px-4"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="py-3.5 px-4"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="py-3.5 px-4"><Skeleton className="h-6 w-24 mx-auto rounded-full" /></TableCell>
                  <TableCell className="py-3.5 px-4"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                  <TableCell className="py-3.5 px-4"><Skeleton className="h-8 w-20 ml-auto rounded-xl" /></TableCell>
                </TableRow>
              ))
            ) : shifts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-stone-400">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">Belum ada riwayat shift yang tersimpan</p>
                </TableCell>
              </TableRow>
            ) : (
              shifts.map((shift) => {
                const variance = shift.cashVariance ?? 0;
                const isClosed = shift.status === 'CLOSED';

                return (
                  <TableRow
                    key={shift.id}
                    className="hover:bg-stone-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Waktu Buka & Tutup */}
                    <TableCell className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-stone-800 dark:text-zinc-200">
                          {formatDateTimeIndo(shift.openedAt)}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {shift.closedAt ? `s/d ${formatDateTimeIndo(shift.closedAt)}` : 'Sedang Berjalan'}
                        </p>
                      </div>
                    </TableCell>

                    {/* Kasir */}
                    <TableCell className="py-3 px-4 text-xs font-semibold text-stone-700 dark:text-zinc-300">
                      {shift.staffName}
                    </TableCell>

                    {/* Kas Awal */}
                    <TableCell className="py-3 px-4 text-xs font-mono font-medium text-stone-600 dark:text-zinc-400 text-right">
                      {formatRupiah(shift.openingCash)}
                    </TableCell>

                    {/* Total Omset */}
                    <TableCell className="py-3 px-4 text-xs font-mono font-bold text-stone-900 dark:text-zinc-100 text-right">
                      {formatRupiah(shift.totalRevenue)}
                    </TableCell>

                    {/* Kas Fisik */}
                    <TableCell className="py-3 px-4 text-xs font-mono font-bold text-stone-800 dark:text-zinc-200 text-right">
                      {shift.actualCash !== null && shift.actualCash !== undefined
                        ? formatRupiah(shift.actualCash)
                        : '-'}
                    </TableCell>

                    {/* Selisih (Variance) */}
                    <TableCell className="py-3 px-4 text-center">
                      {!isClosed ? (
                        <span className="text-[11px] text-stone-400">-</span>
                      ) : variance === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Klop (Rp 0)
                        </span>
                      ) : variance < 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" /> {formatRupiah(variance)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                          +{formatRupiah(variance)}
                        </span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isClosed
                            ? 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        {shift.status}
                      </span>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="py-3 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onViewZReport(shift)}
                        className="rounded-xl text-xs h-8 px-3 border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-amber-600 hover:border-amber-500 transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Struk Z</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
