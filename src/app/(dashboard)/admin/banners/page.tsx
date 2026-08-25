'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Search,
  SlidersHorizontal,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Trash2,
  Smartphone,
} from 'lucide-react';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/lib/constants/roles';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { BannerCard, PromoCarousel } from '@/components/banners';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminBannersQuery,
  useToggleBannerStatusMutation,
  useDeleteBannerMutation,
} from '@/hooks/queries/use-admin-banners';
import { BannerData } from '@/lib/validations/banner.schema';

export default function AdminBannersPage() {
  const { data: banners = [], isLoading } = useAdminBannersQuery();
  const toggleMutation = useToggleBannerStatusMutation();
  const deleteMutation = useDeleteBannerMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Filtered Banners
  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      const matchSearch =
        banner.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (banner.description &&
          banner.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? banner.isActive
          : !banner.isActive;

      return matchSearch && matchStatus;
    });
  }, [banners, searchQuery, statusFilter]);

  // Statistics
  const activeBanners = useMemo(
    () => banners.filter((b) => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [banners]
  );
  const totalBanners = banners.length;
  const inactiveBanners = totalBanners - activeBanners.length;

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    await toggleMutation.mutateAsync({ id, isActive });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({
      id: deleteTarget.id,
      title: deleteTarget.title,
    });
    setDeleteTarget(null);
  };

  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <div className="space-y-8 pb-20">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              <Sparkles className="h-4 w-4" />
              <span>Marketing & Banner Promosi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-zinc-100">
              Banner Promo Kafe
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 mt-0.5">
              Kelola penayangan carousel banner promosi yang tampil di halaman pemesanan pelanggan.
            </p>
          </div>

          <Link href="/admin/banners/create">
            <Button className="h-11 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Tambah Banner Baru</span>
            </Button>
          </Link>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">
                Total Banner
              </p>
              <p className="text-2xl font-black text-stone-900 dark:text-zinc-100">
                {totalBanners}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 flex items-center justify-center">
              <ImageIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Tayang Aktif
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {activeBanners.length}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">
                Draft / Nonaktif
              </p>
              <p className="text-2xl font-black text-stone-700 dark:text-zinc-300">
                {inactiveBanners}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-500 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Live Customer Carousel Preview Showcase */}
        {activeBanners.length > 0 && (
          <div className="p-5 sm:p-6 rounded-3xl border border-amber-200/80 dark:border-zinc-800 bg-linear-to-b from-amber-50/50 via-white to-white dark:from-zinc-900 dark:to-zinc-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                    Live Carousel Pelanggan Saat Ini
                  </h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Simulasi carousel promo yang sedang aktif tayang di layar pelanggan ({activeBanners.length} banner).
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                Auto-Play Aktif
              </span>
            </div>

            <div className="max-w-2xl mx-auto">
              <PromoCarousel initialBanners={activeBanners} />
            </div>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
            <Input
              type="text"
              placeholder="Cari judul promo atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-2xl text-xs bg-white dark:bg-zinc-900 border-stone-200/80 dark:border-zinc-800"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-100 dark:bg-zinc-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white font-bold shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:text-zinc-400'
              }`}
            >
              Semua ({totalBanners})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:text-zinc-400'
              }`}
            >
              Tayang ({activeBanners.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                statusFilter === 'INACTIVE'
                  ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white font-bold shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:text-zinc-400'
              }`}
            >
              Draft ({inactiveBanners})
            </button>
          </div>
        </div>

        {/* Banner Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 rounded-3xl bg-stone-100 dark:bg-zinc-800/60 animate-pulse border border-stone-200/50 dark:border-zinc-800"
              />
            ))}
          </div>
        ) : filteredBanners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBanners.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onToggleStatus={handleToggleStatus}
                onDelete={(id, title) => setDeleteTarget({ id, title })}
                isToggling={toggleMutation.isPending}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-3xl border-2 border-dashed border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-900/50 p-8 space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
              <ImageIcon className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Tidak Ada Banner yang Cocok'
                  : 'Belum Ada Banner Promo'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Coba ubah kata kunci pencarian atau reset filter status penayangan.'
                  : 'Buat banner promosi pertama untuk menarik minat pelanggan di aplikasi pemesanan QR.'}
              </p>
            </div>
            {!searchQuery && statusFilter === 'ALL' && (
              <Link href="/admin/banners/create">
                <Button className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span>Tambah Banner Sekarang</span>
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal using Reusable ConfirmationDialog */}
        <ConfirmationDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          variant="danger"
          icon={Trash2}
          title="Hapus Banner Promo?"
          description={`Apakah Anda yakin ingin menghapus banner "${deleteTarget?.title}"? Banner yang dihapus tidak dapat dipulihkan kembali.`}
          confirmText="Ya, Hapus Banner"
          cancelText="Batal"
          isLoading={deleteMutation.isPending}
          loadingText="Menghapus..."
        />
      </div>
    </RoleGuard>
  );
}
