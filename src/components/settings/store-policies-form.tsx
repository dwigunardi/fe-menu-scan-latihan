'use client';

import React, { useState } from 'react';
import { BranchSetting, UpdateBranchSettingInput } from '@/lib/validations/branch-settings.schema';
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
} from 'lucide-react';

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
    description: 'Toko otomatis buka dan tutup secara terjadwal mengikuti jam buka (08:00 - 22:00) tanpa menunggu pembukaan kasir.',
    icon: Clock,
    color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'QRIS_ONLY',
    name: 'QRIS / Self-Order Only',
    description: 'Pelanggan langsung memesan dan bayar via QRIS mandiri di meja tanpa perlu konfirmasi kasir laci tunai.',
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

export function StorePoliciesForm({ initialData }: StorePoliciesFormProps) {
  const [storeMode, setStoreMode] = useState<string>(initialData.storeMode || 'SHIFT_DRIVEN');
  const [lateGracePeriod, setLateGracePeriod] = useState<number>(initialData.lateGracePeriod ?? 15);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(initialData.isStoreOpen ?? true);
  const [emergencyReason, setEmergencyReason] = useState<string>(initialData.emergencyReason || '');

  const updateBranchMutation = useUpdateBranchSettingMutation();
  const updateStatusMutation = useUpdateStoreStatusMutation();
  const isPending = updateBranchMutation.isPending || updateStatusMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpdateBranchSettingInput = {
      name: initialData.name,
      address: initialData.address,
      latitude: initialData.latitude,
      longitude: initialData.longitude,
      geofenceRadius: initialData.geofenceRadius,
      openTime: initialData.openTime,
      closeTime: initialData.closeTime,
      storeMode: storeMode as any,
      lateGracePeriod: Number(lateGracePeriod) || 0,
      timezone: initialData.timezone || 'Asia/Jakarta',
      phone: initialData.phone,
      email: initialData.email,
      schedules: initialData.schedules,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Store Operational Mode */}
      <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <Store className="h-4 w-4 text-amber-600" />
            Mode Operasional Toko (Store Mode)
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

      {/* 2. Attendance & Late Grace Period */}
      <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            Toleransi Keterlambatan Presensi (Late Grace Period)
          </h3>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Batas kelonggaran menit setelah jam mulai shift sebelum staf ditandai sebagai TERLAMBAT (LATE)
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

      {/* 3. Emergency Override */}
      <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              Kontingensi Darurat & Status Toko
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
              Gunakan saat terjadi kendala operasional tak terduga
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700 dark:text-zinc-300">
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
              placeholder="Contoh: Pemadaman listrik mendadak / Perbaikan mesin kopi"
              className="h-9 text-xs rounded-lg bg-white dark:bg-zinc-900"
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-xl h-10 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-md shadow-amber-600/20"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Kebijakan Toko'}
        </Button>
      </div>
    </form>
  );
}
