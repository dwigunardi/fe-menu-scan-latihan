'use client';

import { useState, useEffect, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableData } from '@/lib/validations/table.schema';
import {
  useCreateTableMutation,
  useUpdateTableMutation,
} from '@/hooks/queries/use-admin-tables';
import { Users, Hash } from 'lucide-react';

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableToEdit?: TableData | null;
}

export function TableFormModal({
  isOpen,
  onClose,
  tableToEdit,
}: TableFormModalProps) {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');

  const createMutation = useCreateTableMutation();
  const updateMutation = useUpdateTableMutation();

  const isEditing = Boolean(tableToEdit);
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (tableToEdit) {
      setTableNumber(tableToEdit.tableNumber);
      setCapacity(String(tableToEdit.capacity || 4));
    } else {
      setTableNumber('');
      setCapacity('4');
    }
  }, [tableToEdit, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) return;

    const parsedCapacity = Math.max(1, Number(capacity) || 1);

    if (isEditing && tableToEdit) {
      await updateMutation.mutateAsync({
        id: tableToEdit.id,
        payload: {
          tableNumber: tableNumber.trim(),
          capacity: parsedCapacity,
        },
      });
    } else {
      await createMutation.mutateAsync({
        tableNumber: tableNumber.trim(),
        capacity: parsedCapacity,
      });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-stone-900 dark:text-zinc-100">
            {isEditing ? `Edit Meja ${tableToEdit?.tableNumber}` : 'Tambah Meja Baru'}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
            Atur nomor identifikasi meja dan kapasitas maksimal kursi pelanggan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Table Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-amber-600" />
              Nomor Meja
            </label>
            <Input
              type="text"
              placeholder="Contoh: T-01, 01, VIP-1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="h-10 text-sm rounded-xl"
              required
              autoFocus
            />
          </div>

          {/* Capacity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-amber-600" />
              Kapasitas Kursi (Orang)
            </label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Contoh: 4"
              value={capacity}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setCapacity(digits);
              }}
              className="h-10 text-sm rounded-xl"
              required
            />
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="text-xs rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !tableNumber.trim()}
              className="text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {isPending
                ? 'Menyimpan...'
                : isEditing
                ? 'Simpan Perubahan'
                : 'Tambah Meja'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
