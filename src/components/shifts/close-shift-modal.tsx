'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Coins,
  Calculator,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatRupiah } from '@/lib/utils/format-currency';
import { ShiftItem, CloseShiftInput, CloseShiftInputSchema } from '@/lib/validations/shift.schema';
import { useCloseShiftMutation } from '@/hooks/queries/use-admin-shifts';

export interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ShiftItem;
  onShiftClosed: (closedShift: ShiftItem) => void;
}

export function CloseShiftModal({
  isOpen,
  onClose,
  shift,
  onShiftClosed,
}: CloseShiftModalProps) {
  const closeMutation = useCloseShiftMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CloseShiftInput>({
    resolver: zodResolver(CloseShiftInputSchema),
    defaultValues: {
      actualCash: shift.expectedCash,
      notes: '',
    },
  });

  const actualCashValue = watch('actualCash') ?? shift.expectedCash;
  const variance = actualCashValue - shift.expectedCash;

  useEffect(() => {
    if (isOpen) {
      reset({
        actualCash: shift.expectedCash,
        notes: '',
      });
    }
  }, [isOpen, shift.expectedCash, reset]);

  const handleCashChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setValue('actualCash', cleaned ? parseInt(cleaned, 10) : 0, {
      shouldValidate: true,
    });
  };

  const onFormSubmit = async (data: CloseShiftInput) => {
    const result = await closeMutation.mutateAsync({
      shiftId: shift.id,
      payload: {
        actualCash: Number(data.actualCash),
        notes: data.notes?.trim() || undefined,
      },
    });

    onShiftClosed(result);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-stone-900 dark:text-zinc-50">
                Tutup Shift & Rekonsiliasi Kas
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
                Kasir: <strong className="text-stone-800 dark:text-zinc-200">{shift.staffName}</strong> • Hitung uang fisik di laci kasir.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Financial Shift Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-stone-50/80 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Kas Awal</span>
            <p className="text-xs font-bold font-mono text-stone-800 dark:text-zinc-200">
              {formatRupiah(shift.openingCash)}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
              Penjualan Tunai ({shift.totalCashOrders})
            </span>
            <p className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {formatRupiah(shift.totalCashRevenue)}
            </p>
          </div>
          <div className="space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
              Penjualan QRIS ({shift.totalQrisOrders})
            </span>
            <p className="text-xs font-bold font-mono text-blue-700 dark:text-blue-300">
              {formatRupiah(shift.totalQrisRevenue)}
            </p>
          </div>
        </div>

        {/* Expected Cash Banner */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              Total Kas Harapan di Laci:
            </span>
          </div>
          <span className="text-sm font-bold font-mono text-amber-900 dark:text-amber-100">
            {formatRupiah(shift.expectedCash)}
          </span>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-1">
          {/* Actual Cash Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Uang Fisik Aktual di Laci (Rp) <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-stone-400">Hitung total uang kertas + koin</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                value={actualCashValue ? Number(actualCashValue).toLocaleString('id-ID') : ''}
                onChange={(e) => handleCashChange(e.target.value)}
                className="pl-11 font-mono font-bold text-lg rounded-2xl h-12 bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 focus-visible:ring-amber-500"
                autoFocus
              />
            </div>
            {errors.actualCash && (
              <p className="text-xs font-medium text-rose-500">{errors.actualCash.message}</p>
            )}
          </div>

          {/* Variance Status Feedback Badge */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between ${
              variance === 0
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : variance < 0
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {variance === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              )}
              <span className="text-xs font-bold">
                {variance === 0
                  ? 'Kas Sempurna / Klop'
                  : variance < 0
                  ? 'Kas Kurang (Shortage)'
                  : 'Kas Lebih (Overage)'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold">
              {variance === 0 ? 'Rp 0' : `${variance > 0 ? '+' : ''}${formatRupiah(variance)}`}
            </span>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
              Catatan Penutupan (Opsional)
            </label>
            <Textarea
              {...register('notes')}
              placeholder="Catatan kendala atau rincian selisih jika ada..."
              className="resize-none text-xs rounded-2xl min-h-[60px] bg-stone-50/60 dark:bg-zinc-800/60 border-stone-200 dark:border-zinc-700"
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl text-xs h-10"
              disabled={closeMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={closeMutation.isPending || actualCashValue < 0}
              className="rounded-2xl text-xs h-10 bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{closeMutation.isPending ? 'Memproses...' : 'Tutup Shift & Cetak Z-Report'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
