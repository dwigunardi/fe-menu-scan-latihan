'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ShiftTemplateItem,
  CreateShiftTemplateInput,
} from '@/lib/validations/shift-template.schema';
import {
  useCreateShiftTemplateMutation,
  useUpdateShiftTemplateMutation,
} from '@/hooks/queries/use-admin-shift-templates';
import { Clock, Coffee, Sparkles, Tag, Check, Palette } from 'lucide-react';

interface ShiftTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: ShiftTemplateItem | null;
}

const BADGE_COLORS = [
  { label: 'Hijau (Emerald)', value: 'emerald', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { label: 'Biru (Sky/Blue)', value: 'blue', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { label: 'Kuning (Amber)', value: 'amber', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { label: 'Ungu (Purple)', value: 'purple', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { label: 'Merah Muda (Rose)', value: 'rose', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  { label: 'Oranye (Orange)', value: 'orange', bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
];

export function ShiftTemplateModal({
  isOpen,
  onClose,
  templateToEdit,
}: ShiftTemplateModalProps) {
  const isEditing = Boolean(templateToEdit);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [colorBadge, setColorBadge] = useState('emerald');
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateShiftTemplateMutation();
  const updateMutation = useUpdateShiftTemplateMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setCode(templateToEdit.code);
      setStartTime(templateToEdit.startTime);
      setEndTime(templateToEdit.endTime);
      setBreakMinutes(templateToEdit.breakMinutes);
      setColorBadge(templateToEdit.colorBadge || 'emerald');
      setIsActive(templateToEdit.isActive);
    } else {
      setName('');
      setCode('');
      setStartTime('08:00');
      setEndTime('16:00');
      setBreakMinutes(60);
      setColorBadge('emerald');
      setIsActive(true);
    }
  }, [templateToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !startTime || !endTime) return;

    const payload: CreateShiftTemplateInput = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      startTime,
      endTime,
      breakMinutes: Number(breakMinutes) || 0,
      colorBadge,
      isActive,
    };

    try {
      if (isEditing && templateToEdit) {
        await updateMutation.mutateAsync({
          id: templateToEdit.id,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-4 border-b border-stone-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-stone-900 dark:text-zinc-100">
                {isEditing ? 'Edit Template Master Shift' : 'Tambah Template Master Shift'}
              </DialogTitle>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                Konfigurasi jam kerja, waktu istirahat, dan kode identifikasi shift
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Shift Name & Code */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="shift-name" className="text-xs font-bold text-stone-700 dark:text-zinc-300">
                Nama Shift
              </Label>
              <Input
                id="shift-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Shift Pagi (Opening)"
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shift-code" className="text-xs font-bold text-stone-700 dark:text-zinc-300">
                Kode Shift
              </Label>
              <Input
                id="shift-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PAGI"
                className="h-9 text-xs font-mono font-bold uppercase rounded-xl"
                required
              />
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/60 dark:border-zinc-800">
            <div className="space-y-1.5">
              <Label htmlFor="start-time" className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                Jam Mulai Masuk
              </Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-9 text-xs font-mono rounded-lg bg-white dark:bg-zinc-900"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="end-time" className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-stone-500" />
                Jam Selesai Pulang
              </Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-9 text-xs font-mono rounded-lg bg-white dark:bg-zinc-900"
                required
              />
            </div>
          </div>

          {/* Break Duration */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="break-minutes" className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1">
                <Coffee className="h-3.5 w-3.5 text-amber-600" />
                Waktu Istirahat (Break Time)
              </Label>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                {breakMinutes} Menit
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[0, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setBreakMinutes(mins)}
                  className={`h-8 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    breakMinutes === mins
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:bg-stone-50'
                  }`}
                >
                  {mins === 0 ? 'Tanpa Jeda' : `${mins} mnt`}
                </button>
              ))}
            </div>
          </div>

          {/* Color Badge Selector */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-amber-600" />
              Warna Label Shift di Kalender Roster
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {BADGE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColorBadge(c.value)}
                  className={`h-8 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer ${
                    c.bg
                  } ${
                    colorBadge === c.value
                      ? 'ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-zinc-900'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span>{c.label.split(' ')[0]}</span>
                  {colorBadge === c.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="p-0 pt-3 gap-2 border-t border-stone-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl h-9 text-xs font-semibold cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="rounded-xl h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
            >
              {isPending ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Template Shift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
