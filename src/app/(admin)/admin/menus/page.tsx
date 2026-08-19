'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Tags, Edit, Trash2, SlidersHorizontal, ImageOff, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah } from '@/lib/utils/format-currency';
import { notifyApiError } from '@/lib/api/notify-error';
import { toast } from 'sonner';
import {
  getAdminMenus,
  getAdminCategories,
  toggleMenuAvailability,
  deleteAdminMenu,
  AdminMenuItem,
} from '@/lib/api/admin-menus-api';
import { CategoryData } from '@/lib/validations/admin-menu.schema';
import { MenuFormModal } from '@/components/admin/menu-form-modal';
import { CategoryManagerModal } from '@/components/admin/category-manager-modal';

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<AdminMenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<AdminMenuItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [menusRes, catRes] = await Promise.all([
      getAdminMenus(selectedCategory === 'ALL' ? undefined : selectedCategory),
      getAdminCategories(),
    ]);

    if (menusRes.isRight()) {
      setMenus(menusRes.value);
    } else {
      notifyApiError(menusRes.value);
    }

    if (catRes.isRight()) {
      setCategories(catRes.value);
    }

    setIsLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Instant Availability Toggle
  const handleToggleStock = async (menu: AdminMenuItem) => {
    const updatedStatus = !menu.isAvailable;

    // Optimistic UI update
    setMenus((prev) =>
      prev.map((m) => (m.id === menu.id ? { ...m, isAvailable: updatedStatus } : m))
    );

    const result = await toggleMenuAvailability(menu.id, updatedStatus);
    if (result.isLeft()) {
      // Rollback on error
      setMenus((prev) =>
        prev.map((m) => (m.id === menu.id ? { ...m, isAvailable: menu.isAvailable } : m))
      );
      notifyApiError(result.value);
    } else {
      toast.success(
        updatedStatus
          ? `Stok "${menu.name}" sekarang Tersedia!`
          : `Stok "${menu.name}" ditandai Habis!`
      );
    }
  };

  // Delete Menu
  const handleDeleteMenu = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${name}"?`)) return;

    const result = await deleteAdminMenu(id);
    if (result.isLeft()) {
      notifyApiError(result.value);
    } else {
      toast.success(`Menu "${name}" berhasil dihapus!`);
      setMenus((prev) => prev.filter((m) => m.id !== id));
    }
  };

  // Filtered menus by search
  const filteredMenus = menus.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
            Katalog Menu & Variasi
          </h1>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Kelola menu, harga, opsi variasi, dan ketersediaan stok secara live.
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
            onClick={() => {
              setEditingMenu(null);
              setIsMenuModalOpen(true);
            }}
            className="hidden sm:inline-flex text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            + Tambah Menu
          </Button>
        </div>
      </div>

      {/* Search & Horizontal Touch-Scroll Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-stone-400" />
          <Input
            placeholder="Cari menu (misal: Aren, Espresso, Croissant)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-xs sm:text-sm"
          />
        </div>

        {/* Horizontal Category Pills with momentum scrolling */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-50'
            }`}
          >
            Semua ({menus.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ?? MOBILE VIEW: Compact Mobile Action Cards (Layar < 768px) */}
      {/* ========================================================= */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 flex gap-3 items-center">
              <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))
        ) : filteredMenus.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 text-stone-400">
            <SlidersHorizontal className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">Tidak ada menu yang sesuai</p>
          </div>
        ) : (
          filteredMenus.map((menu) => (
            <div
              key={menu.id}
              className="p-3.5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3 transition-all"
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
                    � {menu.variantGroups?.length || 0} Variasi
                  </span>
                </div>
                <div className="font-mono font-bold text-sm text-stone-900 dark:text-zinc-100 mt-1">
                  {formatRupiah(menu.price)}
                </div>
              </div>

              {/* Mobile Right Controls: Stock Switch & Actions */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                {/* 44px Touch Target Stock Switch */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-stone-400">
                    {menu.isAvailable ? 'Ada' : 'Habis'}
                  </span>
                  <Switch
                    checked={menu.isAvailable}
                    onCheckedChange={() => handleToggleStock(menu)}
                  />
                </div>

                {/* Edit & Delete Mini Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMenu(menu);
                      setIsMenuModalOpen(true);
                    }}
                    className="h-7 w-7 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 hover:text-amber-600"
                    title="Edit Menu"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMenu(menu.id, menu.name)}
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
      {/* ?? DESKTOP & TABLET VIEW: Full Data Table (Layar = 768px) */}
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
              {isLoading ? (
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
              ) : filteredMenus.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <SlidersHorizontal className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">Tidak ada menu yang sesuai</p>
                  </td>
                </tr>
              ) : (
                filteredMenus.map((menu) => (
                  <tr
                    key={menu.id}
                    className="hover:bg-stone-50/60 dark:hover:bg-zinc-800/30 transition-colors"
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
                    <td className="py-3.5 px-4 text-center">
                      <Switch
                        checked={menu.isAvailable}
                        onCheckedChange={() => handleToggleStock(menu)}
                      />
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMenu(menu);
                            setIsMenuModalOpen(true);
                          }}
                          className="h-8 w-8 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 hover:text-amber-600 hover:border-amber-500 transition-colors"
                          title="Edit Menu"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMenu(menu.id, menu.name)}
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
      {/* ?? MOBILE FLOATING ACTION BUTTON (FAB: + Tambah Menu) */}
      {/* ========================================================= */}
      <button
        type="button"
        onClick={() => {
          setEditingMenu(null);
          setIsMenuModalOpen(true);
        }}
        className="fixed bottom-20 right-5 z-40 md:hidden h-14 w-14 rounded-full bg-amber-600 text-white shadow-xl shadow-amber-600/40 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Tambah Menu Baru"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modals */}
      <MenuFormModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        onSuccess={loadData}
        initialData={editingMenu}
        categories={categories}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onRefresh={loadData}
      />
    </div>
  );
}
