'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TableData } from '@/lib/validations/table.schema';
import { RotateCcw, User, Loader2, Sparkles } from 'lucide-react';

interface TableResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableData | null;
  onConfirm: (table: TableData) => Promise<void> | void;
  isPending?: boolean;
}

export function TableResetModal({
  isOpen,
  onClose,
  table,
  onConfirm,
  isPending,
}: TableResetModalProps) {
  if (!table) return null;

  const displayTableNumber = table.tableNumber.trim().toUpperCase().startsWith('MEJA')
    ? table.tableNumber.trim().toUpperCase()
    : `MEJA ${table.tableNumber.trim()}`;

  const handleConfirm = async () => {
    await onConfirm(table);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="w-[94vw] sm:max-w-md p-5 sm:p-6 overflow-hidden sm:rounded-3xl border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          {/* Glowing Icon Badge */}
          <div className="h-14 w-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-xs">
            <RotateCcw className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold text-stone-900 dark:text-zinc-50">
              Reset Sesi {displayTableNumber}?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400 max-w-xs mx-auto">
              Sesi meja akan ditutup dan status meja dikembalikan menjadi kosong dan bersih.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Informational Callout Box */}
        <div className="rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 p-4 space-y-2.5 text-xs text-stone-700 dark:text-zinc-300">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-zinc-700/60">
            <span className="text-stone-500 dark:text-zinc-400 font-medium">Tamu Aktif:</span>
            <span className="font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              {table.activeGuestName || 'Sesi tanpa nama'}
            </span>
          </div>

          <div className="flex items-start gap-2 text-stone-600 dark:text-zinc-400 pt-0.5 leading-relaxed">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              QR Code meja tetap valid dan permanen. Tamu baru selanjutnya dapat langsung scan untuk membuka sesi baru.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
            className="flex-1 rounded-xl h-10 text-xs font-semibold border-stone-200 dark:border-zinc-800 cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            className="flex-1 rounded-xl h-10 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Mereset...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Ya, Kosongkan Meja
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
