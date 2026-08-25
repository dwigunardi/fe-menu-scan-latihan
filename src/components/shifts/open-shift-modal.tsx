'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Coins, Sparkles } from 'lucide-react';
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
import { useOpenShiftMutation } from '@/hooks/queries/use-admin-shifts';
import {
  OpenShiftInput,
  OpenShiftInputSchema,
} from '@/lib/validations/shift.schema';

export interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CASH_PRESETS = [100000, 200000, 300000, 500000];

export function OpenShiftModal({ isOpen, onClose, onSuccess }: OpenShiftModalProps) {
  const openMutation = useOpenShiftMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<OpenShiftInput>({
    resolver: zodResolver(OpenShiftInputSchema),
    defaultValues: {
      openingCash: 200000,
      notes: '',
    },
  });

  const openingCashValue = watch('openingCash') ?? 200000;

  useEffect(() => {
    if (isOpen) {
      reset({
        openingCash: 200000,
        notes: '',
      });
    }
  }, [isOpen, reset]);

  const handleCashChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setValue('openingCash', cleaned ? parseInt(cleaned, 10) : 0, {
      shouldValidate: true,
    });
  };

  const handlePresetClick = (amount: number) => {
    setValue('openingCash', amount, { shouldValidate: true });
  };

  const onFormSubmit = async (data: OpenShiftInput) => {
    await openMutation.mutateAsync({
      openingCash: Number(data.openingCash),
      notes: data.notes?.trim() || undefined,
    });

    onClose();
    onSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-stone-900 dark:text-zinc-50">
                Buka Shift Kasir
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
                Masukkan jumlah uang kas awal (modal kembalian) di laci kasir.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          {/* Opening Cash Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
              Kas Modal Awal (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                value={openingCashValue ? Number(openingCashValue).toLocaleString('id-ID') : ''}
                onChange={(e) => handleCashChange(e.target.value)}
                placeholder="200.000"
                className="pl-11 font-mono font-bold text-lg rounded-2xl h-12 bg-stone-50/60 dark:bg-zinc-800/60 border-stone-200 dark:border-zinc-700 focus-visible:ring-amber-500"
                autoFocus
              />
            </div>
            {errors.openingCash && (
              <p className="text-xs font-medium text-rose-500">{errors.openingCash.message}</p>
            )}

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CASH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`text-xs px-2.5 py-1 rounded-xl font-semibold transition-all border cursor-pointer ${
                    openingCashValue === preset
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border-stone-200/60 dark:border-zinc-700 hover:border-amber-400'
                  }`}
                >
                  {formatRupiah(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
              Catatan Pembukaan (Opsional)
            </label>
            <Textarea
              {...register('notes')}
              placeholder="Contoh: Tambahan uang receh Rp 50.000 pecahan Rp 2.000..."
              className="resize-none rounded-2xl text-xs bg-stone-50/60 dark:bg-zinc-800/60 border-stone-200 dark:border-zinc-700 h-20"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={openMutation.isPending}
              className="rounded-2xl h-11"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={openMutation.isPending || openingCashValue < 0}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl h-11 px-6 shadow-md shadow-amber-600/20"
            >
              {openMutation.isPending ? 'Membuka Shift...' : 'Buka Shift Sekarang'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
