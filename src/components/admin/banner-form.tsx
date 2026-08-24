'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Sparkles,
  Save,
  Layers,
  ExternalLink,
  Smartphone,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  BannerFormSchema,
  BannerFormInput,
  BannerData,
} from '@/lib/validations/banner.schema';
import {
  useCreateBannerMutation,
  useUpdateBannerMutation,
} from '@/hooks/queries/use-admin-banners';
import {
  BannerImageUploader,
  BannerPreset,
} from '@/components/admin/banner-image-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/cn';
import { formatImageUrl } from '@/lib/api/admin-menus-api';

interface BannerFormProps {
  mode: 'create' | 'edit';
  initialData?: BannerData;
}

export function BannerForm({ mode, initialData }: BannerFormProps) {
  const router = useRouter();
  const createMutation = useCreateBannerMutation();
  const updateMutation = useUpdateBannerMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BannerFormInput>({
    resolver: zodResolver(BannerFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      imageUrl: initialData?.imageUrl || '',
      targetUrl: initialData?.targetUrl || '',
      sortOrder: initialData?.sortOrder ?? 0,
      isActive: initialData?.isActive ?? true,
    },
  });

  const watchedValues = watch();

  const handlePresetSelect = (preset: BannerPreset) => {
    // If title or description is empty, auto-fill from preset
    if (!watchedValues.title) {
      setValue('title', preset.title, { shouldValidate: true });
    }
    if (!watchedValues.description) {
      setValue('description', preset.description, { shouldValidate: true });
    }
    if (!watchedValues.targetUrl) {
      setValue('targetUrl', preset.targetUrl, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: BannerFormInput) => {
    setIsSubmitting(true);
    try {
      if (mode === 'edit' && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          payload: data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      router.push('/admin/banners');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
      {/* Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-zinc-800">
        <div>
          <Link
            href="/admin/banners"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors mb-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Manajemen Banner</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-600" />
            <span>
              {mode === 'create'
                ? 'Terbitkan Banner Promo Baru'
                : `Edit Banner: ${initialData?.title}`}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/banners">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              className="rounded-2xl border-stone-200 dark:border-zinc-700 text-xs font-semibold h-10 px-4"
            >
              Batal
            </Button>
          </Link>

          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Menyimpan..."
            className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 text-xs font-bold h-10 px-5 transition-all active:scale-95"
          >
            <Save className="h-4 w-4 mr-1.5" />
            <span>{mode === 'create' ? 'Terbitkan Banner' : 'Simpan Perubahan'}</span>
          </Button>
        </div>
      </div>

      {/* 2-Column Split View: Left Form Inputs, Right Live Customer Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Fields (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Image Uploader */}
          <div className="p-5 sm:p-6 rounded-3xl border border-stone-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
            <BannerImageUploader
              value={watchedValues.imageUrl}
              onChange={(url) =>
                setValue('imageUrl', url, { shouldValidate: true })
              }
              onPresetSelect={handlePresetSelect}
              disabled={isSubmitting}
            />
            {errors.imageUrl && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {errors.imageUrl.message}
              </p>
            )}
          </div>

          {/* 2. Text Details */}
          <div className="p-5 sm:p-6 rounded-3xl border border-stone-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
              Informasi & Teks Promo
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-zinc-300">
                Judul Banner Promo <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Buy 1 Get 1 Signature Espresso Blend"
                {...register('title')}
                disabled={isSubmitting}
                className="h-10 rounded-xl text-xs bg-stone-50 dark:bg-zinc-800/80"
              />
              {errors.title && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-zinc-300">
                Deskripsi Singkat / Ketentuan Promo (Opsional)
              </label>
              <Textarea
                placeholder="Contoh: Berlaku setiap Senin - Kamis pukul 14:00 - 17:00 untuk pesanan dine-in."
                rows={3}
                {...register('description')}
                disabled={isSubmitting}
                className="rounded-xl text-xs bg-stone-50 dark:bg-zinc-800/80 resize-none"
              />
              {errors.description && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                <span>Target Link / URL Aksi Klik (Opsional)</span>
              </label>
              <Input
                placeholder="Contoh: /menu?category=cat-coffee atau https://..."
                {...register('targetUrl')}
                disabled={isSubmitting}
                className="h-10 rounded-xl text-xs bg-stone-50 dark:bg-zinc-800/80 font-mono"
              />
              <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                Pelanggan yang mengklik banner di HP akan langsung diarahkan ke tautan ini.
              </p>
            </div>
          </div>

          {/* 3. Settings: Sort Order & Active Toggle */}
          <div className="p-5 sm:p-6 rounded-3xl border border-stone-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-amber-600" />
              <span>Pengaturan Penayangan</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-zinc-300">
                  Urutan Tampil (Sort Order)
                </label>
                <Input
                  type="number"
                  min={0}
                  {...register('sortOrder', { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className="h-10 rounded-xl text-xs bg-stone-50 dark:bg-zinc-800/80"
                />
                <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                  Nomor urutan lebih kecil (#1, #2) tayang lebih awal di carousel.
                </p>
              </div>

              <div className="flex flex-col justify-between p-3.5 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                      Status Penayangan
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                      {watchedValues.isActive
                        ? 'Banner langsung tayang ke pelanggan'
                        : 'Banner disimpan sebagai draft (disembunyikan)'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register('isActive')}
                    disabled={isSubmitting}
                    className="h-5 w-5 rounded-md text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Customer Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl border border-amber-200/80 dark:border-zinc-800 bg-linear-to-b from-amber-50/40 to-white dark:from-zinc-900 dark:to-zinc-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
                <Smartphone className="h-4 w-4 text-amber-600" />
                <span>Live Customer Mobile Preview</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                Real-Time
              </span>
            </div>

            {/* Mobile Simulation Frame */}
            <div className="w-full max-w-[340px] mx-auto rounded-3xl border-4 border-stone-800 dark:border-zinc-700 bg-stone-950 p-2 shadow-2xl">
              {/* Mobile Notch Speaker */}
              <div className="h-3 w-16 bg-stone-800 rounded-full mx-auto mb-2" />

              {/* Simulated Customer Screen */}
              <div className="bg-stone-50 dark:bg-zinc-900 rounded-2xl overflow-hidden p-3 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-zinc-800">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-stone-700 dark:text-zinc-300">
                    <span>☕ Kumpul Cafe</span>
                  </div>
                  <span className="text-[9px] font-mono text-stone-400">Meja T-01</span>
                </div>

                {/* The Simulated Live Banner */}
                <div className="relative aspect-16/9 w-full rounded-2xl overflow-hidden shadow-md bg-stone-800">
                  {watchedValues.imageUrl ? (
                    <Image
                      src={formatImageUrl(watchedValues.imageUrl)}
                      alt="Banner Preview"
                      fill
                      objectFit='contain'
                      sizes="(max-width: 768px) 100vw, 340px"
                    // className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                      <Sparkles className="h-6 w-6 text-amber-500 mb-1" />
                      <span className="text-[10px] font-semibold">
                        Pilih atau upload gambar untuk melihat live preview
                      </span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Status & Sort Badge */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[9px] font-bold text-white">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md">
                      #{watchedValues.sortOrder || 0}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full backdrop-blur-md',
                        watchedValues.isActive ? 'bg-emerald-600' : 'bg-stone-700'
                      )}
                    >
                      {watchedValues.isActive ? 'Tayang' : 'Draft'}
                    </span>
                  </div>

                  {/* Bottom Text Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 text-white space-y-0.5">
                    <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wide">
                      Promo Spesial
                    </p>
                    <p className="text-xs font-bold leading-tight line-clamp-1">
                      {watchedValues.title || 'Judul Banner Promo'}
                    </p>
                    {watchedValues.description && (
                      <p className="text-[10px] text-stone-200 line-clamp-1">
                        {watchedValues.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Simulated Dummy Menu Items Below */}
                <div className="space-y-1.5 pt-1">
                  <div className="h-3 w-20 bg-stone-200 dark:bg-zinc-800 rounded-sm" />
                  <div className="h-10 w-full bg-stone-200/60 dark:bg-zinc-800/60 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
