'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Clock,
  KeyRound,
  Delete,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Navigation,
  User,
  X,
} from 'lucide-react';
import { usePublicBranchLocationQuery } from '@/hooks/queries/use-admin-settings';
import { useAdminStaffPaginatedQuery } from '@/hooks/queries/use-admin-staff';
import { useClockInMutation, useClockOutMutation } from '@/hooks/queries/use-admin-attendance';
import { checkGeofence, GeofenceCheckResult } from '@/lib/utils/haversine';
import { ATTENDANCE_TYPE, AttendanceType } from '@/lib/constants/attendance';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClockInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: branchSetting } = usePublicBranchLocationQuery();
  const { data: staffData } = useAdminStaffPaginatedQuery({ limit: 50 });
  const clockInMutation = useClockInMutation();
  const clockOutMutation = useClockOutMutation();

  const [mode, setMode] = useState<AttendanceType>(ATTENDANCE_TYPE.CLOCK_IN);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // GPS Geolocation state
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geofenceResult, setGeofenceResult] = useState<GeofenceCheckResult | null>(null);

  const branchLat = branchSetting?.latitude ?? -6.2297465;
  const branchLon = branchSetting?.longitude ?? 106.8557342;
  const branchRadius = branchSetting?.geofenceRadius ?? 100;

  const requestGpsPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung pendeteksian lokasi Geolocation.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserCoords({ lat, lon });

        const result = checkGeofence(lat, lon, branchLat, branchLon, branchRadius);
        setGeofenceResult(result);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Izin akses lokasi GPS ditolak oleh browser.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('Sinyal GPS lokasi tidak terdeteksi.');
        } else {
          setGpsError('Waktu permintaan lokasi habis (timeout).');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [branchLat, branchLon, branchRadius]);

  useEffect(() => {
    if (isOpen) {
      setPinCode('');
      setNotes('');
      requestGpsPosition();
    }
  }, [isOpen, requestGpsPosition]);

  // Recalculate geofence immediately when branchSetting arrives or updates
  useEffect(() => {
    if (userCoords && branchSetting && branchSetting.latitude && branchSetting.longitude) {
      const result = checkGeofence(
        userCoords.lat,
        userCoords.lon,
        branchSetting.latitude,
        branchSetting.longitude,
        branchSetting.geofenceRadius || 100
      );
      setGeofenceResult(result);
    }
  }, [userCoords, branchSetting]);

  const handleKeypadPress = useCallback((num: string) => {
    setPinCode((prev) => (prev.length < 4 ? prev + num : prev));
  }, []);

  const handleBackspace = useCallback(() => {
    setPinCode((prev) => prev.slice(0, -1));
  }, []);

  const handleClearPin = useCallback(() => {
    setPinCode('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedStaffId) {
      toast.error('Pilih nama staf terlebih dahulu');
      return;
    }

    if (pinCode.length !== 4) {
      toast.error('Masukkan 4 digit PIN presensi Anda');
      return;
    }

    if (!userCoords) {
      toast.error('Menunggu deteksi lokasi GPS kafe');
      return;
    }

    if (geofenceResult && !geofenceResult.isInside) {
      toast.error(
        `Presensi ditolak! Posisi Anda berada ${geofenceResult.distanceMeters}m dari cabang (Batas toleransi: ${branchRadius}m)`
      );
      return;
    }

    try {
      if (mode === ATTENDANCE_TYPE.CLOCK_IN) {
        await clockInMutation.mutateAsync({
          staffId: selectedStaffId,
          pinCode,
          latitude: userCoords.lat,
          longitude: userCoords.lon,
          notes: notes.trim() || undefined,
        });
      } else {
        await clockOutMutation.mutateAsync({
          staffId: selectedStaffId,
          pinCode,
          latitude: userCoords.lat,
          longitude: userCoords.lon,
          notes: notes.trim() || undefined,
        });
      }

      onClose();
    } catch {
      // Error handled in notifyApiError
    }
  }, [
    selectedStaffId,
    pinCode,
    userCoords,
    geofenceResult,
    branchRadius,
    mode,
    notes,
    clockInMutation,
    clockOutMutation,
    onClose,
  ]);

  // Physical Keyboard Listener (0-9, Backspace, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in the notes text input
      const target = e.target as HTMLElement;
      if (target && target.id === 'attendance-notes') {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedStaffId && pinCode.length === 4 && (!geofenceResult || geofenceResult.isInside)) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    selectedStaffId,
    pinCode,
    geofenceResult,
    handleSubmit,
    handleKeypadPress,
    handleBackspace,
    onClose,
  ]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onClose();
    }
  };

  const activeStaffList = (staffData?.items || []).filter((s) => s.isActive);
  const isSubmitting = clockInMutation.isPending || clockOutMutation.isPending;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop Overlay with fade animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 cursor-pointer"
          />

          {/* Modal / Drawer Content Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="relative z-50 w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-[32px] sm:rounded-3xl border border-stone-200/80 dark:border-zinc-800 shadow-2xl max-h-[94vh] sm:max-h-[88vh] flex flex-col overflow-hidden safe-area-pb"
          >
            {/* Mobile Pull / Drag Indicator */}
            <div className="pt-3 pb-1 flex flex-col items-center shrink-0 sm:hidden">
              <div className="w-12 h-1.5 bg-stone-300 dark:bg-zinc-700 rounded-full cursor-grab active:cursor-grabbing" />
            </div>

            {/* Header with Mode Switcher */}
            <div className="p-4 sm:p-5 border-b border-stone-200/80 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-800/40 shrink-0">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Presensi Smart Geofence
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-stone-400">Radius: {branchRadius}m</span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                    aria-label="Tutup modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-1 space-y-0.5">
                <h2 className="text-lg font-black text-stone-900 dark:text-zinc-100">
                  Terminal Presensi Staf Kafe
                </h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Pilih nama akun staf Anda dan masukkan 4-digit PIN rahasia.
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 gap-2 mt-3 p-1 bg-stone-200/60 dark:bg-zinc-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setMode(ATTENDANCE_TYPE.CLOCK_IN)}
                  className={cn(
                    'py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    mode === ATTENDANCE_TYPE.CLOCK_IN
                      ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
                  )}
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Presensi Masuk (Clock-In)
                </button>
                <button
                  type="button"
                  onClick={() => setMode(ATTENDANCE_TYPE.CLOCK_OUT)}
                  className={cn(
                    'py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    mode === ATTENDANCE_TYPE.CLOCK_OUT
                      ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-xs'
                      : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
                  )}
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-600" />
                  Presensi Pulang (Clock-Out)
                </button>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5 flex-1 overflow-y-auto overscroll-contain">
              {/* GPS Geofence Status Badge */}
              <div
                className={cn(
                  'p-3 rounded-2xl border transition-all text-xs',
                  isLocating
                    ? 'bg-stone-100 dark:bg-zinc-800/80 border-stone-200 text-stone-600'
                    : gpsError
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
                    : geofenceResult?.isInside
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isLocating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                    ) : gpsError ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : geofenceResult?.isInside ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}

                    <div className="min-w-0">
                      <p className="font-bold truncate">
                        {isLocating
                          ? 'Mendeteksi Posisi Geofence GPS...'
                          : gpsError
                          ? gpsError
                          : geofenceResult?.isInside
                          ? 'Posisi Dalam Jangkauan Kafe'
                          : 'Posisi di Luar Jangkauan Kafe'}
                      </p>
                      {!isLocating && !gpsError && geofenceResult && (
                        <p className="text-[11px] opacity-90 truncate">
                          Jarak dari cabang: <strong>{geofenceResult.distanceMeters}m</strong> (Maks: {branchRadius}m)
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={requestGpsPosition}
                    disabled={isLocating}
                    className="h-7.5 px-2 text-[11px] rounded-xl font-bold shrink-0 cursor-pointer"
                  >
                    <RotateCcw className={cn('w-3.5 h-3.5 mr-1', isLocating && 'animate-spin')} />
                    Segarkan
                  </Button>
                </div>
              </div>

              {/* 1. Select Staff using Shadcn UI Select */}
              <div className="space-y-1">
                <Label htmlFor="staff-select" className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nama Karyawan *</span>
                </Label>
                <Select
                  value={selectedStaffId}
                  onValueChange={(val) => setSelectedStaffId(val)}
                >
                  <SelectTrigger id="staff-select" className="w-full h-9.5 px-3 text-xs font-medium rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer shadow-2xs">
                    <SelectValue placeholder="-- Pilih Nama Staf --" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl max-h-60 z-[60]">
                    {activeStaffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id} className="text-xs py-2 rounded-xl cursor-pointer">
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="font-semibold text-stone-900 dark:text-zinc-100">{staff.name}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {staff.role}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. 4-Digit PIN Display & Keypad */}
              <div className="space-y-2 text-center pt-0.5">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>PIN 4-Digit Rahasia *</span>
                  </Label>
                  <span className="text-[10px] text-stone-400 dark:text-zinc-500 hidden sm:inline">
                    ⌨️ Ketik langsung di keyboard
                  </span>
                </div>

                {/* PIN Dots Display */}
                <div className="flex items-center justify-center gap-2.5 py-1">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = pinCode.length > idx;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'w-10 h-10 rounded-2xl border-2 flex items-center justify-center text-lg font-black transition-all',
                          filled
                            ? 'border-amber-500 bg-amber-500/10 text-amber-600 scale-105 shadow-xs'
                            : 'border-stone-300 dark:border-zinc-700 bg-stone-100 dark:bg-zinc-800 text-stone-400'
                        )}
                      >
                        {filled ? '●' : ''}
                      </div>
                    );
                  })}
                </div>

                {/* Numeric Keypad Grid */}
                <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadPress(digit)}
                      className="h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-900 dark:text-white font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-2xs"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearPin}
                    className="h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-400 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-900 dark:text-white font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    aria-label="Hapus satu angka"
                    className="h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-400 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3. Optional Notes */}
              <div className="space-y-1 pt-0.5">
                <Label htmlFor="attendance-notes" className="text-[11px] font-medium text-stone-500 dark:text-zinc-400">
                  Catatan Khusus (Opsional)
                </Label>
                <Input
                  id="attendance-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Terlambat karena hujan lebat / Ban bocor"
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Sticky Modal Footer (Never cut off) */}
            <div className="p-3.5 sm:p-4 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-2.5 bg-stone-50/80 dark:bg-zinc-800/60 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl text-xs font-semibold h-9.5 px-4 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !selectedStaffId ||
                  pinCode.length !== 4 ||
                  (geofenceResult !== null && !geofenceResult.isInside)
                }
                className={cn(
                  'rounded-xl text-xs font-bold h-9.5 px-5 text-white shadow-md transition-all active:scale-95 cursor-pointer',
                  mode === ATTENDANCE_TYPE.CLOCK_IN
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                )}
                <span>
                  {mode === ATTENDANCE_TYPE.CLOCK_IN ? 'Konfirmasi Clock-In' : 'Konfirmasi Clock-Out'}
                </span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
