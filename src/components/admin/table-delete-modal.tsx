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
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface TableDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableData | null;
  onConfirm: (table: TableData) => Promise<void> | void;
  isPending?: boolean;
}

export function TableDeleteModal({
  isOpen,
  onClose,
  table,
  onConfirm,
  isPending,
}: TableDeleteModalProps) {
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
          {/* Glowing Red Icon Badge */}
          <div className="h-14 w-14 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-center shadow-xs">
            <Trash2 className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold text-stone-900 dark:text-zinc-50">
              Hapus {displayTableNumber}?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400 max-w-xs mx-auto">
              Meja ini akan dihapus dari denah restoran dan QR kodenya tidak dapat digunakan lagi.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 p-3.5 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>
            Pastikan tidak ada pesanan aktif atau tamu yang sedang menggunakan meja ini sebelum menghapus.
          </span>
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
            className="flex-1 rounded-xl h-10 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1.5" />
                Hapus Meja
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
