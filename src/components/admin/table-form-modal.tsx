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
import { TableData, SeatingType } from '@/lib/validations/table.schema';
import {
  useCreateTableMutation,
  useUpdateTableMutation,
  useAdminTableZonesQuery,
} from '@/hooks/queries/use-admin-tables';
import { Users, Hash, MapPin, Armchair, Loader2 } from 'lucide-react';

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableToEdit?: TableData | null;
  onOpenZoneManager?: () => void;
}

const SEATING_TYPES: { id: SeatingType; label: string; icon: string; desc: string }[] = [
  { id: 'DINING', label: 'Dining Table', icon: '🍽️', desc: 'Meja makan standar' },
  { id: 'SOFA', label: 'Sofa / Lounge', icon: '🛋️', desc: 'Sofa santai empuk' },
  { id: 'BAR', label: 'Bar Counter', icon: '🍸', desc: 'Kursi tinggi bar' },
  { id: 'BOOTH', label: 'Booth / Bench', icon: '🪑', desc: 'Bilik sekat nyaman' },
  { id: 'FAMILY', label: 'Family Table', icon: '👨‍👩‍👧‍👦', desc: 'Meja besar keluarga' },
];

const FACILITY_TAGS = [
  { id: 'OUTLET', label: 'Dekat Colokan', icon: '🔌' },
  { id: 'WINDOW_VIEW', label: 'Window View', icon: '🪟' },
  { id: 'SMOKING', label: 'Area Merokok', icon: '🚬' },
  { id: 'AC', label: 'Area Dingin AC', icon: '❄️' },
  { id: 'WHEELCHAIR', label: 'Akses Kursi Roda', icon: '♿' },
  { id: 'LIVE_MUSIC', label: 'Dekat Panggung', icon: '🎤' },
];

export function TableFormModal({
  isOpen,
  onClose,
  tableToEdit,
  onOpenZoneManager,
}: TableFormModalProps) {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [zoneId, setZoneId] = useState<string>('');
  const [seatingType, setSeatingType] = useState<SeatingType>('DINING');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: zones = [] } = useAdminTableZonesQuery();
  const createMutation = useCreateTableMutation();
  const updateMutation = useUpdateTableMutation();

  const isEditing = Boolean(tableToEdit);
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;

    if (tableToEdit) {
      setTableNumber(tableToEdit.tableNumber);
      setCapacity(String(tableToEdit.capacity || 4));
      setZoneId(tableToEdit.zoneId || '');
      setSeatingType(tableToEdit.seatingType || 'DINING');
      setSelectedTags(tableToEdit.tags || []);
    } else {
      setTableNumber('');
      setCapacity('4');
      setZoneId(zones[0]?.id || '');
      setSeatingType('DINING');
      setSelectedTags([]);
    }
  }, [isOpen, tableToEdit]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

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
          zoneId: zoneId || null,
          seatingType,
          tags: selectedTags,
        },
      });
    } else {
      await createMutation.mutateAsync({
        tableNumber: tableNumber.trim(),
        capacity: parsedCapacity,
        zoneId: zoneId || null,
        seatingType,
        tags: selectedTags,
      });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="w-[94vw] sm:max-w-lg max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-stone-100 dark:border-zinc-800/80 shrink-0 text-left">
          <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-zinc-50 flex items-center gap-2">
            <Armchair className="h-5 w-5 text-amber-600" />
            {isEditing ? `Edit Meja ${tableToEdit?.tableNumber}` : 'Tambah Meja Baru'}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
            Tentukan nomor meja, kapasitas, area zona, dan fasilitas tempat duduk.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} id="table-form" className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* 1. Nomor Meja & Kapasitas Kursi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                Nomor Meja *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Contoh: 01, T-01, VIP-1"
                  className="pl-9 h-10 text-xs rounded-xl font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                Kapasitas Kursi (Orang) *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Contoh: 4"
                  className="pl-9 h-10 text-xs rounded-xl font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. Pilihan Zona / Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-amber-600" />
                Lokasi Zona / Area
              </label>
              {onOpenZoneManager && (
                <button
                  type="button"
                  onClick={onOpenZoneManager}
                  className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
                >
                  + Kelola Zona
                </button>
              )}
            </div>

            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
            >
              <option value="">-- Tanpa Zona (Umum) --</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  📍 {z.name} {z.description ? `(${z.description})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Tipe Tempat Duduk (Seating Type) */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1.5">
              Tipe Tempat Duduk
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SEATING_TYPES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSeatingType(st.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    seatingType === st.id
                      ? 'border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500'
                      : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="text-base mb-0.5">{st.icon}</div>
                  <div className="text-xs font-bold leading-tight">{st.label}</div>
                  <div className="text-[10px] text-stone-500 dark:text-zinc-400 truncate">{st.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Tag Fasilitas (Facility Tags Multi-select) */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1.5">
              Fasilitas & Karakteristik Meja
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FACILITY_TAGS.map((ft) => {
                const isSelected = selectedTags.includes(ft.id);
                return (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => toggleTag(ft.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border-stone-200/60 dark:border-zinc-700/60 hover:bg-stone-200'
                    }`}
                  >
                    <span>{ft.icon}</span>
                    <span>{ft.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Sticky Action Buttons at Bottom */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/80 dark:bg-zinc-900/90 backdrop-blur-md flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
            className="rounded-xl h-9 sm:h-10 text-xs font-semibold border-stone-200 dark:border-zinc-800 cursor-pointer"
          >
            Batal
          </Button>
          <Button
            form="table-form"
            type="submit"
            disabled={isPending || !tableNumber.trim()}
            className="rounded-xl h-9 sm:h-10 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 cursor-pointer"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {isEditing ? 'Simpan Perubahan' : 'Tambah Meja'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
