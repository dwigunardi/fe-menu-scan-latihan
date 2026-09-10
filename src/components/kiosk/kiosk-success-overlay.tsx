'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, Clock, LogIn, LogOut, ArrowRight } from 'lucide-react';
import { StaffItem } from '@/lib/validations/staff.schema';
import { ATTENDANCE_TYPE, AttendanceType } from '@/lib/constants/attendance';
import { playSuccessChime } from '@/lib/utils/audio-feedback';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface KioskSuccessOverlayProps {
  isOpen: boolean;
  staff: StaffItem | null;
  mode: AttendanceType;
  onDismiss: () => void;
  autoCloseDurationMs?: number;
}

export function KioskSuccessOverlay({
  isOpen,
  staff,
  mode,
  onDismiss,
  autoCloseDurationMs = 3200,
}: KioskSuccessOverlayProps) {
  const [recordedTime, setRecordedTime] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(100);

  useEffect(() => {
    if (isOpen) {
      playSuccessChime();
      const now = new Date();
      setRecordedTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setProgressPercent(100);

      // Countdown ticker for progress bar
      const interval = 50;
      const step = (interval / autoCloseDurationMs) * 100;
      const timer = setInterval(() => {
        setProgressPercent((prev) => Math.max(0, prev - step));
      }, interval);

      // Auto dismiss
      const closeTimer = setTimeout(() => {
        onDismiss();
      }, autoCloseDurationMs);

      return () => {
        clearInterval(timer);
        clearTimeout(closeTimer);
      };
    }
  }, [isOpen, autoCloseDurationMs, onDismiss]);

  if (!isOpen || !staff) return null;

  const isClockIn = mode === ATTENDANCE_TYPE.CLOCK_IN;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 select-none"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 shadow-2xl p-6 sm:p-10 max-w-lg w-full flex flex-col items-center text-center relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated Background Ring */}
          <div
            className={cn(
              'absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-30',
              isClockIn ? 'bg-amber-400' : 'bg-emerald-400'
            )}
          />

          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', damping: 15, stiffness: 200 }}
            className={cn(
              'h-20 w-20 sm:h-24 sm:w-24 rounded-3xl flex items-center justify-center shadow-xl mb-6',
              isClockIn
                ? 'bg-amber-500 text-white shadow-amber-500/30'
                : 'bg-emerald-500 text-white shadow-emerald-500/30'
            )}
          >
            <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 stroke-[2.5]" />
          </motion.div>

          {/* Mode Pill */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3',
              isClockIn
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            )}
          >
            {isClockIn ? <LogIn className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
            {isClockIn ? 'Presensi Masuk Berhasil' : 'Presensi Pulang Berhasil'}
          </span>

          {/* Greeting Headline */}
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-zinc-50 tracking-tight mb-2">
            {isClockIn ? `Selamat Bertugas!` : `Terima Kasih Banyak!`}
          </h2>

          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-1">
            {staff.name}
          </p>

          <p className="text-xs text-stone-500 dark:text-zinc-400 mb-6">
            {staff.role} • NIK: {staff.employeeId || '-'}
          </p>

          {/* Timestamp Receipt Card */}
          <div className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-3 text-xs mb-6">
            <div className="flex items-center gap-2 text-stone-600 dark:text-zinc-300 font-semibold">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Waktu Tercatat:</span>
            </div>
            <span className="font-mono font-bold text-stone-900 dark:text-zinc-100 text-sm">
              {recordedTime}
            </span>
          </div>

          {/* Dismiss Button */}
          <Button
            type="button"
            onClick={onDismiss}
            className="w-full h-12 rounded-2xl font-bold text-sm bg-stone-900 hover:bg-stone-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 gap-2 cursor-pointer shadow-lg shadow-black/10"
            id="kiosk-success-done-btn"
          >
            <span>Lanjut ke Antrean Standby</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Countdown Progress Bar */}
          <div className="w-full mt-4 flex flex-col items-center gap-1.5">
            <div className="w-full h-1.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-75 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-stone-400 dark:text-zinc-500">
              Otomatis kembali dalam beberapa detik
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
