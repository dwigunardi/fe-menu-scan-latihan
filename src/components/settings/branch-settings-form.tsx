'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MapPin,
  Save,
  Loader2,
  Sliders,
  Phone,
  Mail,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { reverseGeocode } from '@/lib/utils/geocoding';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'motion/react';
import { BranchMapPicker } from './branch-map-picker';
import {
  BranchSetting,
  UpdateBranchSettingInput,
  UpdateBranchSettingInputSchema,
} from '@/lib/validations/branch-settings.schema';
import { useUpdateBranchSettingMutation } from '@/hooks/queries/use-admin-settings';
import { UnsavedChangesDialog } from '@/components/common';

const GEOFENCE_PRESETS = [50, 100, 150, 200, 300, 500];

interface BranchSettingsFormProps {
  initialData: BranchSetting;
}

export function BranchSettingsForm({ initialData }: BranchSettingsFormProps) {
  const updateMutation = useUpdateBranchSettingMutation();
  const [isSyncingAddress, setIsSyncingAddress] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateBranchSettingInput>({
    resolver: zodResolver(UpdateBranchSettingInputSchema) as any,
    defaultValues: {
      name: initialData.name,
      address: initialData.address,
      latitude: initialData.latitude,
      longitude: initialData.longitude,
      geofenceRadius: initialData.geofenceRadius,
      openTime: initialData.openTime,
      closeTime: initialData.closeTime,
      lateGracePeriod: initialData.lateGracePeriod,
      storeMode: initialData.storeMode,
      timezone: initialData.timezone || 'Asia/Jakarta',
      phone: initialData.phone || '',
      email: initialData.email || '',
      schedules: initialData.schedules,
    },
  });

  const currentLat = watch('latitude') ?? initialData.latitude;
  const currentLon = watch('longitude') ?? initialData.longitude;
  const currentRadius = watch('geofenceRadius') ?? initialData.geofenceRadius;

  useEffect(() => {
    reset({
      name: initialData.name,
      address: initialData.address,
      latitude: initialData.latitude,
      longitude: initialData.longitude,
      geofenceRadius: initialData.geofenceRadius,
      openTime: initialData.openTime,
      closeTime: initialData.closeTime,
      lateGracePeriod: initialData.lateGracePeriod,
      storeMode: initialData.storeMode,
      timezone: initialData.timezone || 'Asia/Jakarta',
      phone: initialData.phone || '',
      email: initialData.email || '',
      schedules: initialData.schedules,
    });
  }, [initialData, reset]);

  const handleCoordinatesChange = (lat: number, lon: number, resolvedAddress?: string) => {
    setValue('latitude', lat, { shouldDirty: true, shouldValidate: true });
    setValue('longitude', lon, { shouldDirty: true, shouldValidate: true });
    if (resolvedAddress) {
      setValue('address', resolvedAddress, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleResetChanges = () => {
    reset({
      name: initialData.name,
      address: initialData.address,
      latitude: initialData.latitude,
      longitude: initialData.longitude,
      geofenceRadius: initialData.geofenceRadius,
      openTime: initialData.openTime,
      closeTime: initialData.closeTime,
      lateGracePeriod: initialData.lateGracePeriod,
      storeMode: initialData.storeMode,
      timezone: initialData.timezone || 'Asia/Jakarta',
      phone: initialData.phone || '',
      email: initialData.email || '',
      schedules: initialData.schedules,
    });
  };

  const onFormSubmit = async (data: UpdateBranchSettingInput) => {
    await updateMutation.mutateAsync({
      ...initialData,
      ...data,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
    });
    reset(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <UnsavedChangesDialog isDirty={isDirty} />
      {/* Desktop 2-Column Split Screen / Mobile Single Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Branch Identity & Geofence Form */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Branch Identity Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-600" />
              <span>Identitas & Alamat Cabang</span>
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="branch-name" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                Nama Cabang *
              </Label>
              <Input
                id="branch-name"
                {...register('name')}
                placeholder="Contoh: Kumpul Cafe - Cabang Pusat"
                className="h-10 text-xs rounded-xl"
              />
              {errors.name && (
                <p className="text-xs text-rose-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="branch-address" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                  Alamat Lengkap *
                </Label>
                <button
                  type="button"
                  onClick={async () => {
                    setIsSyncingAddress(true);
                    const addr = await reverseGeocode(currentLat, currentLon);
                    setIsSyncingAddress(false);
                    if (addr) {
                      setValue('address', addr, { shouldDirty: true, shouldValidate: true });
                      toast.success('Alamat berhasil disinkronkan dari titik peta!');
                    } else {
                      toast.error('Gagal mendeteksi alamat dari koordinat peta.');
                    }
                  }}
                  disabled={isSyncingAddress}
                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncingAddress ? 'animate-spin' : ''}`} />
                  <span>Sinkronkan dari Peta</span>
                </button>
              </div>
              <Textarea
                id="branch-address"
                {...register('address')}
                placeholder="Alamat fisik lengkap kafe untuk panduan kurir & staf..."
                className="text-xs rounded-xl min-h-[70px] resize-none"
              />
              {errors.address && (
                <p className="text-xs text-rose-500 font-medium">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="branch-phone" className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-stone-400" />
                  <span>No. Telepon / WA</span>
                </Label>
                <Input
                  id="branch-phone"
                  {...register('phone')}
                  placeholder="081234567890"
                  className="h-9.5 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch-email" className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1">
                  <Mail className="h-3 w-3 text-stone-400" />
                  <span>Email Cabang</span>
                </Label>
                <Input
                  id="branch-email"
                  {...register('email')}
                  placeholder="cabang@kumpulcafe.com"
                  className="h-9.5 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* 2. Geofence Radius & Coordinates Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-600" />
              <span>Batas Radius Geofence Presensi</span>
            </h3>

            {/* Slider */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="geofence-radius-range" className="text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer">
                  Radius Batas Absensi:
                </Label>
                <span className="font-mono font-bold text-sm text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-md bg-amber-500/20">
                  {currentRadius} Meter
                </span>
              </div>

              <input
                id="geofence-radius-range"
                type="range"
                min="50"
                max="500"
                step="10"
                value={currentRadius}
                onChange={(e) =>
                  setValue('geofenceRadius', parseInt(e.target.value, 10), {
                    shouldDirty: true,
                  })
                }
                className="w-full accent-amber-600 h-2 bg-amber-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
              />

              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {GEOFENCE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setValue('geofenceRadius', preset, {
                        shouldDirty: true,
                      })
                    }
                    className={`h-6 px-2 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                      currentRadius === preset
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:bg-stone-50'
                    }`}
                  >
                    {preset}m
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                Staf hanya dapat melakukan Clock-In presensi jika berada di dalam radius {currentRadius} meter dari titik kafe.
              </p>
            </div>

            {/* Coordinates Lat & Lon Display */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-stone-500 dark:text-zinc-400 flex items-center gap-1">
                  <Compass className="h-3 w-3" />
                  Latitude
                </span>
                <p className="text-xs font-mono font-bold text-stone-800 dark:text-zinc-200 bg-stone-50 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-stone-200/60 dark:border-zinc-700">
                  {currentLat?.toFixed(6) ?? '-'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-stone-500 dark:text-zinc-400 flex items-center gap-1">
                  <Compass className="h-3 w-3" />
                  Longitude
                </span>
                <p className="text-xs font-mono font-bold text-stone-800 dark:text-zinc-200 bg-stone-50 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-stone-200/60 dark:border-zinc-700">
                  {currentLon?.toFixed(6) ?? '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Leaflet Interactive Map */}
        <div className="lg:col-span-7">
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs space-y-3 sticky top-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-600" />
                <span>Peta Geofence Presisi</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                OpenStreetMap Live
              </span>
            </div>

            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Geser pin merah untuk memposisikan titik kafe secara akurat. Lingkaran oranye menggambarkan area aman geofence presensi.
            </p>

            <BranchMapPicker
              latitude={currentLat}
              longitude={currentLon}
              radiusMeters={currentRadius}
              onChangeCoordinates={handleCoordinatesChange}
            />
          </div>
        </div>
      </div>

      {/* Floating Save Bar - Only visible when isDirty */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/95 dark:bg-zinc-900/95 text-white backdrop-blur-xl border border-stone-700/80 dark:border-zinc-700 shadow-2xl flex items-center gap-3.5 max-w-md w-auto pointer-events-auto"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-stone-200 pr-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="whitespace-nowrap font-medium text-[11px] sm:text-xs">
                Ada perubahan belum disimpan
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetChanges}
                disabled={updateMutation.isPending}
                className="h-8 px-2.5 text-xs text-stone-400 hover:text-white hover:bg-stone-800 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="h-8 px-3.5 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Simpan Cabang</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
