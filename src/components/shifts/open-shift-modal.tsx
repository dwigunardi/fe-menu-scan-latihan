'use client';

import * as React from 'react';
import { useState } from 'react';
import { Clock, Coins, Sparkles } from 'lucide-react';
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

export interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CASH_PRESETS = [100000, 200000, 300000, 500000];

export function OpenShiftModal({ isOpen, onClose, onSuccess }: OpenShiftModalProps) {
  const [openingCash, setOpeningCash] = useState<number>(200000);
  const [notes, setNotes] = useState<string>('');
  const [rawInput, setRawInput] = useState<string>('200000');

  const openMutation = useOpenShiftMutation();

  const handleCashChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setRawInput(cleaned);
    setOpeningCash(cleaned ? parseInt(cleaned, 10) : 0);
  };

  const handlePresetClick = (amount: number) => {
    setOpeningCash(amount);
    setRawInput(String(amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (openingCash < 0) return;

    await openMutation.mutateAsync({
      openingCash,
      notes: notes.trim() || undefined,
    });

    onClose();
    onSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
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

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
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
                value={rawInput ? Number(rawInput).toLocaleString('id-ID') : ''}
                onChange={(e) => handleCashChange(e.target.value)}
                placeholder="200.000"
                className="pl-11 font-mono font-bold text-lg rounded-2xl h-12 bg-stone-50/60 dark:bg-zinc-800/60 border-stone-200 dark:border-zinc-700 focus-visible:ring-amber-500"
                required
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CASH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`text-xs px-2.5 py-1 rounded-xl font-semibold transition-all border ${
                    openingCash === preset
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pecahan 10rb x 10, 5rb x 20..."
              className="resize-none text-xs rounded-2xl min-h-[70px] bg-stone-50/60 dark:bg-zinc-800/60 border-stone-200 dark:border-zinc-700"
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl text-xs h-10"
              disabled={openMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={openMutation.isPending || openingCash < 0}
              className="rounded-2xl text-xs h-10 bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>{openMutation.isPending ? 'Membuka Shift...' : 'Buka Shift Sekarang'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
