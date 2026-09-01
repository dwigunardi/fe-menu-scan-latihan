'use client';

import React, { useState } from 'react';
import {
  BranchSetting,
  UpdateBranchSettingInput,
  DaySchedule,
  DAY_OF_WEEK,
} from '@/lib/validations/branch-settings.schema';
import {
  useUpdateBranchSettingMutation,
  useUpdateStoreStatusMutation,
} from '@/hooks/queries/use-admin-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ShieldAlert,
  Clock,
  Store,
  Layers,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Lock,
  Calendar,
  Sparkles,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { UnsavedChangesDialog } from '@/components/common';

interface StorePoliciesFormProps {
  initialData: BranchSetting;
}

const STORE_MODES = [
  {
    id: 'SHIFT_DRIVEN',
    name: 'Shift Driven (Rekomendasi POS)',
    description: 'Menu QR pelanggan aktif saat staf kasir melakukan Buka Shift (Open Cashier Shift) dan terkunci otomatis saat shift ditutup.',
    icon: Layers,
    color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'CLOCK_DRIVEN',
    name: 'Clock Driven (Jam Digital Otomatis)',
    description: 'Toko otomatis buka dan tutup secara terjadwal mengikuti jam buka operasional toko tanpa menunggu pembukaan kasir.',
    icon: Clock,
    color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'QRIS_ONLY',
    name: 'QRIS / Self-Order Only',
    description: 'Pelanggan langsung memesan dan membayar via QRIS mandiri di meja tanpa perlu konfirmasi kasir laci tunai.',
    icon: QrCode,
    color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
  },
  {
    id: 'EMERGENCY_CLOSED',
    name: 'Tutup Darurat (Emergency Close)',
    description: 'Mengunci seluruh menu dan pemesanan seketika karena kendala darurat (mati listrik, renovasi, kehabisan stok total).',
    icon: Lock,
    color: 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300',
  },
];

const DAYS_META: { key: DaySchedule['day']; label: string }[] = [
  { key: DAY_OF_WEEK.MONDAY, label: 'Senin' },
  { key: DAY_OF_WEEK.TUESDAY, label: 'Selasa' },
  { key: DAY_OF_WEEK.WEDNESDAY, label: 'Rabu' },
  { key: DAY_OF_WEEK.THURSDAY, label: 'Kamis' },
  { key: DAY_OF_WEEK.FRIDAY, label: 'Jumat' },
  { key: DAY_OF_WEEK.SATURDAY, label: 'Sabtu' },
  { key: DAY_OF_WEEK.SUNDAY, label: 'Minggu' },
];

function buildDefaultSchedules(openTime: string, closeTime: string): DaySchedule[] {
  return DAYS_META.map((d) => ({
    day: d.key,
    isOpen: true,
    openTime,
    closeTime,
  }));
}

export function StorePoliciesForm({ initialData }: StorePoliciesFormProps) {
  const updateBranchMutation = useUpdateBranchSettingMutation();
  const updateStatusMutation = useUpdateStoreStatusMutation();
  const isPending = updateBranchMutation.isPending || updateStatusMutation.isPending;

  // 1. Store Mode
  const [storeMode, setStoreMode] = useState<string>(initialData.storeMode || 'SHIFT_DRIVEN');

  // 2. Emergency Kill-Switch & Reason
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(initialData.isStoreOpen ?? true);
  const [emergencyReason, setEmergencyReason] = useState<string>(initialData.emergencyReason || '');

  // 3. Late Grace Period
  const [lateGracePeriod, setLateGracePeriod] = useState<number>(initialData.lateGracePeriod ?? 15);

  // 4. Store Hours & Weekly Schedule
  const [openTime, setOpenTime] = useState<string>(initialData.openTime || '08:00');
  const [closeTime, setCloseTime] = useState<string>(initialData.closeTime || '22:00');

  // Detect if existing schedules deviate from default
  const hasCustomExistingSchedules = Boolean(
    initialData.schedules &&
      initialData.schedules.length > 0 &&
      initialData.schedules.some(
        (s) => !s.isOpen || s.openTime !== initialData.openTime || s.closeTime !== initialData.closeTime
      )
  );
  const [isCustomSchedulesEnabled, setIsCustomSchedulesEnabled] = useState<boolean>(hasCustomExistingSchedules);

  const [schedules, setSchedules] = useState<DaySchedule[]>(() => {
    if (initialData.schedules && initialData.schedules.length > 0) {
      return initialData.schedules;
    }
    return buildDefaultSchedules(initialData.openTime || '08:00', initialData.closeTime || '22:00');
  });

  const handleApplyMondayToAll = () => {
    const monday = schedules.find((s) => s.day === DAY_OF_WEEK.MONDAY) || {
      openTime: openTime || '08:00',
      closeTime: closeTime || '22:00',
      isOpen: true,
    };

    setSchedules((prev) =>
      prev.map((item) => ({
        ...item,
        isOpen: monday.isOpen,
        openTime: monday.openTime,
        closeTime: monday.closeTime,
      }))
    );
    toast.success('Jadwal hari Senin berhasil disalin ke seluruh hari!');
  };

  const handleUpdateScheduleDay = (
    dayKey: DaySchedule['day'],
    updates: Partial<Omit<DaySchedule, 'day'>>
  ) => {
    setSchedules((prev) =>
      prev.map((item) => (item.day === dayKey ? { ...item, ...updates } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If custom schedules toggle is off, sync all 7 days with the standard open/close time
    const finalSchedules: DaySchedule[] = isCustomSchedulesEnabled
      ? schedules
      : buildDefaultSchedules(openTime, closeTime);

    const payload: UpdateBranchSettingInput = {
      name: initialData.name,
      address: initialData.address,
      latitude: initialData.latitude,
      longitude: initialData.longitude,
      geofenceRadius: initialData.geofenceRadius,
      openTime,
      closeTime,
      storeMode: storeMode as any,
      lateGracePeriod: Number(lateGracePeriod) || 0,
      timezone: initialData.timezone || 'Asia/Jakarta',
      phone: initialData.phone,
      email: initialData.email,
      schedules: finalSchedules,
    };

    await updateBranchMutation.mutateAsync(payload);

    if (isStoreOpen !== initialData.isStoreOpen || storeMode === 'EMERGENCY_CLOSED') {
      await updateStatusMutation.mutateAsync({
        isStoreOpen,
        storeMode: storeMode as any,
        emergencyReason: storeMode === 'EMERGENCY_CLOSED' || !isStoreOpen ? emergencyReason.trim() : null,
      });
    }
  };

  const isStoreModeDirty = storeMode !== (initialData.storeMode || 'SHIFT_DRIVEN');
  const isStoreOpenDirty = isStoreOpen !== (initialData.isStoreOpen ?? true);
  const isEmergencyReasonDirty = emergencyReason !== (initialData.emergencyReason || '');
  const isLateGracePeriodDirty = lateGracePeriod !== (initialData.lateGracePeriod ?? 15);
  const isOpenTimeDirty = openTime !== (initialData.openTime || '08:00');
  const isCloseTimeDirty = closeTime !== (initialData.closeTime || '22:00');
  const isCustomSchedulesToggleDirty = isCustomSchedulesEnabled !== hasCustomExistingSchedules;
  const isSchedulesDirty =
    isCustomSchedulesEnabled &&
    JSON.stringify(schedules) !== JSON.stringify(initialData.schedules || []);

  const isDirty =
    isStoreModeDirty ||
    isStoreOpenDirty ||
    isEmergencyReasonDirty ||
    isLateGracePeriodDirty ||
    isOpenTimeDirty ||
    isCloseTimeDirty ||
    isCustomSchedulesToggleDirty ||
    isSchedulesDirty;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <UnsavedChangesDialog isDirty={isDirty} />
      {/* SECTION 1: Store Operational Mode */}
      <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <Store className="h-4 w-4 text-amber-600" />
            <span>1. Mode Operasional Toko (Store Mode)</span>
          </h3>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Tentukan bagaimana alur buka-tutup pesanan pelanggan dan kasir beroperasi
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {STORE_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = storeMode === mode.id;

            return (
              <div
                key={mode.id}
                onClick={() => setStoreMode(mode.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${mode.color} shadow-sm ring-1 ring-amber-500/30`
                    : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 bg-stone-50/50 dark:bg-zinc-800/30 text-stone-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-bold">{mode.name}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />}
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">{mode.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Emergency Master Kill-Switch */}
      <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span>2. Saklar Darurat & Status Buka Toko (Emergency Kill-Switch)</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
              Gunakan saklar ini saat terjadi kendala darurat tak terduga (pemadaman listrik, renovasi mendadak)
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isStoreOpen
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              }`}
            >
              {isStoreOpen ? 'Toko Buka' : 'Toko Ditutup'}
            </span>
            <Switch
              checked={isStoreOpen}
              onCheckedChange={(checked) => setIsStoreOpen(checked)}
            />
          </div>
        </div>

        {(!isStoreOpen || storeMode === 'EMERGENCY_CLOSED') && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-2 animate-in fade-in duration-200">
            <Label htmlFor="emergency-reason" className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Alasan Penutupan Toko (Akan tampil pada banner QR pelanggan)
            </Label>
            <Input
              id="emergency-reason"
              value={emergencyReason}
              onChange={(e) => setEmergencyReason(e.target.value)}
              placeholder="Contoh: Pemadaman listrik mendadak / Perbaikan mesin espresso"
              className="h-9 text-xs rounded-lg bg-white dark:bg-zinc-900 border-rose-300 dark:border-rose-800"
            />
          </div>
        )}
      </div>

      {/* SECTION 3: Attendance & Late Grace Period */}
      <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span>3. Toleransi Keterlambatan Presensi (Late Grace Period)</span>
          </h3>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Batas kelonggaran menit setelah jam mulai shift sebelum staf otomatis ditandai TERLAMBAT
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="space-y-1.5">
            <Label htmlFor="late-grace" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
              Durasi Toleransi (Menit)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="late-grace"
                type="number"
                min="0"
                max="120"
                value={lateGracePeriod}
                onChange={(e) => setLateGracePeriod(Number(e.target.value))}
                className="h-9 text-xs font-mono font-bold rounded-xl w-32"
                required
              />
              <span className="text-xs font-medium text-stone-500">Menit setelah shift mulai</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[0, 5, 10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setLateGracePeriod(mins)}
                className={`h-8 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  lateGracePeriod === mins
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:bg-stone-50'
                }`}
              >
                {mins === 0 ? 'Ketat (0 mnt)' : `${mins} Menit`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: Jam Operasional Toko & Jadwal Mingguan Fleksibel */}
      <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span>4. Jam Operasional Toko & Jadwal Mingguan</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
              Tentukan jam buka dan tutup standar kafe serta opsi jadwal khusus untuk hari sepi atau weekend
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto p-1.5 px-3 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
            <Label htmlFor="toggle-custom-schedules" className="text-xs font-bold text-stone-700 dark:text-zinc-300 cursor-pointer">
              Atur Jadwal Khusus per Hari
            </Label>
            <Switch
              id="toggle-custom-schedules"
              checked={isCustomSchedulesEnabled}
              onCheckedChange={(checked) => setIsCustomSchedulesEnabled(checked)}
            />
          </div>
        </div>

        {/* Standard Store Hours */}
        <div className="p-4 rounded-xl bg-stone-50/60 dark:bg-zinc-800/40 border border-stone-200/80 dark:border-zinc-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 dark:text-zinc-200">
              Jam Standar Kafe (Default):
            </span>
            {!isCustomSchedulesEnabled && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                Berlaku untuk seluruh hari (Senin - Minggu)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="standard-open-time" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                Jam Buka Standar
              </Label>
              <Input
                id="standard-open-time"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="h-9 text-xs font-mono font-bold rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="standard-close-time" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                Jam Tutup Standar
              </Label>
              <Input
                id="standard-close-time"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="h-9 text-xs font-mono font-bold rounded-xl"
                required
              />
            </div>
          </div>
        </div>

        {/* Custom Daily Schedule List (Visible when isCustomSchedulesEnabled is ON) */}
        {isCustomSchedulesEnabled && (
          <div className="space-y-3 pt-2 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-stone-800 dark:text-zinc-200">
                Kustomisasi Jam Buka-Tutup 7 Hari (Senin - Minggu):
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyMondayToAll}
                className="h-7.5 text-[11px] font-bold gap-1 rounded-lg border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:text-amber-600 self-start sm:self-auto cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-amber-600" />
                <span>Salin Jam Senin ke Semua Hari</span>
              </Button>
            </div>

            <div className="space-y-2 border border-stone-200/80 dark:border-zinc-800 rounded-xl divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
              {DAYS_META.map((d) => {
                const currentDaySchedule = schedules.find((s) => s.day === d.key) || {
                  day: d.key,
                  isOpen: true,
                  openTime: openTime || '08:00',
                  closeTime: closeTime || '22:00',
                };

                return (
                  <div
                    key={d.key}
                    className={`p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      currentDaySchedule.isOpen
                        ? 'bg-white dark:bg-zinc-900'
                        : 'bg-stone-50/60 dark:bg-zinc-900/40 opacity-70'
                    }`}
                  >
                    {/* Day name & toggle */}
                    <div className="flex items-center gap-3 w-36 shrink-0">
                      <Switch
                        checked={currentDaySchedule.isOpen}
                        onCheckedChange={(checked) =>
                          handleUpdateScheduleDay(d.key, { isOpen: checked })
                        }
                      />
                      <span className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                        {d.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          currentDaySchedule.isOpen
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60'
                            : 'text-stone-500 bg-stone-100 dark:bg-zinc-800'
                        }`}
                      >
                        {currentDaySchedule.isOpen ? 'Buka' : 'Libur'}
                      </span>
                    </div>

                    {/* Hours input */}
                    {currentDaySchedule.isOpen ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-stone-500">Buka:</span>
                          <Input
                            type="time"
                            value={currentDaySchedule.openTime}
                            onChange={(e) =>
                              handleUpdateScheduleDay(d.key, { openTime: e.target.value })
                            }
                            className="h-8 w-26 text-xs font-mono font-bold rounded-lg"
                          />
                        </div>
                        <span className="text-stone-400">-</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-stone-500">Tutup:</span>
                          <Input
                            type="time"
                            value={currentDaySchedule.closeTime}
                            onChange={(e) =>
                              handleUpdateScheduleDay(d.key, { closeTime: e.target.value })
                            }
                            className="h-8 w-26 text-xs font-mono font-bold rounded-lg"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400 italic">
                        Toko ditutup sepanjang hari ini
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Submit Action Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-xl h-10 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-md shadow-amber-600/20 flex items-center gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Simpan Seluruh Kebijakan Toko</span>
        </Button>
      </div>
    </form>
  );
}
