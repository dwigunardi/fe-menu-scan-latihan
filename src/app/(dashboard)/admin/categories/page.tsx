'use client';

import { useMemo, useState, type SubmitEvent } from 'react';
import {
  Tags,
  Plus,
  Search,
  Edit2,
  Trash2,
  UtensilsCrossed,
  Layers,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { RoleGuard } from '@/components/common/role-guard';
import {
  useAdminCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/hooks/queries/use-admin-categories';
import { useAdminMenusQuery } from '@/hooks/queries/use-admin-menus';
import { CategoryData } from '@/lib/validations/admin-menu.schema';
import { toast } from 'sonner';

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [sortOrder, setSortOrder] = useState(1);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<CategoryData | null>(null);

  const { data: categories = [], isLoading: isCategoriesLoading } = useAdminCategoriesQuery();
  const { data: menus = [], isLoading: isMenusLoading } = useAdminMenusQuery();

  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  const isLoading = isCategoriesLoading || isMenusLoading;

  // Calculate live menu counts per category
  const menuCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    menus.forEach((m) => {
      counts[m.categoryId] = (counts[m.categoryId] || 0) + 1;
    });
    return counts;
  }, [menus]);

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.slug && c.slug.toLowerCase().includes(search.toLowerCase()))
    );
  }, [categories, search]);

  const totalMenus = menus.length;

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCategoryName('');
    setSortOrder((categories.length || 0) + 1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: CategoryData) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setSortOrder(category.sortOrder ?? 1);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }

    if (editingCategory) {
      await updateMutation.mutateAsync({
        id: editingCategory.id,
        payload: {
          name: categoryName.trim(),
          sortOrder: Number(sortOrder),
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: categoryName.trim(),
        sortOrder: Number(sortOrder),
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const count = menuCountMap[deleteTarget.id] || 0;
    if (count > 0) {
      toast.error(
        `Tidak dapat menghapus kategori "${deleteTarget.name}". Masih terdapat ${count} menu aktif di dalamnya.`
      );
      setDeleteTarget(null);
      return;
    }

    await deleteMutation.mutateAsync({
      id: deleteTarget.id,
      name: deleteTarget.name,
    });
    setDeleteTarget(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6 max-w-7xl mx-auto transition-colors">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-zinc-100 tracking-tight">
                Kategori Menu
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                {categories.length} Kategori
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 mt-1">
              Kelola pengelompokan dan urutan tampilan kategori menu di aplikasi pelanggan.
            </p>
          </div>

          <Button onClick={handleOpenCreate} className="shadow-md shadow-amber-600/20">
            <Plus className="h-4 w-4 mr-2" />
            <span>Tambah Kategori</span>
          </Button>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Tags className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400 block">
                Total Kategori
              </span>
              <span className="text-2xl font-black text-stone-900 dark:text-zinc-100">
                {categories.length}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400 block">
                Total Menu Terhubung
              </span>
              <span className="text-2xl font-black text-stone-900 dark:text-zinc-100">
                {totalMenus}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400 block">
                Status Pengurutan
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                <Check className="h-4 w-4" /> Urutan Kustom Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Cari kategori berdasarkan nama atau slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 bg-white dark:bg-zinc-900"
          />
          <Search className="h-4 w-4 absolute left-3.5 top-4 text-stone-400 dark:text-zinc-500" />
        </div>

        {/* Desktop Data Table */}
        <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50/80 dark:bg-zinc-800/60 text-stone-500 dark:text-zinc-400 border-b border-stone-200/80 dark:border-zinc-800 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6 w-20">Urutan</th>
                <th className="py-4 px-6">Nama Kategori</th>
                <th className="py-4 px-6">Slug URL</th>
                <th className="py-4 px-6 text-center">Jumlah Menu</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat, idx) => {
                  const count = menuCountMap[cat.id] || cat._count?.menuItems || 0;

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-stone-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-stone-100 dark:bg-zinc-800 font-mono font-bold text-xs text-stone-700 dark:text-zinc-300">
                          #{cat.sortOrder ?? idx + 1}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Tags className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="font-bold text-stone-900 dark:text-zinc-100">
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <code className="text-xs font-mono text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                          {cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}
                        </code>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200">
                          <UtensilsCrossed className="h-3 w-3 text-amber-600" />
                          <span>{count} Menu</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <SimpleTooltip content="Edit Kategori" side="top">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cat)}
                              className="h-9 w-9 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:text-amber-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </SimpleTooltip>
                          <SimpleTooltip content="Hapus Kategori" side="top">
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(cat)}
                              className="h-9 w-9 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:text-red-600 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </SimpleTooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400 dark:text-zinc-500">
                    {isLoading ? 'Memuat kategori...' : 'Tidak ada kategori yang sesuai.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Compact Cards */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat, idx) => {
              const count = menuCountMap[cat.id] || cat._count?.menuItems || 0;

              return (
                <div
                  key={cat.id}
                  className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-2xl bg-amber-100 dark:bg-amber-950/80 font-mono font-bold text-xs text-amber-700 dark:text-amber-400 shrink-0">
                      #{cat.sortOrder ?? idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="font-bold text-sm text-stone-900 dark:text-zinc-100 block truncate">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-stone-400 dark:text-zinc-500">
                          {cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                          {count} Menu
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="h-9 w-9 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:text-amber-600 hover:border-amber-500 transition-all cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(cat)}
                      className="h-9 w-9 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:text-red-600 hover:border-red-500 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-stone-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800">
              {isLoading ? 'Memuat kategori...' : 'Tidak ada kategori yang sesuai.'}
            </div>
          )}
        </div>

        {/* Create / Edit Category Modal Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-stone-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <Tags className="h-5 w-5 text-amber-600" />
                <span>{editingCategory ? 'Edit Kategori Menu' : 'Tambah Kategori Baru'}</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveCategory} className="space-y-4 py-2">
              <div>
                <Label htmlFor="catName" className="text-stone-700 dark:text-zinc-300">
                  Nama Kategori <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="catName"
                  type="text"
                  placeholder="Contoh: Signature Mocktail, Artisanal Tea"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sortOrder" className="text-stone-700 dark:text-zinc-300">
                  Urutan Tampilan (Sort Order)
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={1}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="mt-1 font-mono"
                />
                <span className="text-[11px] text-stone-400 dark:text-zinc-500 block mt-1">
                  Kategori dengan nomor urut lebih kecil akan tampil lebih depan pada tab filter pelanggan.
                </span>
              </div>

              <DialogFooter className="pt-4 flex gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Batal
                </Button>
                <Button type="submit" isLoading={isSaving}>
                  {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-stone-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                <span>Hapus Kategori?</span>
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm text-stone-600 dark:text-zinc-300 py-2">
              Apakah Anda yakin ingin menghapus kategori{' '}
              <strong className="text-stone-900 dark:text-white">"{deleteTarget?.name}"</strong>?
            </p>

            <DialogFooter className="pt-4 flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Ya, Hapus Kategori
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
