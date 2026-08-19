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
} from '@/lib/api/admin-menus-api';

interface MenuFormProps {
  initialData?: AdminMenuItem | null;
  categories: CategoryData[];
  mode: 'create' | 'edit';
}

export function MenuForm({ initialData, categories, mode }: MenuFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MenuFormInput>({
    resolver: zodResolver(MenuFormSchema) as unknown as Resolver<MenuFormInput>,
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price ?? 20000,
      promoPrice: initialData?.promoPrice ?? null,
      categoryId: initialData?.categoryId || categories[0]?.id || '',
      imageUrl: initialData?.imageUrl || '',
      isAvailable: initialData?.isAvailable ?? true,
      isBestSeller: initialData?.isBestSeller ?? false,
      isRecommended: initialData?.isRecommended ?? false,
      variantGroups: initialData?.variantGroups || [],
    },
  });

  const {
    fields: variantGroupFields,
    append: appendVariantGroup,
    remove: removeVariantGroup,
  } = useFieldArray({
    control,
    name: 'variantGroups',
  });

  // Watch form fields in real-time for the Sticky Live Preview
  const watchedName = watch('name');
  const watchedDescription = watch('description');
  const watchedPrice = watch('price');
  const watchedPromoPrice = watch('promoPrice');
  const watchedCategoryId = watch('categoryId');
  const watchedImageUrl = watch('imageUrl');
  const watchedIsAvailable = watch('isAvailable');
  const watchedIsBestSeller = watch('isBestSeller');
  const watchedIsRecommended = watch('isRecommended');
  const watchedVariantGroups = watch('variantGroups');

  const selectedCategoryName =
    categories.find((c) => c.id === watchedCategoryId)?.name || 'Kategori';

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

      {/* Two-Column Form & Live Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Tabs (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 bg-stone-100 dark:bg-zinc-800/60 p-1 rounded-2xl mb-6">
              <TabsTrigger value="basic" className="rounded-xl font-semibold text-xs sm:text-sm py-2">
                <Info className="h-4 w-4 mr-1.5" />
                Informasi Dasar
              </TabsTrigger>
              <TabsTrigger value="variants" className="rounded-xl font-semibold text-xs sm:text-sm py-2">
                <Sliders className="h-4 w-4 mr-1.5" />
                Variasi & Topping ({variantGroupFields.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: INFORMASI DASAR */}
            <TabsContent value="basic" className="space-y-5 mt-0">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-stone-200/80 dark:border-zinc-800 space-y-4 shadow-xs">
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

                {/* Kategori & Harga Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="categoryId" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                      Kategori <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="categoryId"
                      {...register('categoryId')}
                      className="mt-1 w-full h-10 px-3 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    <Label htmlFor="price" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
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
                    <Label htmlFor="promoPrice" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                      Harga Promo (Opsional)
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

                {/* Image URL */}
                <div>
                  <Label htmlFor="imageUrl" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                    URL Foto Menu
                  </Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    {...register('imageUrl')}
                    className="mt-1 text-xs sm:text-sm"
                  />
                  {errors.imageUrl && (
                    <p className="text-xs text-red-500 mt-1">{errors.imageUrl.message}</p>
                  )}
                </div>

                {/* Badges & Availability Switches */}
                <div className="pt-3 border-t border-stone-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-100 dark:border-zinc-800">
                    <div>
                      <p className="text-xs font-bold text-stone-800 dark:text-zinc-200">Stok Tersedia</p>
                      <p className="text-[11px] text-stone-500">Tampilkan di menu</p>
                    </div>
                    <Switch
                      checked={watchedIsAvailable}
                      onCheckedChange={(val) => setValue('isAvailable', val)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-100 dark:border-zinc-800">
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Best Seller</p>
                      <p className="text-[11px] text-stone-500">Beri badge terlaris</p>
                    </div>
                    <Switch
                      checked={watchedIsBestSeller}
                      onCheckedChange={(val) => setValue('isBestSeller', val)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-100 dark:border-zinc-800">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Rekomendasi</p>
                      <p className="text-[11px] text-stone-500">Saran dari chef</p>
                    </div>
                    <Switch
                      checked={watchedIsRecommended}
                      onCheckedChange={(val) => setValue('isRecommended', val)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: VARIASI & TOPPING */}
            <TabsContent value="variants" className="space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                    Grup Pilihan Variasi & Ekstra
                  </h3>
                  <p className="text-xs text-stone-500">
                    Misal: Pilihan Ukuran (Reguler/Large), Suhu (Ice/Hot), atau Topping Ekstra.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    appendVariantGroup({
                      name: '',
                      isRequired: false,
                      minSelect: 0,
                      maxSelect: 1,
                      options: [{ name: '', extraPrice: 0, isAvailable: true }],
                    })
                  }
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Grup
                </Button>
              </div>

              {variantGroupFields.length === 0 ? (
                <div className="py-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-stone-300 dark:border-zinc-800">
                  <Sliders className="h-8 w-8 mx-auto mb-2 text-stone-300 dark:text-zinc-600" />
                  <p className="text-xs font-semibold text-stone-500">Belum ada grup variasi untuk menu ini.</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      appendVariantGroup({
                        name: 'Ukuran Cup',
                        isRequired: true,
                        minSelect: 1,
                        maxSelect: 1,
                        options: [
                          { name: 'Regular', extraPrice: 0, isAvailable: true },
                          { name: 'Large', extraPrice: 4000, isAvailable: true },
                        ],
                      })
                    }
                    className="text-xs text-amber-600 mt-1"
                  >
                    + Buat Grup Ukuran Default
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {variantGroupFields.map((groupField, groupIndex) => (
                    <div
                      key={groupField.id}
                      className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-stone-200 dark:border-zinc-800 space-y-4 shadow-xs"
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-zinc-800">
                        <div className="flex-1">
                          <Label className="text-xs font-semibold text-stone-600 dark:text-zinc-400">
                            Nama Grup Variasi
                          </Label>
                          <Input
                            placeholder="Contoh: Level Gula, Ukuran, Topping"
                            {...register(`variantGroups.${groupIndex}.name` as const)}
                            className="mt-1 h-9 font-semibold text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-3 pt-5">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={watch(`variantGroups.${groupIndex}.isRequired`)}
                              onCheckedChange={(val) =>
                                setValue(`variantGroups.${groupIndex}.isRequired`, val)
                              }
                            />
                            <span className="text-xs font-medium text-stone-600 dark:text-zinc-400">
                              Wajib Dipilih
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeVariantGroup(groupIndex)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Hapus Grup"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Options Sub-List */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                          Daftar Pilihan Opsi
                        </Label>
                        <VariantOptionList groupIndex={groupIndex} control={control} register={register} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  src={watchedImageUrl}
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
                  <Badge variant="bestseller" className="text-[10px] px-2 py-0.5 shadow-sm">
                    Best Seller
                  </Badge>
                )}
                {watchedIsRecommended && (
                  <Badge variant="recommended" className="text-[10px] px-2 py-0.5 shadow-sm">
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
                <div className="pt-3 border-t border-stone-100 dark:border-zinc-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 dark:text-zinc-400">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{watchedVariantGroups.length} Grup Pilihan Variasi:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {watchedVariantGroups.map((vg, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg text-stone-600 dark:text-zinc-300"
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
            placeholder="Nama Opsi (misal: Less Ice, Extra Shot)"
            {...register(`variantGroups.${groupIndex}.options.${optionIndex}.name` as const)}
            className="flex-2 h-8 text-xs"
          />
          <div className="flex items-center gap-1 flex-1">
            <span className="text-[11px] text-stone-400 font-mono">+Rp</span>
            <Input
              type="number"
              placeholder="0"
              {...register(
                `variantGroups.${groupIndex}.options.${optionIndex}.extraPrice` as const,
                { valueAsNumber: true }
              )}
              className="h-8 text-xs font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(optionIndex)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors"
            title="Hapus Opsi"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => append({ name: '', extraPrice: 0, isAvailable: true })}
        className="text-[11px] h-7 px-2 text-stone-500 hover:text-stone-900"
      >
        <Plus className="h-3 w-3 mr-1" />
        Tambah Opsi
      </Button>
    </div>
  );
}
