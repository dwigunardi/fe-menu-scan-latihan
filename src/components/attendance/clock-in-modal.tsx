'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
} from 'lucide-react';
import { useAdminBranchSettingQuery } from '@/hooks/queries/use-admin-settings';
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
  const { data: branchSetting } = useAdminBranchSettingQuery();
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

  const handleKeypadPress = (num: string) => {
    if (pinCode.length < 4) {
      setPinCode((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
  };

  const handleClearPin = () => {
    setPinCode('');
  };

  const handleSubmit = async () => {
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
  };

  const activeStaffList = (staffData?.items || []).filter((s) => s.isActive);
  const isSubmitting = clockInMutation.isPending || clockOutMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl">
        {/* Header with Mode Switcher */}
        <div className="p-5 border-b border-stone-200/80 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-800/40">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Presensi Smart Geofence
              </span>
              <span className="text-[11px] font-mono text-stone-400">Radius: {branchRadius}m</span>
            </div>
            <DialogTitle className="text-lg font-black text-stone-900 dark:text-zinc-100">
              Terminal Presensi Staf Kafe
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
              Pilih nama akun staf Anda dan masukkan 4-digit PIN rahasia.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-stone-200/60 dark:bg-zinc-800 rounded-2xl">
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

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* GPS Geofence Status Badge */}
          <div
            className={cn(
              'p-3.5 rounded-2xl border transition-all text-xs',
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
              <div className="flex items-center gap-2">
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                ) : gpsError ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : geofenceResult?.isInside ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}

                <div>
                  <p className="font-bold">
                    {isLocating
                      ? 'Mendeteksi Posisi Geofence GPS...'
                      : gpsError
                      ? gpsError
                      : geofenceResult?.isInside
                      ? 'Posisi Dalam Jangkauan Kafe'
                      : 'Posisi di Luar Jangkauan Kafe'}
                  </p>
                  {!isLocating && !gpsError && geofenceResult && (
                    <p className="text-[11px] opacity-90">
                      Jarak dari titik cabang: <strong>{geofenceResult.distanceMeters} meter</strong> (Maks: {branchRadius}m)
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
                className="h-8 px-2 text-[11px] rounded-xl font-bold cursor-pointer"
              >
                <RotateCcw className={cn('w-3.5 h-3.5 mr-1', isLocating && 'animate-spin')} />
                Segarkan
              </Button>
            </div>
          </div>

          {/* 1. Select Staff */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-select" className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>Nama Karyawan *</span>
            </Label>
            <select
              id="staff-select"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
            >
              <option value="">-- Pilih Nama Staf --</option>
              {activeStaffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.role})
                </option>
              ))}
            </select>
          </div>

          {/* 2. 4-Digit PIN Display & Keypad */}
          <div className="space-y-2 text-center pt-1">
            <Label className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center justify-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>PIN 4-Digit Rahasia</span>
            </Label>

            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-3 py-2">
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
            <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-11 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-900 dark:text-white font-bold text-base transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearPin}
                className="h-11 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-400 font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-11 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-900 dark:text-white font-bold text-base transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                aria-label="Hapus satu angka"
                className="h-11 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-400 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Optional Notes */}
          <div className="space-y-1 pt-1">
            <Label htmlFor="attendance-notes" className="text-[11px] font-medium text-stone-500 dark:text-zinc-400">
              Catatan Khusus (Opsional)
            </Label>
            <Input
              id="attendance-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Terlambat karena hujan lebat / Ban bocor"
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-2.5 bg-stone-50/50 dark:bg-zinc-800/40">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-semibold h-10 px-4"
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
              'rounded-xl text-xs font-bold h-10 px-5 text-white shadow-md transition-all active:scale-95',
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
      </DialogContent>
    </Dialog>
  );
}
