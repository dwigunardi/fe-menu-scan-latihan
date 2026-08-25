'use client';

import React, { useState, useEffect } from 'react';
import { StaffItem } from '@/lib/validations/staff.schema';
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
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPinCode('');
      setShowPin(false);
      setError('');
    }
  }, [isOpen]);

  if (!staff) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{4}$/.test(pinCode)) {
      setError('PIN harus berupa tepat 4 digit angka (0-9)');
      return;
    }

    setError('');
    onSubmitPin(staff.id, pinCode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-border rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Ubah PIN 4-Digit Staf
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                PIN digunakan staf untuk Clock-In cepat di workstation
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Info Karyawan */}
          <div className="p-3 bg-muted/30 rounded-xl border border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
              {getInitials(staff.name)}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-foreground truncate">{staff.name}</div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">{staff.email}</div>
            </div>
          </div>

          {/* Input PIN 4 Digit */}
          <div className="space-y-2">
            <Label htmlFor="pin-input" className="text-xs font-semibold text-foreground">
              Masukkan 4-Digit PIN Baru
            </Label>
            <div className="relative">
              <Input
                id="pin-input"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={4}
                value={pinCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPinCode(val);
                  if (error) setError('');
                }}
                placeholder="••••"
                className="h-12 text-center text-xl font-mono tracking-[0.5em] pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error ? (
              <p className="text-xs text-rose-500">{error}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Gunakan kombinasi 4 angka unik yang mudah diingat staf.
              </p>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-border gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || pinCode.length !== 4}
              className="h-9 font-semibold text-xs px-5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan PIN Baru'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
