'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select';
import {
  TableData,
  SeatingType,
  TableFormInput,
  TableFormSchema,
} from '@/lib/validations/table.schema';
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
  const { data: zones = [] } = useAdminTableZonesQuery();
  const createMutation = useCreateTableMutation();
  const updateMutation = useUpdateTableMutation();

  const isEditing = Boolean(tableToEdit);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TableFormInput>({
    resolver: zodResolver(TableFormSchema) as any,
    defaultValues: {
      tableNumber: '',
      capacity: 4,
      zoneId: '',
      seatingType: 'DINING',
      tags: [],
    },
  });

  const selectedSeatingType = watch('seatingType');
  const selectedTags = watch('tags') || [];

  useEffect(() => {
    if (!isOpen) return;

    if (tableToEdit) {
      reset({
        tableNumber: tableToEdit.tableNumber,
        capacity: tableToEdit.capacity || 4,
        zoneId: tableToEdit.zoneId || '',
        seatingType: tableToEdit.seatingType || 'DINING',
        tags: tableToEdit.tags || [],
      });
      return;
    }

    reset({
      tableNumber: '',
      capacity: 4,
      zoneId: zones[0]?.id || '',
      seatingType: 'DINING',
      tags: [],
    });
  }, [isOpen, tableToEdit, reset]);

  const toggleTag = (tagId: string) => {
    const current = selectedTags;
    const next = current.includes(tagId)
      ? current.filter((t) => t !== tagId)
      : [...current, tagId];
    setValue('tags', next);
  };

  const onFormSubmit = async (data: TableFormInput) => {
    const payload = {
      tableNumber: data.tableNumber.trim(),
      capacity: Number(data.capacity) || 4,
      zoneId: data.zoneId || null,
      seatingType: data.seatingType,
      tags: data.tags,
    };

    if (isEditing && tableToEdit) {
      await updateMutation.mutateAsync({
        id: tableToEdit.id,
        payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
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
        <form onSubmit={handleSubmit(onFormSubmit)} id="table-form" className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* 1. Nomor Meja & Kapasitas Kursi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                Nomor Meja *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  {...register('tableNumber')}
                  placeholder="Contoh: 01, T-01, VIP-1"
                  className="pl-9 h-10 text-xs rounded-xl font-mono"
                  autoFocus
                />
              </div>
              {errors.tableNumber && (
                <p className="text-xs font-medium text-rose-500 mt-1">{errors.tableNumber.message}</p>
              )}
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
                  {...register('capacity', { valueAsNumber: true })}
                  placeholder="Contoh: 4"
                  className="pl-9 h-10 text-xs rounded-xl font-mono"
                />
              </div>
              {errors.capacity && (
                <p className="text-xs font-medium text-rose-500 mt-1">{errors.capacity.message}</p>
              )}
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

            <Controller
              name="zoneId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || '__NONE__'}
                  onValueChange={(val) => field.onChange(val === '__NONE__' ? '' : val)}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Pilih area/zona meja..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectGroup>
                      <SelectItem value="__NONE__" className="text-xs text-stone-400">
                        Tanpa Zona Khusus (Default)
                      </SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id} className="text-xs">
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* 3. Tipe Tempat Duduk (Seating Types) */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1.5">
              Tipe Tempat Duduk
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SEATING_TYPES.map((st) => {
                const isSelected = selectedSeatingType === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setValue('seatingType', st.id)}
                    className={`p-2.5 rounded-2xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 ring-1 ring-amber-600'
                        : 'border-stone-200/80 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <span className="text-base">{st.icon}</span>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-stone-900 dark:text-zinc-100 truncate">
                        {st.label}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-zinc-400 truncate">
                        {st.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Tag Fasilitas Tambahan */}
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1.5">
              Tag Fasilitas & Keunggulan Meja
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FACILITY_TAGS.map((tag) => {
                const isChecked = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-stone-100 dark:border-zinc-800/80 shrink-0 flex items-center justify-end gap-2 bg-stone-50/50 dark:bg-zinc-800/30">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="h-10 text-xs font-semibold rounded-xl"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="table-form"
            disabled={isPending}
            className="h-10 text-xs font-bold px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {isEditing ? 'Simpan Perubahan' : 'Tambah Meja'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
