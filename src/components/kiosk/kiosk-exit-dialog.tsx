'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Lock, ShieldAlert, X, Delete, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { playErrorBeep } from '@/lib/utils/audio-feedback';
import { verifyStaffPin } from '@/lib/api/auth-api';
import { ApiError } from '@/lib/api/api-error';
import { getRateLimitMessage } from '@/lib/api/error-translator';
import { cn } from '@/lib/utils/cn';

const WRONG_PIN_MESSAGE = 'PIN kasir salah. Akses keluar ditolak.';

/** Maps a verify-pin API failure to a message for the cashier. */
function describeVerifyError(error: ApiError): string {
  if (error.statusCode === 0) {
    return 'Tidak dapat terhubung ke server. Coba lagi.';
  }
  if (error.statusCode === 404 || error.statusCode === 501) {
    return 'Verifikasi PIN belum tersedia di server.';
  }
  if (error.statusCode === 429) {
    // PIN lockout is shared with clock-in/out; the backend message says how many minutes are left
    return getRateLimitMessage(error) ?? 'Terlalu banyak percobaan. Tunggu sebentar.';
  }
  if (error.statusCode >= 400 && error.statusCode < 500) {
    return WRONG_PIN_MESSAGE;
  }
  return 'Gagal memverifikasi PIN. Coba lagi.';
}

interface KioskExitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  /** Escape hatch for a forgotten PIN: ends the session instead of returning to the POS. */
  onLogout?: () => void;
}

export function KioskExitDialog({
  isOpen,
  onClose,
  onConfirmExit,
  onLogout,
}: Readonly<KioskExitDialogProps>) {
  const { user } = useAuthStore();
  const [pinCode, setPinCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Reset the keypad each time the dialog opens (adjusting state during render instead of in an effect).
  const [wasOpen, setWasOpen] = useState<boolean>(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setPinCode('');
      setErrorMessage(null);
      setIsShaking(false);
      setIsVerifying(false);
    }
  }

  const verifyExit = useCallback(
    async (enteredPin: string) => {
      setIsVerifying(true);
      setErrorMessage(null);

      // The kiosk runs under the cashier's session. Leaving kiosk mode requires the PIN of
      // that logged-in cashier, verified server-side (POST /auth/verify-pin).
      try {
        if (!/^\d{4}$/.test(enteredPin)) {
          throw new Error('PIN kasir harus 4 angka');
        }

        const res = await verifyStaffPin(enteredPin);

        if (res.isLeft()) {
          throw new Error(describeVerifyError(res.value));
        }
        if (!res.value.valid) {
          throw new Error(WRONG_PIN_MESSAGE);
        }

        onConfirmExit();
      } catch (err: unknown) {
        setIsVerifying(false);
        setIsShaking(true);
        playErrorBeep();
        const msg = err instanceof Error ? err.message : 'PIN salah. Akses ditolak.';
        setErrorMessage(msg);
        setTimeout(() => {
          setIsShaking(false);
          setPinCode('');
        }, 800);
      }
    },
    [onConfirmExit]
  );

  const handleKeyPress = useCallback(
    async (num: string) => {
      if (isVerifying) return;

      if (pinCode.length < 4) {
        const nextPin = pinCode + num;
        setPinCode(nextPin);

        if (nextPin.length === 4) {
          await verifyExit(nextPin);
        }
      }
    },
    [pinCode, isVerifying, verifyExit]
  );

  const handleBackspace = useCallback(() => {
    if (isVerifying) return;
    setPinCode((prev) => prev.slice(0, -1));
  }, [isVerifying]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isVerifying && onClose()}>
      <DialogContent
        className="w-full max-w-sm p-0 overflow-hidden rounded-3xl border-stone-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 [&>button]:hidden"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Buka Kunci Mode Kios</DialogTitle>
          <DialogDescription>
            Masukkan PIN kasir untuk kembali ke workstation POS
          </DialogDescription>
        </DialogHeader>

        {/* Security Header */}
        <div className="p-6 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-zinc-50">
                Proteksi Keluar Kios
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Akun Kasir: <span className="font-bold text-stone-800 dark:text-zinc-200">{user?.name || 'Kasir Aktif'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            className="h-8 w-8 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer disabled:opacity-50"
            aria-label="Batal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* PIN Input & Numpad */}
        <div className="p-6 flex flex-col items-center">
          <p className="text-xs text-stone-500 dark:text-zinc-400 text-center mb-4">
            Masukkan 4-digit PIN Kasir/Supervisor untuk membuka kunci meja kasir:
          </p>

          {/* Dots Indicator */}
          <motion.div
            animate={isShaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-3 py-2"
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinCode.length > idx;
              return (
                <div
                  key={idx}
                  className={cn(
                    'h-5 w-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center',
                    isFilled
                      ? 'bg-rose-600 border-rose-600 scale-110 shadow-md shadow-rose-600/30'
                      : 'border-stone-300 dark:border-zinc-700 bg-stone-100 dark:bg-zinc-800'
                  )}
                >
                  {isFilled && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              );
            })}
          </motion.div>

          {/* Error / Loading Feedback */}
          <div className="h-6 mt-2 flex items-center justify-center">
            {errorMessage ? (
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                {errorMessage}
              </span>
            ) : isVerifying ? (
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memverifikasi hak akses kasir...
              </span>
            ) : null}
          </div>

          {/* Compact Numpad */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mt-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                disabled={isVerifying}
                onClick={() => handleKeyPress(num)}
                className="h-12 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:bg-rose-500 hover:border-rose-500 hover:text-white dark:hover:bg-rose-600 font-mono text-lg font-bold text-stone-800 dark:text-zinc-100 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                id={`kiosk-exit-btn-${num}`}
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              disabled={isVerifying}
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:bg-rose-500 hover:border-rose-500 hover:text-white dark:hover:bg-rose-600 font-mono text-lg font-bold text-stone-800 dark:text-zinc-100 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              id="kiosk-exit-btn-0"
            >
              0
            </button>
            <button
              type="button"
              disabled={isVerifying || pinCode.length === 0}
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              aria-label="Hapus"
              id="kiosk-exit-btn-backspace"
            >
              <Delete className="h-4 w-4" />
            </button>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              disabled={isVerifying}
              className="mt-5 text-[11px] font-semibold text-stone-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:underline underline-offset-2 cursor-pointer disabled:opacity-50"
              id="kiosk-exit-btn-logout"
            >
              Lupa PIN? Keluar akun &amp; login ulang
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
