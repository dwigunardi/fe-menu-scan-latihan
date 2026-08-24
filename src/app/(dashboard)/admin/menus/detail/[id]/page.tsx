'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ImageOff,
  Star,
  Layers,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleGuard } from '@/components/common/role-guard';
import { formatRupiah } from '@/lib/utils/format-currency';
import { formatImageUrl } from '@/lib/api/admin-menus-api';
import {
  useAdminMenuDetailQuery,
  useToggleMenuAvailabilityMutation,
  useDeleteMenuMutation,
} from '@/hooks/queries/use-admin-menus';

export default function MenuDetailPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = typeof params?.id === 'string' ? params.id : '';

  const { data: menu, isLoading, isError } = useAdminMenuDetailQuery(menuId);
  const toggleMutation = useToggleMenuAvailabilityMutation();
  const deleteMutation = useDeleteMenuMutation();

  const handleToggleStock = async () => {
    if (!menu) return;
    await toggleMutation.mutateAsync({
      id: menu.id,
      isAvailable: !menu.isAvailable,
      menuName: menu.name,
    });
  };

  const handleDelete = async () => {
    if (!menu) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${menu.name}"?`)) return;

    await deleteMutation.mutateAsync(menu.id);
    router.push('/admin/menus');
  };

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      {isLoading ? (
        <div className="space-y-6 max-w-5xl py-6">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <Skeleton className="md:col-span-5 h-72 rounded-3xl" />
            <Skeleton className="md:col-span-7 h-72 rounded-3xl" />
          </div>
        </div>
      ) : isError || !menu ? (
        <div className="py-16 text-center space-y-4">
          <h2 className="text-xl font-bold text-stone-800 dark:text-zinc-200">
            Detail Menu Tidak Ditemukan
          </h2>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Data menu tidak ditemukan atau URL yang Anda tuju sudah tidak aktif.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/menus')}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Kembali ke Katalog
          </Button>
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl pb-16">
          {/* Top Header & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-zinc-800">
            <div>
              <Link
                href="/admin/menus"
                className="inline-flex items-center text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Kembali ke Katalog Menu
              </Link>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
                  {menu.name}
                </h1>
                {menu.category && (
                  <Badge variant="outline" className="text-xs font-semibold">
                    {menu.category.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-stone-100 dark:bg-zinc-800 px-3 py-1.5 rounded-2xl border border-stone-200/60 dark:border-zinc-700">
                <span className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                  {menu.isAvailable ? 'Tersedia' : 'Habis'}
                </span>
                <Switch
                  checked={menu.isAvailable}
                  onCheckedChange={handleToggleStock}
                  disabled={toggleMutation.isPending}
                />
              </div>

              <Button
                size="sm"
                onClick={() => router.push(`/admin/menus/edit/${menu.id}`)}
                className="text-xs"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Menu
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-xs text-red-600 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Hapus
              </Button>
            </div>
          </div>

          {/* Main Grid Detail */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="md:col-span-5 space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
                <div className="h-60 w-full bg-stone-100 dark:bg-zinc-800 relative flex items-center justify-center overflow-hidden">
                  {menu.imageUrl ? (
                    <img
                      src={formatImageUrl(menu.imageUrl)}
                      alt={menu.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-stone-400">
                      <ImageOff className="h-10 w-10 opacity-40" />
                      <span className="text-xs font-medium">Foto Menu Belum Tersedia</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {menu.isBestSeller && (
                      <Badge variant="bestseller" className="text-[10px] px-2 py-0.5 shadow-sm">
                        Best Seller
                      </Badge>
                    )}
                    {menu.isRecommended && (
                      <Badge variant="recommended" className="text-[10px] px-2 py-0.5 shadow-sm">
                        Recommended
                      </Badge>
                    )}
                  </div>

                  {!menu.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        Stok Saat Ini Habis
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-zinc-800">
                    <div>
                      <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                        Harga Jual
                      </p>
                      {menu.promoPrice && menu.promoPrice < menu.price ? (
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xl font-bold font-mono text-red-600">
                            {formatRupiah(menu.promoPrice)}
                          </span>
                          <span className="text-xs font-mono text-stone-400 line-through">
                            {formatRupiah(menu.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold font-mono text-stone-900 dark:text-zinc-50 block mt-0.5">
                          {formatRupiah(menu.price)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 px-3 py-1 rounded-xl">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        {menu.rating.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                        ({menu.reviewCount})
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
                      Deskripsi Menu
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                      {menu.description || 'Tidak ada deskripsi rinci untuk menu ini.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Variant Groups Breakdown */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-amber-600" />
                  <h2 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                    Grup Pilihan Variasi & Topping
                  </h2>
                </div>
                <Badge variant="outline" className="text-xs">
                  {menu.variantGroups?.length || 0} Grup
                </Badge>
              </div>

              {!menu.variantGroups || menu.variantGroups.length === 0 ? (
                <div className="py-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 p-6">
                  <Sliders className="h-8 w-8 mx-auto mb-2 text-stone-300 dark:text-zinc-600" />
                  <p className="text-xs font-semibold text-stone-500">
                    Menu ini tidak memiliki opsi variasi tambahan.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/menus/edit/${menu.id}`)}
                    className="mt-3 text-xs"
                  >
                    + Tambah Variasi Sekarang
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {menu.variantGroups.map((group, gIdx) => (
                    <div
                      key={group.id || gIdx}
                      className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-stone-200/80 dark:border-zinc-800 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-zinc-800">
                        <div>
                          <span className="font-bold text-sm text-stone-900 dark:text-zinc-100">
                            {group.name}
                          </span>
                          <span className="text-[11px] text-stone-400 ml-2">
                            ({group.minSelect}-{group.maxSelect} pilihan)
                          </span>
                        </div>

                        {group.isRequired ? (
                          <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                            Wajib Dipilih
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                            Opsional
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {group.options.map((opt, oIdx) => (
                          <div
                            key={opt.id || oIdx}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-100 dark:border-zinc-800 text-xs"
                          >
                            <span className="font-medium text-stone-800 dark:text-zinc-200">
                              {opt.name}
                            </span>
                            <span className="font-mono font-bold text-stone-600 dark:text-zinc-400">
                              {opt.extraPrice > 0 ? `+${formatRupiah(opt.extraPrice)}` : 'Gratis'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
