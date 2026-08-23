'use client';

import { useState, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
  useAdminTableZonesQuery,
  useCreateTableZoneMutation,
  useUpdateTableZoneMutation,
  useDeleteTableZoneMutation,
} from '@/hooks/queries/use-admin-tables';
import { TableZoneData } from '@/lib/validations/table.schema';
import { MapPin, Plus, Edit2, Trash2, Check, X, Loader2, Armchair } from 'lucide-react';

interface ZoneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ZoneManagerModal({ isOpen, onClose }: ZoneManagerModalProps) {
  const { data: zones = [], isLoading } = useAdminTableZonesQuery();
  const createMutation = useCreateTableZoneMutation();
  const updateMutation = useUpdateTableZoneMutation();
  const deleteMutation = useDeleteTableZoneMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('amber');
  const [editingZone, setEditingZone] = useState<TableZoneData | null>(null);

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleStartEdit = (zone: TableZoneData) => {
    setEditingZone(zone);
    setName(zone.name);
    setDescription(zone.description || '');
    setColor(zone.color || 'amber');
  };

  const handleCancelEdit = () => {
    setEditingZone(null);
    setName('');
    setDescription('');
    setColor('amber');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingZone) {
      await updateMutation.mutateAsync({
        id: editingZone.id,
        payload: {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        },
      });
      handleCancelEdit();
    } else {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        sortOrder: zones.length + 1,
      });
      setName('');
      setDescription('');
      setColor('amber');
    }
  };

  const handleDelete = async (zone: TableZoneData) => {
    if (
      !confirm(
        `Hapus zona "${zone.name}"? Meja di dalam zona ini akan diubah status zonanya menjadi tanpa zona.`
      )
    ) {
      return;
    }
    await deleteMutation.mutateAsync({ id: zone.id, name: zone.name });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="w-[94vw] sm:max-w-xl max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-stone-100 dark:border-zinc-800/80 shrink-0 text-left">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-stone-900 dark:text-zinc-50">
                Kelola Zona & Area Kafe
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
                Atur pembagian area fisik kafe (Indoor, Outdoor, VIP, Lantai 2, dsb)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Form Tambah / Edit Zona */}
          <form onSubmit={handleSubmit} className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
                {editingZone ? (
                  <>
                    <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                    Edit Zona: {editingZone.name}
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 text-amber-600" />
                    Tambah Zona Baru
                  </>
                )}
              </h4>
              {editingZone && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[11px] text-stone-500 hover:text-stone-700 dark:hover:text-zinc-300 font-medium cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Nama Zona *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Outdoor Garden, VIP Room"
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Keterangan / Fasilitas Singkat
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Misal: Area merokok, asri"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !name.trim()}
                className="h-8.5 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : editingZone ? (
                  <Check className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-1" />
                )}
                {editingZone ? 'Simpan Perubahan' : 'Tambah Zona'}
              </Button>
            </div>
          </form>

          {/* Daftar Master Zona */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Daftar Zona Aktif ({zones.length})
            </h4>

            {isLoading ? (
              <div className="text-center py-6 text-xs text-stone-400">Memuat daftar zona...</div>
            ) : zones.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 border border-dashed rounded-2xl">
                Belum ada zona khusus. Semua meja otomatis masuk ke Area Umum.
              </div>
            ) : (
              <div className="space-y-2">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-3 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-stone-100 dark:bg-zinc-700 flex items-center justify-center text-stone-600 dark:text-zinc-300 shrink-0">
                        <Armchair className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 dark:text-zinc-100 truncate">
                          {zone.name}
                        </div>
                        {zone.description && (
                          <div className="text-[11px] text-stone-400 dark:text-zinc-500 truncate">
                            {zone.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <SimpleTooltip content="Edit Zona" side="top">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(zone)}
                          disabled={isPending}
                          className="h-7 w-7 rounded-lg border border-stone-200 dark:border-zinc-700 flex items-center justify-center text-stone-400 hover:text-amber-600 hover:border-amber-500 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </SimpleTooltip>
                      <SimpleTooltip content="Hapus Zona" side="top">
                        <button
                          type="button"
                          onClick={() => handleDelete(zone)}
                          disabled={isPending}
                          className="h-7 w-7 rounded-lg border border-stone-200 dark:border-zinc-700 flex items-center justify-center text-stone-400 hover:text-red-600 hover:border-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </SimpleTooltip>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Close Button */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/80 dark:bg-zinc-900/90 backdrop-blur-md flex items-center justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-9 sm:h-10 text-xs font-semibold border-stone-200 dark:border-zinc-800 cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
