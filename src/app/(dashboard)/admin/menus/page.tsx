'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/lib/constants/roles';
import { AdminMenuItem } from '@/lib/api/admin-menus-api';
import {
  useAdminMenusPaginatedQuery,
  useToggleMenuAvailabilityMutation,
  useDeleteMenuMutation,
} from '@/hooks/queries/use-admin-menus';
import { useAdminCategoriesQuery } from '@/hooks/queries/use-admin-categories';
import {
  CategoryManagerModal,
  MenuFilterBar,
  MenuTable,
  MenuCardsMobile,
} from '@/components/menus';
import { Pagination } from '@/components/common/pagination';

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
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  // Queries & Mutations
  const { data: categories = [] } = useAdminCategoriesQuery();
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

  const handleToggleStock = async (menu: AdminMenuItem) => {
    await toggleMutation.mutateAsync({
      id: menu.id,
      isAvailable: !menu.isAvailable,
      menuName: menu.name,
    });
  };

  const handleDeleteMenu = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${name}"?`)) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
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
              className="flex-1 sm:flex-none text-xs cursor-pointer"
            >
              <Tags className="h-3.5 w-3.5 mr-1.5" />
              Kategori ({categories.length})
            </Button>

            <Button
              size="sm"
              onClick={() => router.push('/admin/menus/create')}
              className="hidden sm:inline-flex text-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              + Tambah Menu
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <MenuFilterBar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          sortBy={sortBy}
          onSortByChange={(newSort) => {
            setSortBy(newSort);
            setPage(1);
          }}
          sortOrder={sortOrder}
          onToggleSortOrder={() => {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            setPage(1);
          }}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* Mobile Card List View */}
        <MenuCardsMobile
          menus={menus}
          isLoading={isMenusLoading}
          isTogglePending={toggleMutation.isPending}
          isDeletePending={deleteMutation.isPending}
          onToggleStock={handleToggleStock}
          onDeleteMenu={handleDeleteMenu}
        />

        {/* Desktop Table View */}
        <MenuTable
          menus={menus}
          isLoading={isMenusLoading}
          isTogglePending={toggleMutation.isPending}
          isDeletePending={deleteMutation.isPending}
          onToggleStock={handleToggleStock}
          onDeleteMenu={handleDeleteMenu}
        />

        {/* Reusable Pagination Bar */}
        <Pagination
          page={meta.page}
          limit={meta.limit}
          totalItems={meta.totalItems}
          totalPages={meta.totalPages}
          hasNextPage={meta.hasNextPage}
          hasPrevPage={meta.hasPrevPage}
          isLoading={isMenusLoading || isPlaceholderData}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          itemLabel="menu"
        />

        {/* Mobile Floating Action Button */}
        <Button
          size="icon"
          onClick={() => router.push('/admin/menus/create')}
          className="fixed bottom-20 right-5 z-40 md:hidden h-14 w-14 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/40 cursor-pointer active:scale-95 transition-transform"
          aria-label="Tambah Menu Baru"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Category Manager Modal */}
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          onRefresh={() => { }}
        />
      </div>
    </RoleGuard>
  );
}
