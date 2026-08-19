'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Sliders, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

interface MenuFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: AdminMenuItem | null;
  categories: CategoryData[];
}

export function MenuFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  categories,
}: MenuFormModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MenuFormInput>({
    resolver: zodResolver(MenuFormSchema) as unknown as Resolver<MenuFormInput>,
    defaultValues: {
      name: '',
      description: '',
      price: 20000,
      promoPrice: null,
      categoryId: categories[0]?.id || '',
      imageUrl: '',
      isAvailable: true,
      isBestSeller: false,
      isRecommended: false,
      variantGroups: [],
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

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || '',
        price: initialData.price,
        promoPrice: initialData.promoPrice,
        categoryId: initialData.categoryId,
        imageUrl: initialData.imageUrl || '',
        isAvailable: initialData.isAvailable,
        isBestSeller: initialData.isBestSeller,
        isRecommended: initialData.isRecommended,
        variantGroups: initialData.variantGroups || [],
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 20000,
        promoPrice: null,
        categoryId: categories[0]?.id || '',
        imageUrl: '',
        isAvailable: true,
        isBestSeller: false,
        isRecommended: false,
        variantGroups: [
          {
            name: 'Suhu',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            options: [
              { name: 'Hot', extraPrice: 0, isAvailable: true },
              { name: 'Ice', extraPrice: 0, isAvailable: true },
            ],
          },
        ],
      });
    }
  }, [initialData, categories, reset]);

  const onSubmit = async (data: MenuFormInput) => {
    setIsSubmitting(true);
    try {
      const result = initialData
        ? await updateAdminMenu(initialData.id, data)
        : await createAdminMenu(data);

      if (result.isLeft()) {
        notifyApiError(result.value);
        return;
      }

      toast.success(
        initialData
          ? `Menu "${data.name}" berhasil diperbarui!`
          : `Menu baru "${data.name}" berhasil ditambahkan!`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      notifyApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Menu & Variasi' : 'Tambah Menu Baru'}
          </DialogTitle>
          <DialogDescription>
            Konfigurasikan informasi menu, harga, dan batasan kustomisasi variasi / topping.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>1. Info Dasar & Harga</span>
              </TabsTrigger>
              <TabsTrigger value="variants" className="flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                <span>2. Grup Variasi & Topping</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: INFO DASAR */}
            <TabsContent value="basic" className="space-y-4 pt-2">
              <div>
                <Label htmlFor="name">Nama Menu *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Kopi Kumpul Santuy"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryId">Kategori Menu *</Label>
                  <select
                    id="categoryId"
                    className="flex h-11 w-full rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                    {...register('categoryId')}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price">Harga Dasar (IDR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="28000"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Deskripsi Bahan / Rasa</Label>
                <Textarea
                  id="description"
                  placeholder="Campuran espresso signature blend + susu oat creamy + madu murni..."
                  {...register('description')}
                />
              </div>

              <div>
                <Label htmlFor="imageUrl">URL Foto Menu</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    placeholder="https://images.unsplash.com/..."
                    {...register('imageUrl')}
                  />
                </div>
                {watch('imageUrl') && (
                  <div className="mt-2 h-20 w-20 rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
                    <img
                      src={watch('imageUrl')}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-zinc-800 grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/50">
                  <span className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                    Badge Best Seller
                  </span>
                  <Switch
                    checked={watch('isBestSeller')}
                    onCheckedChange={(checked) => setValue('isBestSeller', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/50">
                  <span className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                    Menu Rekomendasi
                  </span>
                  <Switch
                    checked={watch('isRecommended')}
                    onCheckedChange={(checked) => setValue('isRecommended', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: GRUP VARIASI & TOPPING */}
            <TabsContent value="variants" className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                    Grup Modifiers
                  </h4>
                  <p className="text-xs text-stone-500">
                    Kustomisasi pilihan ukuran, suhu, atau ekstra topping.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    appendVariantGroup({
                      name: 'Extra Topping',
                      isRequired: false,
                      minSelect: 0,
                      maxSelect: 3,
                      options: [
                        { name: 'Coffee Jelly', extraPrice: 4000, isAvailable: true },
                      ],
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Grup
                </Button>
              </div>

              {variantGroupFields.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-3xl text-stone-400">
                  <Sliders className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">Belum Ada Grup Variasi</p>
                  <p className="text-xs">Klik tombol di atas untuk menambahkan variasi.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {variantGroupFields.map((groupField, groupIndex) => (
                    <div
                      key={groupField.id}
                      className="p-4 rounded-3xl border border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/30 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                          Grup #{groupIndex + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeVariantGroup(groupIndex)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <Label>Nama Grup *</Label>
                          <Input
                            placeholder="Suhu / Topping"
                            {...register(`variantGroups.${groupIndex}.name`)}
                          />
                        </div>
                        <div>
                          <Label>Min Pilih</Label>
                          <Input
                            type="number"
                            {...register(`variantGroups.${groupIndex}.minSelect`, {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div>
                          <Label>Max Pilih</Label>
                          <Input
                            type="number"
                            {...register(`variantGroups.${groupIndex}.maxSelect`, {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                      </div>

                      {/* Options Section inside Group */}
                      <div className="pt-2 border-t border-stone-200/60 dark:border-zinc-800 space-y-2">
                        <Label>Daftar Opsi Variasi</Label>
                        <VariantOptionsList
                          groupIndex={groupIndex}
                          control={control}
                          register={register}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {initialData ? 'Simpan Perubahan' : 'Tambah Menu'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VariantOptionsList({
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
            placeholder="Nama Opsi (misal: Extra Shot)"
            className="flex-2"
            {...register(`variantGroups.${groupIndex}.options.${optionIndex}.name`)}
          />
          <Input
            type="number"
            placeholder="Ekstra Harga (+Rp)"
            className="flex-1"
            {...register(`variantGroups.${groupIndex}.options.${optionIndex}.extraPrice`, {
              valueAsNumber: true,
            })}
          />
          <button
            type="button"
            onClick={() => remove(optionIndex)}
            className="text-stone-400 hover:text-red-500 p-2"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        onClick={() => append({ name: '', extraPrice: 0, isAvailable: true })}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        + Tambah Opsi
      </Button>
    </div>
  );
}
