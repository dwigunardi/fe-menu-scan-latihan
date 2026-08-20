'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Users,
  QrCode,
  RotateCcw,
  Edit,
  Trash2,
  Coffee,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Armchair,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminTablesPaginatedQuery,
  useResetTableMutation,
  useDeleteTableMutation,
} from '@/hooks/queries/use-admin-tables';
import { TableData, TableStatus } from '@/lib/validations/table.schema';
import { TableFormModal } from '@/components/admin/table-form-modal';
import { TableQrModal } from '@/components/admin/table-qr-modal';

export default function AdminTablesPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [tableToEdit, setTableToEdit] = useState<TableData | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [tableForQr, setTableForQr] = useState<TableData | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Query: Unbounded limit: -1 to get all tables for floor plan view
  const { data: paginatedData, isLoading } = useAdminTablesPaginatedQuery({
    limit: -1,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    search: debouncedSearch || undefined,
    sortBy: 'number',
    sortOrder: 'asc',
  });

  const resetMutation = useResetTableMutation();
  const deleteMutation = useDeleteTableMutation();

  const tables = paginatedData?.items || [];

  // Summary Metrics Calculation
  const metrics = useMemo(() => {
    const totalTables = tables.length;
    const vacantCount = tables.filter((t) => t.status === 'VACANT').length;
    const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
    const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 0), 0);

    return { totalTables, vacantCount, occupiedCount, totalCapacity };
  }, [tables]);

  // Actions
  const handleOpenCreate = () => {
    setTableToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (table: TableData) => {
    setTableToEdit(table);
    setIsFormModalOpen(true);
  };

  const handleOpenQr = (table: TableData) => {
    setTableForQr(table);
    setIsQrModalOpen(true);
  };

  const handleResetSession = async (table: TableData) => {
    if (
      !confirm(
        `Reset sesi Meja "${table.tableNumber}"? Tamu aktif (${table.activeGuestName || 'Tamu'}) akan dikosongkan dan status meja kembali ke KOSONG (VACANT).`
      )
    ) {
      return;
    }

    await resetMutation.mutateAsync({
      id: table.id,
      tableNumber: table.tableNumber,
    });
  };

  const handleDelete = async (table: TableData) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Meja "${table.tableNumber}"?`)) {
      return;
    }

    await deleteMutation.mutateAsync({
      id: table.id,
      tableNumber: table.tableNumber,
    });
  };

  // Helper for Status Badge & Styling
  const getStatusConfig = (status: TableStatus) => {
    switch (status) {
      case 'OCCUPIED':
        return {
          label: 'Terisi (Aktif)',
          badgeClass: 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/20',
          borderClass: 'border-blue-500/40 dark:border-blue-500/30 hover:border-blue-500',
          cardBg: 'bg-blue-50/30 dark:bg-blue-950/10',
          indicator: 'bg-blue-600 animate-pulse',
        };
      case 'WAITING_PAYMENT':
        return {
          label: 'Menunggu Bayar',
          badgeClass: 'bg-amber-600/10 text-amber-700 dark:text-amber-400 border-amber-600/20',
          borderClass: 'border-amber-500/40 dark:border-amber-500/30 hover:border-amber-500',
          cardBg: 'bg-amber-50/30 dark:bg-amber-950/10',
          indicator: 'bg-amber-600',
        };
      case 'WAITING_CLEANUP':
        return {
          label: 'Perlu Dibersihkan',
          badgeClass: 'bg-purple-600/10 text-purple-700 dark:text-purple-400 border-purple-600/20',
          borderClass: 'border-purple-500/40 dark:border-purple-500/30 hover:border-purple-500',
          cardBg: 'bg-purple-50/30 dark:bg-purple-950/10',
          indicator: 'bg-purple-600',
        };
      case 'VACANT':
      default:
        return {
          label: 'Kosong (Tersedia)',
          badgeClass: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/20',
          borderClass: 'border-stone-200/80 dark:border-zinc-800 hover:border-emerald-500',
          cardBg: 'bg-white dark:bg-zinc-900',
          indicator: 'bg-emerald-600',
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================= */}
      {/* PAGE HEADER & ADD TABLE BUTTON */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50 flex items-center gap-2">
            <Armchair className="h-6 w-6 text-amber-600" />
            Denah Meja & Sesi Kasir
          </h1>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Visual floor plan real-time, stiker QR fisik permanen, dan 1-tap reset sesi meja.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Tambah Meja Baru
        </Button>
      </div>

      {/* ========================================================= */}
      {/* SUMMARY METRIC CARDS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400">Total Meja</p>
            <p className="text-xl font-bold text-stone-900 dark:text-zinc-100 mt-0.5 font-mono">
              {metrics.totalTables}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400">Meja Kosong</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono">
              {metrics.vacantCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400">Meja Terisi</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-0.5 font-mono">
              {metrics.occupiedCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400">Kapasitas Kursi</p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-0.5 font-mono">
              {metrics.totalCapacity} Kursi
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEARCH & STATUS FILTER PILLS */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-stone-400" />
          <Input
            placeholder="Cari nomor meja (misal: 01, T-02) atau nama tamu..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 h-10 text-xs sm:text-sm rounded-2xl"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'ALL', label: 'Semua Meja' },
            { id: 'VACANT', label: 'Kosong (Tersedia)' },
            { id: 'OCCUPIED', label: 'Terisi (Aktif)' },
            { id: 'WAITING_PAYMENT', label: 'Menunggu Bayar' },
            { id: 'WAITING_CLEANUP', label: 'Perlu Dibersihkan' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                  : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISUAL FLOOR GRID (KARTU MEJA INTERAKTIF) */}
      {/* ========================================================= */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 space-y-3"
            >
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full rounded-xl pt-2" />
            </div>
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 text-stone-400 space-y-3">
          <Coffee className="h-10 w-10 mx-auto text-amber-600/60" />
          <h3 className="font-bold text-base text-stone-800 dark:text-zinc-200">
            Tidak ada meja yang sesuai
          </h3>
          <p className="text-xs max-w-sm mx-auto">
            {searchInput || selectedStatus !== 'ALL'
              ? 'Coba ganti kata kunci pencarian atau filter status meja.'
              : 'Belum ada meja yang terdaftar. Tambahkan meja pertama Anda sekarang.'}
          </p>
          {!searchInput && selectedStatus === 'ALL' && (
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="text-xs bg-amber-600 text-white rounded-xl mt-2"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Tambah Meja Sekarang
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => {
            const config = getStatusConfig(table.status);

            return (
              <div
                key={table.id}
                className={`p-5 rounded-3xl border ${config.borderClass} ${config.cardBg} transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs relative group`}
              >
                {/* Top: Status Badge with Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${config.indicator}`} />
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${config.badgeClass}`}
                    >
                      {config.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-stone-500 dark:text-zinc-400">
                    <Users className="h-3.5 w-3.5" />
                    <span>{table.capacity} Kursi</span>
                  </div>
                </div>

                {/* Center: Prominent Table Number & Guest Info */}
                <div className="space-y-1 py-1">
                  <h3 className="text-2xl font-black tracking-tight text-stone-900 dark:text-zinc-100 font-mono">
                    MEJA {table.tableNumber}
                  </h3>

                  {table.activeGuestName ? (
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                      <span>👤 Tamu:</span>
                      <span className="font-bold truncate">{table.activeGuestName}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-stone-400 dark:text-zinc-500">
                      {table.status === 'VACANT' ? 'Siap digunakan' : 'Sesi tanpa nama tamu'}
                    </p>
                  )}
                </div>

                {/* Bottom: Action Buttons */}
                <div className="pt-3 border-t border-stone-200/60 dark:border-zinc-800/80 flex items-center justify-between gap-1.5">
                  {/* QR Code Sticker Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenQr(table)}
                    className="flex-1 text-xs h-8 rounded-xl font-semibold bg-white dark:bg-zinc-800 hover:text-amber-600"
                    title="Buka Stiker QR Meja"
                  >
                    <QrCode className="h-3.5 w-3.5 mr-1 text-amber-600" />
                    QR Stiker
                  </Button>

                  {/* 1-Tap Reset Session (Enabled when table is not VACANT) */}
                  {table.status !== 'VACANT' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetSession(table)}
                      disabled={resetMutation.isPending}
                      className="text-xs h-8 px-2.5 rounded-xl font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-blue-300"
                      title="Reset Sesi Meja ke Kosong"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1 text-blue-600" />
                      Reset
                    </Button>
                  )}

                  {/* Edit & Delete Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(table)}
                      className="h-8 w-8 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 hover:text-amber-600 hover:border-amber-500 transition-colors"
                      title="Edit Meja"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(table)}
                      disabled={deleteMutation.isPending}
                      className="h-8 w-8 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-400 hover:text-red-600 hover:border-red-500 transition-colors"
                      title="Hapus Meja"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal (Create / Edit Table) */}
      <TableFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        tableToEdit={tableToEdit}
      />

      {/* QR Code Sticker Modal */}
      <TableQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        table={tableForQr}
      />
    </div>
  );
}
