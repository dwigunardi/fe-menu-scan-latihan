'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Delete, RotateCcw, X, Loader2, Lock, ShieldAlert } from 'lucide-react';
import { StaffItem } from '@/lib/validations/staff.schema';
import { ATTENDANCE_TYPE, AttendanceType } from '@/lib/constants/attendance';
import { getInitials } from '@/lib/utils/get-initials';
import { playErrorBeep } from '@/lib/utils/audio-feedback';
import { cn } from '@/lib/utils/cn';

interface KioskPinModalProps {
  isOpen: boolean;
  staff: StaffItem | null;
  mode: AttendanceType;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmitPin: (pin: string) => Promise<void>;
}

export function KioskPinModal({
  isOpen,
  staff,
  mode,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmitPin,
}: KioskPinModalProps) {
  const [pinCode, setPinCode] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Reset PIN whenever modal opens or staff changes
  useEffect(() => {
    if (isOpen) {
      setPinCode('');
      setIsShaking(false);
    }
  }, [isOpen, staff?.id]);

  // Trigger shake animation when errorMessage changes and is present
  useEffect(() => {
    if (errorMessage) {
      setIsShaking(true);
      playErrorBeep();
      const timer = setTimeout(() => {
        setIsShaking(false);
        setPinCode('');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleKeyPress = useCallback(
    async (num: string) => {
      if (isSubmitting) return;

      if (pinCode.length < 4) {
        const nextPin = pinCode + num;
        setPinCode(nextPin);

        // Auto-submit on 4th digit
        if (nextPin.length === 4) {
          await onSubmitPin(nextPin);
        }
      }
    },
    [pinCode, isSubmitting, onSubmitPin]
  );

  const handleBackspace = useCallback(() => {
    if (isSubmitting) return;
    setPinCode((prev) => prev.slice(0, -1));
  }, [isSubmitting]);

  const handleClear = useCallback(() => {
    if (isSubmitting) return;
    setPinCode('');
  }, [isSubmitting]);

  // Physical Keyboard Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyPress, handleBackspace, onClose]);

  if (!staff) return null;

  const isClockIn = mode === ATTENDANCE_TYPE.CLOCK_IN;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        className="w-full max-w-md p-0 overflow-hidden rounded-3xl border-stone-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 [&>button]:hidden"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Verifikasi PIN Kios Presensi</DialogTitle>
          <DialogDescription>
            Masukkan 4 digit PIN presensi untuk {staff.name}
          </DialogDescription>
        </DialogHeader>

        {/* Modal Header with Staff Identity Card */}
        <div
          className={cn(
            'p-6 border-b transition-colors relative flex items-center justify-between gap-4',
            isClockIn
              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40'
              : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40'
          )}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-amber-600/30 shrink-0">
              {getInitials(staff.name)}
            </div>
            <div className="min-w-0">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1',
                  isClockIn
                    ? 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200'
                    : 'bg-rose-200/80 text-rose-900 dark:bg-rose-900/80 dark:text-rose-200'
                )}
              >
                {isClockIn ? 'Presensi Masuk (Clock-In)' : 'Presensi Pulang (Clock-Out)'}
              </span>
              <h3 className="font-extrabold text-lg text-stone-900 dark:text-zinc-50 truncate">
                {staff.name}
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">
                {staff.role} • NIK: {staff.employeeId || '-'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 w-9 rounded-xl border border-stone-200 dark:border-zinc-700 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body: PIN Indicator & Error Feedback */}
        <div className="p-6 flex flex-col items-center">
          <p className="text-xs font-semibold text-stone-500 dark:text-zinc-400 mb-4">
            Ketik 4-digit PIN presensi Anda pada keypad di bawah:
          </p>

          {/* 4-Digit Masked Circles with Shake Animation */}
          <motion.div
            animate={isShaking ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-4 py-2"
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pinCode.length > index;
              return (
                <div
                  key={index}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center',
                    isFilled
                      ? 'bg-amber-600 border-amber-600 scale-110 shadow-md shadow-amber-600/30'
                      : 'border-stone-300 dark:border-zinc-700 bg-stone-100 dark:bg-zinc-800'
                  )}
                >
                  {isFilled && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              );
            })}
          </motion.div>

          {/* Error Message Feedback */}
          <div className="h-6 mt-3 flex items-center justify-center">
            {errorMessage ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-in fade-in duration-200">
                <ShieldAlert className="h-3.5 w-3.5" />
                {errorMessage}
              </span>
            ) : isSubmitting ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 animate-in fade-in duration-200">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memverifikasi data presensi...
              </span>
            ) : null}
          </div>

          {/* Large Touch Numpad (3x4 Grid) */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-xs mt-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleKeyPress(num)}
                className="h-14 sm:h-16 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 hover:bg-amber-500 hover:border-amber-500 hover:text-white dark:hover:bg-amber-600 dark:hover:border-amber-600 font-mono text-xl sm:text-2xl font-black text-stone-800 dark:text-zinc-100 transition-all active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
                id={`kiosk-pin-btn-${num}`}
              >
                {num}
              </button>
            ))}

            {/* Clear All Button */}
            <button
              type="button"
              disabled={isSubmitting || pinCode.length === 0}
              onClick={handleClear}
              className="h-14 sm:h-16 rounded-2xl bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
              aria-label="Bersihkan PIN"
            >
              <RotateCcw className="h-4 w-4 mb-1" />
              <span>Reset</span>
            </button>

            {/* '0' Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleKeyPress('0')}
              className="h-14 sm:h-16 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 hover:bg-amber-500 hover:border-amber-500 hover:text-white dark:hover:bg-amber-600 dark:hover:border-amber-600 font-mono text-xl sm:text-2xl font-black text-stone-800 dark:text-zinc-100 transition-all active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
              id="kiosk-pin-btn-0"
            >
              0
            </button>

            {/* Backspace Button */}
            <button
              type="button"
              disabled={isSubmitting || pinCode.length === 0}
              onClick={handleBackspace}
              className="h-14 sm:h-16 rounded-2xl bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
              aria-label="Hapus Digit"
              id="kiosk-pin-btn-backspace"
            >
              <Delete className="h-5 w-5 mb-1" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
