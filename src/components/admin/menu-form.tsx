'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sliders,
  Info,
  CheckCircle2,
  ImageOff,
  Sparkles,
  Layers,
  DollarSign,
  UploadCloud,
  Link as LinkIcon,
  FileImage,
  Loader2,
  RefreshCw,
  X,
  Sparkle,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/utils/format-currency';
import { notifyApiError } from '@/lib/api/notify-error';
import { toast } from 'sonner';
import {
  MenuFormSchema,
  MenuFormInput,
  CategoryData,
} from '@/lib/validations/admin-menu.schema';
import {
  createAdminMenu,
  updateAdminMenu,
  AdminMenuItem,
  uploadAdminMenuImage,
  formatImageUrl,
} from '@/lib/api/admin-menus-api';

interface MenuFormProps {
  initialData?: AdminMenuItem | null;
  categories: CategoryData[];
  mode: 'create' | 'edit';
}

export function MenuForm({ initialData, categories, mode }: MenuFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'variants'>('info');
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MenuFormInput>({
    resolver: zodResolver(MenuFormSchema) as Resolver<MenuFormInput>,
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price ?? 25000,
      promoPrice: initialData?.promoPrice || null,
      categoryId: initialData?.categoryId || categories[0]?.id || '',
      imageUrl: initialData?.imageUrl || '',
      isAvailable: initialData?.isAvailable ?? true,
      isBestSeller: initialData?.isBestSeller ?? false,
      isRecommended: initialData?.isRecommended ?? false,
      variantGroups: initialData?.variantGroups || [],
    },
  });

  const {
    fields: variantGroups,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: 'variantGroups',
  });

  // Real-time watched form fields for the Live Customer Card Preview
  const watchedName = watch('name');
  const watchedPrice = watch('price');
  const watchedPromoPrice = watch('promoPrice');
  const watchedDescription = watch('description');
  const watchedImageUrl = watch('imageUrl');
  const watchedCategoryId = watch('categoryId');
  const watchedIsAvailable = watch('isAvailable');
  const watchedIsBestSeller = watch('isBestSeller');
  const watchedIsRecommended = watch('isRecommended');
  const watchedVariantGroups = watch('variantGroups');

  const selectedCategoryName =
    categories.find((c) => c.id === watchedCategoryId)?.name || 'Kategori';

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error('Format file tidak didukung. Harap pilih gambar JPG, PNG, atau WebP.');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar melebihi batas 5 MB.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadedFileName(file.name);

      const res = await uploadAdminMenuImage(file);
      if (res.isLeft()) {
        notifyApiError(res.value);
        setUploadedFileName(null);
        return;
      }

      setValue('imageUrl', res.value.url, { shouldValidate: true, shouldDirty: true });
      toast.success('Foto berhasil diunggah & dikompresi ke WebP!');
    } catch (err: any) {
      notifyApiError(err);
      setUploadedFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleClearImage = () => {
    setValue('imageUrl', '', { shouldValidate: true, shouldDirty: true });
    setUploadedFileName(null);
  };

  const addDefaultSizeGroup = () => {
    appendGroup({
      name: 'Ukuran Cup',
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      options: [
        { name: 'Regular (12oz)', extraPrice: 0, isAvailable: true },
        { name: 'Large (16oz)', extraPrice: 5000, isAvailable: true },
      ],
    });
  };

  const onSubmit = async (data: MenuFormInput) => {
    setIsSubmitting(true);
    try {
      if (mode === 'edit' && initialData) {
        const res = await updateAdminMenu(initialData.id, data);
        if (res.isLeft()) {
          notifyApiError(res.value);
          return;
        }
        toast.success(`Menu "${data.name}" berhasil diperbarui!`);
      } else {
        const res = await createAdminMenu(data);
        if (res.isLeft()) {
          notifyApiError(res.value);
          return;
        }
        toast.success(`Menu "${data.name}" berhasil ditambahkan ke katalog!`);
      }
      router.push('/admin/menus');
    } catch (err: any) {
      notifyApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-zinc-800">
        <div>
          <Link
            href="/admin/menus"
            className="inline-flex items-center text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Kembali ke Katalog Menu
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
            {mode === 'edit' ? `Edit Menu: ${initialData?.name}` : 'Tambah Menu Baru'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Lengkapi informasi harga, gambar, dan pilihan variasi untuk pelanggan kafe.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/menus')}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {mode === 'edit' ? 'Simpan Perubahan' : 'Terbitkan Menu'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Left (8 Cols), Live Preview Right (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Tabs (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'info' | 'variants')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 p-1 bg-stone-100 dark:bg-zinc-800/80 rounded-2xl mb-6">
              <TabsTrigger
                value="info"
                className="rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs"
              >
                <Info className="h-4 w-4 mr-2 text-amber-600" />
                Informasi & Harga Menu
              </TabsTrigger>
              <TabsTrigger
                value="variants"
                className="rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs"
              >
                <Sliders className="h-4 w-4 mr-2 text-amber-600" />
                Pilihan Variasi & Topping ({variantGroups.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: INFORMASI UTAMA & HARGA */}
            <TabsContent value="info" className="space-y-6 mt-0">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-7 border border-stone-200/80 dark:border-zinc-800 space-y-5 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400">
                  Data Utama Menu
                </h2>

                {/* Nama Menu */}
                <div>
                  <Label htmlFor="name" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                    Nama Menu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Kopi Kumpul Gula Aren, Croissant Butter"
                    {...register('name')}
                    className="mt-1"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{errors.name.message}</p>
                  )}
                </div>

                {/* Kategori & Harga Grid (Spacious 2-tier responsive grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="categoryId" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                      Kategori Menu <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="categoryId"
                      {...register('categoryId')}
                      className="mt-1 w-full h-10 px-3 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-xs font-semibold text-stone-700 dark:text-zinc-300 whitespace-nowrap">
                      Harga Normal (Rp) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="25000"
                      {...register('price', { valueAsNumber: true })}
                      className="mt-1 font-mono"
                    />
                    {errors.price && (
                      <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="promoPrice" className="text-xs font-semibold text-stone-700 dark:text-zinc-300 whitespace-nowrap">
                      Harga Promo (Rp, Opsional)
                    </Label>
                    <Input
                      id="promoPrice"
                      type="number"
                      placeholder="Kosongkan jika tidak promo"
                      {...register('promoPrice', {
                        setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                      })}
                      className="mt-1 font-mono"
                    />
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <Label htmlFor="description" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                    Deskripsi Menu
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Jelaskan aroma, bahan utama, atau keunikan menu ini..."
                    rows={3}
                    {...register('description')}
                    className="mt-1 resize-none text-xs sm:text-sm"
                  />
                </div>

                {/* Foto Menu: Dual Mode (Upload File / Input Link) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <FileImage className="h-3.5 w-3.5 text-amber-600" />
                      Foto Menu
                    </Label>

                    {/* Mode Switcher Tabs */}
                    <div className="flex items-center p-0.5 rounded-lg bg-stone-100 dark:bg-zinc-800 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setUploadMode('upload')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          uploadMode === 'upload'
                            ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                            : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900'
                        }`}
                      >
                        <UploadCloud className="h-3 w-3" />
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('url')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          uploadMode === 'url'
                            ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                            : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900'
                        }`}
                      >
                        <LinkIcon className="h-3 w-3" />
                        <span>Input URL</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Drag & Drop Dropzone */}
                  {uploadMode === 'upload' ? (
                    <div className="space-y-2">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 transition-all text-center relative flex flex-col items-center justify-center ${
                          isDragging
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-stone-200 dark:border-zinc-800 hover:border-amber-500/60 bg-stone-50/50 dark:bg-zinc-800/20'
                        }`}
                      >
                        <input
                          type="file"
                          id="file-upload-input"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                          className="hidden"
                          disabled={isUploading}
                        />

                        {isUploading ? (
                          <div className="py-3 flex flex-col items-center space-y-2 text-amber-600">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <div className="text-xs font-bold">Mengompresi & Mengunggah ke WebP...</div>
                            <p className="text-[11px] text-stone-400">Menghapus metadata & mengoptimalkan ukuran gambar</p>
                          </div>
                        ) : watchedImageUrl ? (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full p-2 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={formatImageUrl(watchedImageUrl)}
                                alt="Thumbnail"
                                className="h-12 w-12 rounded-lg object-cover border border-stone-200 shrink-0"
                              />
                              <div className="text-left min-w-0">
                                <div className="text-xs font-bold text-stone-900 dark:text-zinc-100 truncate">
                                  {uploadedFileName || 'Foto Berhasil Diunggah'}
                                </div>
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  ✓ Format WebP Siap Dipakai
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <label
                                htmlFor="file-upload-input"
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>Ganti</span>
                              </label>
                              <button
                                type="button"
                                onClick={handleClearImage}
                                className="p-1 rounded-lg border border-stone-200 dark:border-zinc-700 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Hapus Foto"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label
                            htmlFor="file-upload-input"
                            className="flex flex-col items-center cursor-pointer space-y-1.5 py-2 w-full"
                          >
                            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                              <UploadCloud className="h-5 w-5" />
                            </div>
                            <div className="text-xs font-bold text-stone-800 dark:text-zinc-200">
                              Tarik & Lepas Foto di sini, atau{' '}
                              <span className="text-amber-600 dark:text-amber-400 underline">Pilih File</span>
                            </div>
                            <p className="text-[11px] text-stone-400">
                              Mendukung JPG, PNG, WebP (Maksimum 5 MB • Otomatis WebP)
                            </p>
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Mode 2: Direct URL Input */
                    <div className="space-y-1">
                      <Input
                        id="imageUrl"
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        {...register('imageUrl')}
                        className="text-xs sm:text-sm"
                      />
                      <p className="text-[11px] text-stone-400">
                        Masukkan tautan langsung gambar dari internet (Unsplash, CDN, dll).
                      </p>
                    </div>
                  )}

                  {errors.imageUrl && (
                    <p className="text-xs text-red-500 mt-1">{errors.imageUrl.message}</p>
                  )}
                </div>

                {/* Badges & Availability Switches (Vertical Card with Switch at Bottom) */}
                <div className="pt-4 border-t border-stone-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Card 1: Stok Tersedia */}
                  <div className="flex flex-col justify-between p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/80 dark:border-zinc-800 space-y-3 transition-all hover:border-amber-500/30">
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-zinc-100">Stok Tersedia</p>
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Tampilkan menu di katalog</p>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/60 dark:border-zinc-700/60">
                      <span className="text-[11px] font-semibold text-stone-600 dark:text-zinc-400">
                        {watchedIsAvailable ? 'Tersedia' : 'Habis'}
                      </span>
                      <Switch
                        checked={watchedIsAvailable}
                        onCheckedChange={(val) => setValue('isAvailable', val)}
                      />
                    </div>
                  </div>

                  {/* Card 2: Best Seller */}
                  <div className="flex flex-col justify-between p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/80 dark:border-zinc-800 space-y-3 transition-all hover:border-amber-500/30">
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Best Seller</p>
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Beri badge menu terlaris</p>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/60 dark:border-zinc-700/60">
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        {watchedIsBestSeller ? 'Badge Aktif' : 'Nonaktif'}
                      </span>
                      <Switch
                        checked={watchedIsBestSeller}
                        onCheckedChange={(val) => setValue('isBestSeller', val)}
                      />
                    </div>
                  </div>

                  {/* Card 3: Rekomendasi */}
                  <div className="flex flex-col justify-between p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/80 dark:border-zinc-800 space-y-3 transition-all hover:border-amber-500/30">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Rekomendasi</p>
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">Saran & favorit dari chef</p>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/60 dark:border-zinc-700/60">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        {watchedIsRecommended ? 'Badge Aktif' : 'Nonaktif'}
                      </span>
                      <Switch
                        checked={watchedIsRecommended}
                        onCheckedChange={(val) => setValue('isRecommended', val)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: VARIASI & TOPPING */}
            <TabsContent value="variants" className="space-y-4 mt-0">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-7 border border-stone-200/80 dark:border-zinc-800 space-y-6 shadow-xs">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-4 border-b border-stone-100 dark:border-zinc-800">
                  <div className="w-full xl:max-w-md">
                    <h2 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-amber-600" />
                      Grup Pilihan Variasi
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Tambahkan opsi seperti level gula, ukuran cup, atau ekstra topping untuk menu ini.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto shrink-0 pt-1 xl:pt-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDefaultSizeGroup}
                      className="text-xs font-semibold border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 cursor-pointer whitespace-nowrap h-9 px-3.5"
                    >
                      <Sparkle className="h-3.5 w-3.5 mr-1.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>+ Buat Grup Ukuran Default</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendGroup({
                          name: '',
                          isRequired: false,
                          minSelect: 0,
                          maxSelect: 1,
                          options: [{ name: '', extraPrice: 0, isAvailable: true }],
                        })
                      }
                      className="text-xs font-semibold border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer whitespace-nowrap h-9 px-3.5"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5 text-amber-600 shrink-0" />
                      <span>Tambah Grup Variasi</span>
                    </Button>
                  </div>
                </div>

                {variantGroups.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl">
                    <Sliders className="h-8 w-8 text-stone-300 dark:text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-stone-600 dark:text-zinc-400">
                      Belum ada variasi untuk menu ini.
                    </p>
                    <p className="text-[11px] text-stone-400 dark:text-zinc-500 mt-0.5">
                      Klik "+ Buat Grup Ukuran Default" atau "Tambah Grup Variasi" di atas jika menu ini memiliki opsi.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {variantGroups.map((group, groupIndex) => (
                      <div
                        key={group.id}
                        className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/80 dark:border-zinc-800 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                            <div>
                              <Label className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                                Nama Grup #{groupIndex + 1} <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                placeholder="Contoh: Level Gula, Ukuran, Topping"
                                {...register(`variantGroups.${groupIndex}.name`)}
                                className="mt-1 bg-white dark:bg-zinc-900 text-xs sm:text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-4 pt-4 sm:pt-6">
                              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  {...register(`variantGroups.${groupIndex}.isRequired`)}
                                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                                />
                                <span>Wajib Dipilih</span>
                              </label>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGroup(groupIndex)}
                            className="text-stone-400 hover:text-red-600 -mr-2 -mt-2 cursor-pointer"
                            title="Hapus Grup"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Option Items inside this group */}
                        <div className="pt-2 border-t border-stone-200/60 dark:border-zinc-700/60">
                          <VariantOptionList
                            groupIndex={groupIndex}
                            control={control}
                            register={register}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Sticky Live Customer Card Preview (4 Cols) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400">
              Pratinjau Tampilan Pelanggan
            </h2>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden shadow-md">
            {/* Image Preview */}
            <div className="h-48 w-full bg-stone-100 dark:bg-zinc-800 relative flex items-center justify-center overflow-hidden">
              {watchedImageUrl ? (
                <img
                  src={formatImageUrl(watchedImageUrl)}
                  alt={watchedName || 'Preview'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-stone-400">
                  <ImageOff className="h-8 w-8 opacity-40" />
                  <span className="text-[11px] font-medium">Foto Menu Belum Diisi</span>
                </div>
              )}

              {/* Status Badge Overlays */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                {watchedIsBestSeller && (
                  <Badge variant="bestseller" className="text-[10px] px-2 py-0.5 shadow-xs">
                    Best Seller
                  </Badge>
                )}
                {watchedIsRecommended && (
                  <Badge variant="recommended" className="text-[10px] px-2 py-0.5 shadow-xs">
                    Recommended
                  </Badge>
                )}
              </div>

              {!watchedIsAvailable && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                    Stok Habis
                  </span>
                </div>
              )}
            </div>

            {/* Card Content Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                    {selectedCategoryName}
                  </span>
                  <h3 className="text-base font-bold text-stone-900 dark:text-zinc-50 mt-0.5 line-clamp-1">
                    {watchedName || 'Nama Menu Baru...'}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  {watchedPromoPrice && watchedPromoPrice < watchedPrice ? (
                    <div>
                      <span className="text-sm font-mono font-bold text-red-600 block">
                        {formatRupiah(watchedPromoPrice)}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 line-through block">
                        {formatRupiah(watchedPrice || 0)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-mono font-bold text-stone-900 dark:text-zinc-100">
                      {formatRupiah(watchedPrice || 0)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-stone-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                {watchedDescription || 'Deskripsi singkat dan kelezatan menu ini akan ditampilkan di sini kepada pelanggan.'}
              </p>

              {/* Variants Overview */}
              {watchedVariantGroups && watchedVariantGroups.length > 0 && (
                <div className="pt-3.5 border-t border-stone-100 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-zinc-300">
                    <Layers className="h-3.5 w-3.5 text-amber-600" />
                    <span>{watchedVariantGroups.length} Grup Pilihan Variasi:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {watchedVariantGroups.map((vg, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60 px-2.5 py-1 rounded-lg text-stone-700 dark:text-zinc-200 shadow-2xs"
                      >
                        {vg.name || `Grup #${idx + 1}`} ({vg.options?.length || 0} opsi)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// Sub-component for dynamic option items inside each variant group
function VariantOptionList({
  groupIndex,
  control,
  register,
}: {
  groupIndex: number;
  control: any;
  register: any;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variantGroups.${groupIndex}.options`,
  });

  return (
    <div className="space-y-2">
      {fields.map((optionField, optionIndex) => (
        <div key={optionField.id} className="flex items-center gap-2">
          <Input
            placeholder="Nama Opsi (mis: Dingin, Sedang, Keju)"
            {...register(`variantGroups.${groupIndex}.options.${optionIndex}.name`)}
            className="flex-1 bg-white dark:bg-zinc-900 text-xs sm:text-sm h-9"
          />
          <div className="relative w-32 shrink-0">
            <span className="absolute left-2.5 top-2.5 text-xs text-stone-400 font-mono">+Rp</span>
            <Input
              type="number"
              placeholder="0"
              {...register(
                `variantGroups.${groupIndex}.options.${optionIndex}.extraPrice`,
                { valueAsNumber: true }
              )}
              className="pl-10 bg-white dark:bg-zinc-900 text-xs sm:text-sm font-mono h-9"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(optionIndex)}
            className="text-stone-400 hover:text-red-600 h-9 w-9 shrink-0 cursor-pointer"
            title="Hapus Opsi"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => append({ name: '', extraPrice: 0, isAvailable: true })}
        className="text-[11px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-zinc-800 h-7 px-2 cursor-pointer"
      >
        <Plus className="h-3 w-3 mr-1" />
        Tambah Opsi
      </Button>
    </div>
  );
}
