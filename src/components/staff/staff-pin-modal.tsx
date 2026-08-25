'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  StaffItem,
  UpdateStaffPinInput,
  UpdateStaffPinInputSchema,
} from '@/lib/validations/staff.schema';
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
import { KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { getInitials } from '@/lib/utils/get-initials';

interface StaffPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffItem | null;
  onSubmitPin: (id: string, pinCode: string) => void;
  isSubmitting: boolean;
}

export function StaffPinModal({
  isOpen,
  onClose,
  staff,
  onSubmitPin,
  isSubmitting,
}: StaffPinModalProps) {
  const [showPin, setShowPin] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateStaffPinInput>({
    resolver: zodResolver(UpdateStaffPinInputSchema),
    defaultValues: {
      pinCode: '',
    },
  });

  const pinCodeValue = watch('pinCode') || '';

  useEffect(() => {
    if (isOpen) {
      reset({ pinCode: '' });
      setShowPin(false);
    }
  }, [isOpen, reset]);

  if (!staff) return null;

  const onValidSubmit = (data: UpdateStaffPinInput) => {
    onSubmitPin(staff.id, data.pinCode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-stone-200/80 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900 shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-stone-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-stone-900 dark:text-zinc-50">
                Ubah PIN 4-Digit Staf
              </DialogTitle>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                PIN digunakan staf untuk Clock-In cepat di workstation
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onValidSubmit)} className="px-6 py-5 space-y-4">
          {/* Info Karyawan */}
          <div className="p-3.5 bg-stone-50/80 dark:bg-zinc-800/50 rounded-2xl border border-stone-200/60 dark:border-zinc-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/20">
              {getInitials(staff.name)}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-stone-900 dark:text-zinc-100 truncate">{staff.name}</div>
              <div className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono truncate">{staff.email}</div>
            </div>
          </div>

          {/* Input PIN 4 Digit */}
          <div className="space-y-2">
            <Label htmlFor="pin-input" className="text-xs font-bold text-stone-900 dark:text-zinc-100">
              Masukkan 4-Digit PIN Baru
            </Label>
            <div className="relative">
              <Input
                id="pin-input"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={4}
                {...register('pinCode')}
                placeholder="••••"
                className="h-12 text-center text-xl font-mono tracking-[0.5em] pr-10 rounded-xl bg-stone-50 dark:bg-zinc-800/80 border-stone-200/80 dark:border-zinc-700/80"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 p-1 transition-colors"
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.pinCode ? (
              <p className="text-xs font-medium text-rose-500">{errors.pinCode.message}</p>
            ) : (
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Gunakan kombinasi 4 angka unik yang mudah diingat staf.
              </p>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-stone-100 dark:border-zinc-800 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 text-xs font-semibold rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || pinCodeValue.length !== 4}
              className="h-10 font-bold text-xs px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan PIN Baru'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
