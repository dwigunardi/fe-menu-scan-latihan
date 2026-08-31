'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MapPin,
  Clock,
  Store,
  ShieldCheck,
  Save,
  Loader2,
  Sliders,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { reverseGeocode } from '@/lib/utils/geocoding';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'motion/react';
import { BranchMapPicker } from './branch-map-picker';
import {
  BranchSetting,
  UpdateBranchSettingInput,
  UpdateBranchSettingInputSchema,
  DaySchedule,
  STORE_MODE,
  DAY_OF_WEEK,
} from '@/lib/validations/branch-settings.schema';
import { useUpdateBranchSettingMutation } from '@/hooks/queries/use-admin-settings';

const DAYS_OF_WEEK: { key: DaySchedule['day']; label: string }[] = [
  { key: DAY_OF_WEEK.MONDAY, label: 'Senin' },
  { key: DAY_OF_WEEK.TUESDAY, label: 'Selasa' },
  { key: DAY_OF_WEEK.WEDNESDAY, label: 'Rabu' },
  { key: DAY_OF_WEEK.THURSDAY, label: 'Kamis' },
  { key: DAY_OF_WEEK.FRIDAY, label: 'Jumat' },
  { key: DAY_OF_WEEK.SATURDAY, label: 'Sabtu' },
  { key: DAY_OF_WEEK.SUNDAY, label: 'Minggu' },
];

const DEFAULT_SCHEDULES: DaySchedule[] = DAYS_OF_WEEK.map((d) => ({
  day: d.key,
  isOpen: true,
  openTime: d.key === DAY_OF_WEEK.FRIDAY || d.key === DAY_OF_WEEK.SATURDAY ? '08:00' : '08:00',
  closeTime: d.key === DAY_OF_WEEK.FRIDAY || d.key === DAY_OF_WEEK.SATURDAY ? '23:00' : '22:00',
}));

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
      schedules: initialData.schedules && initialData.schedules.length > 0 ? initialData.schedules : DEFAULT_SCHEDULES,
    },
  });

  const currentLat = watch('latitude') ?? initialData.latitude;
  const currentLon = watch('longitude') ?? initialData.longitude;
  const currentRadius = watch('geofenceRadius') ?? initialData.geofenceRadius;
  const currentSchedules = watch('schedules') ?? DEFAULT_SCHEDULES;
  const currentStoreMode = watch('storeMode');

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
      schedules: initialData.schedules && initialData.schedules.length > 0 ? initialData.schedules : DEFAULT_SCHEDULES,
    });
  }, [initialData, reset]);

  const handleCoordinatesChange = (lat: number, lon: number, resolvedAddress?: string) => {
    setValue('latitude', lat, { shouldDirty: true, shouldValidate: true });
    setValue('longitude', lon, { shouldDirty: true, shouldValidate: true });
    if (resolvedAddress) {
      setValue('address', resolvedAddress, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleApplySameHours = () => {
    const monday = currentSchedules.find((s) => s.day === DAY_OF_WEEK.MONDAY) || {
      openTime: '08:00',
      closeTime: '22:00',
    };
    const newSchedules = currentSchedules.map((s) => ({
      ...s,
      openTime: monday.openTime,
      closeTime: monday.closeTime,
    }));
    setValue('schedules', newSchedules, { shouldDirty: true });
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
      schedules: initialData.schedules && initialData.schedules.length > 0 ? initialData.schedules : DEFAULT_SCHEDULES,
    });
  };

  const onFormSubmit = async (data: UpdateBranchSettingInput) => {
    await updateMutation.mutateAsync({
      ...data,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
    });
    reset(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Tabs defaultValue="location" className="w-full space-y-4">
        {/* Navigation Tabs */}
        <div className="border-b border-stone-200/80 dark:border-zinc-800 pb-3">
          <TabsList className="bg-stone-100 dark:bg-zinc-800/80 p-1 rounded-2xl h-11 inline-flex max-w-full overflow-x-auto">
            <TabsTrigger
              value="location"
              className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs px-3.5 py-2 cursor-pointer shrink-0"
            >
              <MapPin className="h-3.5 w-3.5 text-amber-600" />
              <span>Lokasi & Geofence</span>
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs px-3.5 py-2 cursor-pointer shrink-0"
            >
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Jam Buka & Absensi</span>
            </TabsTrigger>
            <TabsTrigger
              value="mode"
              className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs px-3.5 py-2 cursor-pointer shrink-0"
            >
              <Store className="h-3.5 w-3.5 text-amber-600" />
              <span>Mode Operasi Toko</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: Lokasi & Geofence Spasial */}
        <TabsContent value="location" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-5 space-y-4">
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

                {/* Geofence Radius Slider */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <Sliders className="h-3.5 w-3.5 text-amber-600" />
                      <Label htmlFor="geofence-radius-range" className="cursor-pointer">
                        Radius Aman Geofence:
                      </Label>
                    </div>
                    <span className="font-mono font-bold text-sm text-amber-900 dark:text-amber-100">
                      {currentRadius} meter
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

                  <div className="flex justify-between text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    <span>50m (Area Gedung)</span>
                    <span>100m (Gedung + Parkir)</span>
                    <span>500m (Kompleks Luas)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Leaflet Map */}
            <div className="lg:col-span-7">
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <span>Peta Geofence Presisi</span>
                  </h3>
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    OpenStreetMap Live
                  </span>
                </div>

                <BranchMapPicker
                  latitude={currentLat}
                  longitude={currentLon}
                  radiusMeters={currentRadius}
                  onChangeCoordinates={handleCoordinatesChange}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Jam Operasional & Toleransi Absensi */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Grace Period & Default Hours Card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span>Toleransi Absensi Staf</span>
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="late-grace-period" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                    Batas Toleransi Terlambat (Menit) *
                  </Label>
                  <Input
                    id="late-grace-period"
                    type="number"
                    {...register('lateGracePeriod')}
                    min={0}
                    max={120}
                    placeholder="15"
                    className="h-10 text-xs rounded-xl font-mono font-bold"
                  />
                  <p className="text-[11px] text-stone-400">
                    Staf yang clock-in melewati jam buka + {watch('lateGracePeriod') || 15} menit akan otomatis ditandai <strong>TERLAMBAT</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="default-open-time" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                      Jam Buka Standar
                    </Label>
                    <Input
                      id="default-open-time"
                      type="time"
                      {...register('openTime')}
                      placeholder="08:00"
                      className="h-9.5 text-xs rounded-xl font-mono text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="default-close-time" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                      Jam Tutup Standar
                    </Label>
                    <Input
                      id="default-close-time"
                      type="time"
                      {...register('closeTime')}
                      placeholder="22:00"
                      className="h-9.5 text-xs rounded-xl font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Schedule Table */}
            <div className="lg:col-span-8">
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span>Jadwal Buka Harian Staf & Pelanggan</span>
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplySameHours}
                    className="text-[11px] font-bold rounded-xl h-8 text-amber-700 dark:text-amber-400 cursor-pointer"
                  >
                    Samakan Jam untuk Semua Hari
                  </Button>
                </div>

                <div className="space-y-2 pt-1">
                  {DAYS_OF_WEEK.map((dayItem) => {
                    const sched = currentSchedules.find((s) => s.day === dayItem.key) || {
                      day: dayItem.key,
                      isOpen: true,
                      openTime: '08:00',
                      closeTime: '22:00',
                    };

                    return (
                      <div
                        key={dayItem.key}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                          sched.isOpen
                            ? 'bg-stone-50/60 dark:bg-zinc-800/40 border-stone-200/80 dark:border-zinc-800'
                            : 'bg-stone-100/40 dark:bg-zinc-900/40 border-dashed border-stone-300 dark:border-zinc-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-[100px]">
                          <Switch
                            id={`schedule-switch-${dayItem.key}`}
                            checked={sched.isOpen}
                            onCheckedChange={(checked) => {
                              const updated = [...currentSchedules];
                              const idx = updated.findIndex((s) => s.day === dayItem.key);
                              if (idx >= 0) {
                                updated[idx].isOpen = checked;
                              } else {
                                updated.push({
                                  day: dayItem.key,
                                  isOpen: checked,
                                  openTime: '08:00',
                                  closeTime: '22:00',
                                });
                              }
                              setValue('schedules', updated, { shouldDirty: true });
                            }}
                          />
                          <Label htmlFor={`schedule-switch-${dayItem.key}`} className="text-xs font-bold text-stone-900 dark:text-zinc-100 cursor-pointer">
                            {dayItem.label}
                          </Label>
                        </div>

                        {sched.isOpen ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={sched.openTime}
                              onChange={(e) => {
                                const updated = [...currentSchedules];
                                const idx = updated.findIndex((s) => s.day === dayItem.key);
                                if (idx >= 0) updated[idx].openTime = e.target.value;
                                setValue('schedules', updated, { shouldDirty: true });
                              }}
                              className="h-8.5 w-28 text-xs font-mono font-bold rounded-xl text-center bg-white dark:bg-zinc-800"
                            />
                            <span className="text-xs font-bold text-stone-400">s/d</span>
                            <Input
                              type="time"
                              value={sched.closeTime}
                              onChange={(e) => {
                                const updated = [...currentSchedules];
                                const idx = updated.findIndex((s) => s.day === dayItem.key);
                                if (idx >= 0) updated[idx].closeTime = e.target.value;
                                setValue('schedules', updated, { shouldDirty: true });
                              }}
                              className="h-8.5 w-28 text-xs font-mono font-bold rounded-xl text-center bg-white dark:bg-zinc-800"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-rose-500">
                            Libur (Toko Tutup)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: Mode Operasi Toko */}
        <TabsContent value="mode" className="space-y-4">
          <div className="max-w-2xl p-4 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <Store className="h-4 w-4 text-amber-600" />
              <span>Konfigurasi Mode Operasi Toko</span>
            </h3>

            <div className="space-y-3">
              {/* Mode A: Shift Driven */}
              <div
                onClick={() => setValue('storeMode', STORE_MODE.SHIFT_DRIVEN, { shouldDirty: true })}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  currentStoreMode === STORE_MODE.SHIFT_DRIVEN
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                    : 'border-stone-200/80 dark:border-zinc-800 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                        Mode A: Shift-Driven (Rekomendasi)
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                        Paling Aman
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                      Toko hanya menerima pesanan dari meja QR jika kasir/staf telah membuka shift kasir aktif. Mencegah pesanan masuk saat kafe kosong.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode B: Clock Driven */}
              <div
                onClick={() => setValue('storeMode', STORE_MODE.CLOCK_DRIVEN, { shouldDirty: true })}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  currentStoreMode === STORE_MODE.CLOCK_DRIVEN
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                    : 'border-stone-200/80 dark:border-zinc-800 hover:border-stone-300'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                    Mode B: Clock-Driven (Otomatis Jam Buka)
                  </span>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Toko otomatis berstatus BUKA tepat di jam buka resmi mingguan, tanpa menunggu pembukuan kasir.
                  </p>
                </div>
              </div>

              {/* Mode C: QRIS Only */}
              <div
                onClick={() => setValue('storeMode', STORE_MODE.QRIS_ONLY, { shouldDirty: true })}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  currentStoreMode === STORE_MODE.QRIS_ONLY
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                    : 'border-stone-200/80 dark:border-zinc-800 hover:border-stone-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                      Mode C: QRIS / Self-Service Only
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                      Tanpa Kasir
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Toko dibuka khusus pemesanan mandiri dengan pembayaran digital QRIS langsung di meja. Pembayaran tunai kasir dinonaktifkan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Save Pill - Only visible when isDirty */}
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
                <span>Simpan</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
