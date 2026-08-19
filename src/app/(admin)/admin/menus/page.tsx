'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Tags,
  Edit,
  Trash2,
  SlidersHorizontal,
  ImageOff,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah } from '@/lib/utils/format-currency';
import { AdminMenuItem } from '@/lib/api/admin-menus-api';
import {
  useAdminMenusPaginatedQuery,
  useToggleMenuAvailabilityMutation,
  useDeleteMenuMutation,
} from '@/hooks/queries/use-admin-menus';
import { useAdminCategoriesQuery } from '@/hooks/queries/use-admin-categories';
import { CategoryManagerModal } from '@/components/admin/category-manager-modal';

export default function AdminMenusPage() {
  const router = useRouter();

  // Pagination & Filtering state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating' | 'createdAt' | 'isAvailable'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Lightweight Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Reset to page 1 when category filter changes
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  // Queries & Mutations
  const { data: categories = [], isLoading: isCatLoading } = useAdminCategoriesQuery();
  const {
    data: paginatedData,
    isLoading: isMenusLoading,
    isPlaceholderData,
  } = useAdminMenusPaginatedQuery({
    page,
    limit,
    categoryId: selectedCategory === 'ALL' ? undefined : selectedCategory,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  });

  const toggleMutation = useToggleMenuAvailabilityMutation();
  const deleteMutation = useDeleteMenuMutation();

  const menus = paginatedData?.items || [];
  const meta = paginatedData?.meta || {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Instant Availability Toggle
  const handleToggleStock = async (menu: AdminMenuItem) => {
    await toggleMutation.mutateAsync({
      id: menu.id,
      isAvailable: !menu.isAvailable,
      menuName: menu.name,
    });
  };

  // Delete Menu with confirmation
  const handleDeleteMenu = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${name}"?`)) return;
    await deleteMutation.mutateAsync(id);
  };

  const startItem = meta.totalItems === 0 ? 0 : (meta.page - 1) * (meta.limit === -1 ? meta.totalItems : meta.limit) + 1;
  const endItem = meta.limit === -1 ? meta.totalItems : Math.min(meta.page * meta.limit, meta.totalItems);

  return (
    <div className="space-y-5 pb-16">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
            Katalog Menu & Variasi
          </h1>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Kelola menu, harga, opsi variasi, dan ketersediaan stok secara terpaginasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 sm:flex-none text-xs"
          >
            <Tags className="h-3.5 w-3.5 mr-1.5" />
            Kategori ({categories.length})
          </Button>

          <Button
            size="sm"
            onClick={() => router.push('/admin/menus/create')}
            className="hidden sm:inline-flex text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            + Tambah Menu
          </Button>
        </div>
      </div>

      {/* Search Bar & Sorting Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-stone-400" />
            <Input
              placeholder="Cari menu (misal: Aren, Espresso, Croissant)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
              className="h-10 px-3 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-stone-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="createdAt">Terbaru Dibuat</option>
              <option value="name">Nama Menu (A-Z)</option>
              <option value="price">Harga</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="isAvailable">Ketersediaan Stok</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                setPage(1);
              }}
              className="h-10 px-3 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800"
              title="Ubah Urutan Sort"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{sortOrder === 'asc' ? 'Naik' : 'Turun'}</span>
            </button>
          </div>
        </div>

        {/* Categories Pill Scroller (Limit: -1 Full List) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          <button
            type="button"
            onClick={() => handleSelectCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
            }`}
          >
            Semua Menu
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                  : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE CARDS VIEW (Layar < 768px) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {isMenusLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3"
            >
              <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))
        ) : menus.length === 0 ? (
          <div className="py-12 text-center text-stone-400 bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80">
            <SlidersHorizontal className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold">Tidak ada menu yang sesuai</p>
          </div>
        ) : (
          menus.map((menu) => (
            <div
              key={menu.id}
              onClick={() => router.push(`/admin/menus/detail/${menu.id}`)}
              className="p-3.5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3 transition-all cursor-pointer hover:border-amber-400 dark:hover:border-amber-600/50"
            >
              {/* Thumbnail */}
              <div className="h-16 w-16 rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-800 shrink-0 border border-stone-100 flex items-center justify-center">
                {menu.imageUrl ? (
                  <img
                    src={menu.imageUrl}
                    alt={menu.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageOff className="h-5 w-5 text-stone-300" />
                )}
              </div>

              {/* Info & Badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-zinc-100 truncate">
                    {menu.name}
                  </h3>
                  {menu.isBestSeller && (
                    <Badge variant="bestseller" className="text-[8px] px-1 py-0 shrink-0">
                      Best
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-500">
                    {menu.category?.name || 'Uncategorized'}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    • {menu.variantGroups?.length || 0} Variasi
                  </span>
                </div>
                <div className="font-mono font-bold text-sm text-stone-900 dark:text-zinc-100 mt-1">
                  {formatRupiah(menu.price)}
                </div>
              </div>

              {/* Mobile Right Controls: Stock Switch & Actions */}
              <div
                className="flex flex-col items-end gap-2 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-stone-400">
                    {menu.isAvailable ? 'Ada' : 'Habis'}
                  </span>
                  <Switch
                    checked={menu.isAvailable}
                    onCheckedChange={() => handleToggleStock(menu)}
                    disabled={toggleMutation.isPending}
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/menus/edit/${menu.id}`)}
                    className="h-7 w-7 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 hover:text-amber-600"
                    title="Edit Menu"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMenu(menu.id, menu.name)}
                    disabled={deleteMutation.isPending}
                    className="h-7 w-7 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-400 hover:text-red-600"
                    title="Hapus Menu"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================= */}
      {/* DESKTOP & TABLET VIEW: Full Data Table (Layar >= 768px) */}
      {/* ========================================================= */}
      <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-800/40 text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Menu Item</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Harga (Base)</th>
                <th className="py-3.5 px-4">Variasi</th>
                <th className="py-3.5 px-4 text-center">Status Stok</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
              {isMenusLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-6 w-11 mx-auto rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : menus.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <SlidersHorizontal className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">Tidak ada menu yang sesuai</p>
                  </td>
                </tr>
              ) : (
                menus.map((menu) => (
                  <tr
                    key={menu.id}
                    onClick={() => router.push(`/admin/menus/detail/${menu.id}`)}
                    className="hover:bg-stone-50/60 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    {/* Item Name & Thumb */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 shrink-0 flex items-center justify-center">
                          {menu.imageUrl ? (
                            <img
                              src={menu.imageUrl}
                              alt={menu.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageOff className="h-5 w-5 text-stone-300" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 dark:text-zinc-100">
                              {menu.name}
                            </span>
                            {menu.isBestSeller && (
                              <Badge variant="bestseller" className="text-[9px] px-1.5 py-0.5">
                                Best Seller
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 dark:text-zinc-400 line-clamp-1">
                            {menu.description || 'Tidak ada deskripsi'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300">
                        {menu.category?.name || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-zinc-100">
                      {formatRupiah(menu.price)}
                    </td>

                    {/* Variant count */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-stone-500 font-medium">
                        {menu.variantGroups?.length || 0} Grup Variasi
                      </span>
                    </td>

                    {/* Availability Switch */}
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch
                        checked={menu.isAvailable}
                        onCheckedChange={() => handleToggleStock(menu)}
                        disabled={toggleMutation.isPending}
                      />
                    </td>

                    {/* Action buttons */}
                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/menus/detail/${menu.id}`)}
                          className="h-8 w-8 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 hover:text-amber-600 hover:border-amber-500 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/menus/edit/${menu.id}`)}
                          className="h-8 w-8 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 hover:text-amber-600 hover:border-amber-500 transition-colors"
                          title="Edit Menu"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMenu(menu.id, menu.name)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-400 hover:text-red-600 hover:border-red-500 transition-colors"
                          title="Hapus Menu"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PAGINATION CONTROLS BAR */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-zinc-400">
          <span>
            Menampilkan <strong className="font-semibold text-stone-800 dark:text-zinc-200">{startItem}-{endItem}</strong> dari{' '}
            <strong className="font-semibold text-stone-800 dark:text-zinc-200">{meta.totalItems}</strong> menu
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            <span>Per hal:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 px-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={-1}>Semua</option>
            </select>
          </div>
        </div>

        {meta.limit !== -1 && meta.totalPages > 1 && (
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!meta.hasPrevPage || isMenusLoading || isPlaceholderData}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Sebelumnya
            </Button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: meta.totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                // Only display nearby pages for clean pagination
                if (
                  pageNum === 1 ||
                  pageNum === meta.totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                        pageNum === page
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === page - 2 || pageNum === page + 2) {
                  return <span key={pageNum} className="text-xs text-stone-400">...</span>;
                }
                return null;
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
              disabled={!meta.hasNextPage || isMenusLoading || isPlaceholderData}
              className="h-8 px-2.5 text-xs"
            >
              Selanjutnya
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile (+ Tambah Menu) */}
      <button
        type="button"
        onClick={() => router.push('/admin/menus/create')}
        className="fixed bottom-20 right-5 z-40 md:hidden h-14 w-14 rounded-full bg-amber-600 text-white shadow-xl shadow-amber-600/40 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Tambah Menu Baru"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Category Manager Modal (Lightweight) */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onRefresh={() => {}}
      />
    </div>
  );
}
