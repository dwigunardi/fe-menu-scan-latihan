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
  Armchair,
  MapPin,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
  useAdminTablesPaginatedQuery,
  useAdminTableZonesQuery,
  useResetTableMutation,
  useDeleteTableMutation,
} from '@/hooks/queries/use-admin-tables';
import { TableData, TableStatus, TableZoneData } from '@/lib/validations/table.schema';
import { TableFormModal } from '@/components/admin/table-form-modal';
import { TableQrModal } from '@/components/admin/table-qr-modal';
import { TableResetModal } from '@/components/admin/table-reset-modal';
import { TableDeleteModal } from '@/components/admin/table-delete-modal';
import { ZoneManagerModal } from '@/components/admin/zone-manager-modal';

const SEATING_ICONS: Record<string, string> = {
  DINING: '🍽️',
  SOFA: '🛋️',
  BAR: '🍸',
  BOOTH: '🪑',
  FAMILY: '👨‍👩‍👧‍👦',
};

const TAG_LABELS: Record<string, { label: string; icon: string }> = {
  OUTLET: { label: 'Colokan', icon: '🔌' },
  WINDOW_VIEW: { label: 'Jendela', icon: '🪟' },
  SMOKING: { label: 'Smoking', icon: '🚬' },
  AC: { label: 'AC', icon: '❄️' },
  WHEELCHAIR: { label: 'Kursi Roda', icon: '♿' },
  LIVE_MUSIC: { label: 'Panggung', icon: '🎤' },
};

export default function AdminTablesPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Accordion state: Record of zoneId -> boolean (true if collapsed)
  const [collapsedZones, setCollapsedZones] = useState<Record<string, boolean>>({});

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [tableToEdit, setTableToEdit] = useState<TableData | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [tableForQr, setTableForQr] = useState<TableData | null>(null);
  const [tableToReset, setTableToReset] = useState<TableData | null>(null);
  const [tableToDelete, setTableToDelete] = useState<TableData | null>(null);
  const [isZoneManagerOpen, setIsZoneManagerOpen] = useState<boolean>(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Query all tables
  const { data: paginatedData, isLoading } = useAdminTablesPaginatedQuery({
    limit: -1,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    zoneId: selectedZoneFilter === 'ALL' ? undefined : selectedZoneFilter,
    search: debouncedSearch || undefined,
    sortBy: 'number',
    sortOrder: 'asc',
  });

  const { data: zones = [] } = useAdminTableZonesQuery();
  const resetMutation = useResetTableMutation();
  const deleteMutation = useDeleteTableMutation();

  const tables = paginatedData?.items || [];

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalTables = tables.length;
    const vacantCount = tables.filter((t) => t.status === 'VACANT').length;
    const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
    const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 0), 0);

    return { totalTables, vacantCount, occupiedCount, totalCapacity };
  }, [tables]);

  // Group Tables by Zone
  const groupedTables = useMemo(() => {
    const map = new Map<string, { zone: TableZoneData | null; tables: TableData[] }>();

    // Initial zones
    zones.forEach((z) => {
      map.set(z.id, { zone: z, tables: [] });
    });

    const unzonedTables: TableData[] = [];

    tables.forEach((table) => {
      if (table.zoneId && map.has(table.zoneId)) {
        map.get(table.zoneId)!.tables.push(table);
      } else {
        unzonedTables.push(table);
      }
    });

    const result = Array.from(map.values()).filter(
      (item) => selectedZoneFilter === 'ALL' || item.zone?.id === selectedZoneFilter
    );

    if (unzonedTables.length > 0 && (selectedZoneFilter === 'ALL' || selectedZoneFilter === 'NONE')) {
      result.push({
        zone: null,
        tables: unzonedTables,
      });
    }

    return result;
  }, [tables, zones, selectedZoneFilter]);

  // Toggle Zone Accordion
  const toggleZoneCollapse = (zoneKey: string) => {
    setCollapsedZones((prev) => ({
      ...prev,
      [zoneKey]: !prev[zoneKey],
    }));
  };

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

  const handleResetSession = (table: TableData) => {
    setTableToReset(table);
  };

  const handleConfirmReset = async (table: TableData) => {
    await resetMutation.mutateAsync({
      id: table.id,
      tableNumber: table.tableNumber,
    });
  };

  const handleDelete = (table: TableData) => {
    setTableToDelete(table);
  };

  const handleConfirmDelete = async (table: TableData) => {
    await deleteMutation.mutateAsync({
      id: table.id,
      tableNumber: table.tableNumber,
    });
  };

  // Status Styling Configuration with Elevation, Contrast, and Ambient Glow
  const getStatusConfig = (status: TableStatus) => {
    switch (status) {
      case 'OCCUPIED':
        return {
          label: 'Terisi',
          badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
          borderClass: 'border-blue-500/40 dark:border-blue-500/40 hover:border-blue-500',
          cardBg: 'bg-white dark:bg-zinc-900/95',
          indicator: 'bg-blue-500 shadow-xs shadow-blue-500/50 animate-pulse',
          accentLine: 'from-blue-500/80 via-blue-400/40 to-transparent',
        };
      case 'WAITING_PAYMENT':
        return {
          label: 'Menunggu Bayar',
          badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
          borderClass: 'border-amber-500/40 dark:border-amber-500/40 hover:border-amber-500',
          cardBg: 'bg-white dark:bg-zinc-900/95',
          indicator: 'bg-amber-500 shadow-xs shadow-amber-500/50',
          accentLine: 'from-amber-500/80 via-amber-400/40 to-transparent',
        };
      case 'WAITING_CLEANUP':
        return {
          label: 'Perlu Bersih',
          badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
          borderClass: 'border-purple-500/40 dark:border-purple-500/40 hover:border-purple-500',
          cardBg: 'bg-white dark:bg-zinc-900/95',
          indicator: 'bg-purple-500 shadow-xs shadow-purple-500/50',
          accentLine: 'from-purple-500/80 via-purple-400/40 to-transparent',
        };
      case 'VACANT':
      default:
        return {
          label: 'Kosong',
          badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
          borderClass: 'border-stone-200/90 dark:border-zinc-800/90 hover:border-emerald-500/60 dark:hover:border-emerald-500/50',
          cardBg: 'bg-white dark:bg-zinc-900/95',
          indicator: 'bg-emerald-500 shadow-xs shadow-emerald-500/50',
          accentLine: 'from-emerald-500/80 via-emerald-400/40 to-transparent',
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* 1. PAGE HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50 flex items-center gap-2">
            <Armchair className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
            Denah Meja & Sesi Kasir
          </h1>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Visual floor plan real-time, stiker QR fisik permanen, dan 1-tap reset sesi meja.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsZoneManagerOpen(true)}
            className="text-xs font-semibold rounded-xl border-stone-300 dark:border-zinc-700 cursor-pointer h-9"
          >
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
            Kelola Zona
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer h-9"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Tambah Meja
          </Button>
        </div>
      </div>

      {/* 2. ADAPTIVE SUMMARY METRICS */}
      {/* 2A. Mobile 1-Row Compact Pill Bar (< sm) */}
      <div className="sm:hidden flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs text-xs font-semibold">
        <div className="flex items-center gap-1">
          <span className="font-bold text-stone-900 dark:text-zinc-100">{metrics.totalTables}</span>
          <span className="text-stone-400 text-[11px]">Meja</span>
        </div>
        <span className="text-stone-300 dark:text-zinc-700">•</span>
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <span>🟢</span>
          <span className="font-bold">{metrics.vacantCount}</span>
          <span className="text-[11px]">Kosong</span>
        </div>
        <span className="text-stone-300 dark:text-zinc-700">•</span>
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <span>🔵</span>
          <span className="font-bold">{metrics.occupiedCount}</span>
          <span className="text-[11px]">Terisi</span>
        </div>
        <span className="text-stone-300 dark:text-zinc-700">•</span>
        <div className="flex items-center gap-1 text-stone-600 dark:text-zinc-400">
          <Users className="h-3 w-3 text-stone-400" />
          <span className="font-bold">{metrics.totalCapacity}</span>
          <span className="text-[11px]">Kursi</span>
        </div>
      </div>

      {/* 2B. Desktop 4-Cards Grid (>= sm) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Total Meja</span>
          <div className="text-2xl font-black text-stone-900 dark:text-zinc-100 mt-1">
            {metrics.totalTables} <span className="text-xs font-normal text-stone-400">Unit</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Meja Kosong
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.vacantCount} <span className="text-xs font-normal text-stone-400">Unit</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Meja Terisi
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {metrics.occupiedCount} <span className="text-xs font-normal text-stone-400">Aktif</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Total Kursi
          </span>
          <div className="text-2xl font-black text-stone-900 dark:text-zinc-100 mt-1">
            {metrics.totalCapacity} <span className="text-xs font-normal text-stone-400">Kursi</span>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTER BAR (PWA-Optimized, No-Scrollbar) */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 sm:items-center justify-between">
          {/* Search Box with Clear Button */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nomor meja atau nama tamu..."
              className="pl-9 pr-8 h-9 text-xs rounded-xl bg-stone-50 dark:bg-zinc-800/60 border-stone-200 dark:border-zinc-700"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter Chips (Touch-friendly, hidden browser scrollbars) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { id: 'ALL', label: 'Semua Status' },
              { id: 'VACANT', label: 'Kosong', dot: '🟢' },
              { id: 'OCCUPIED', label: 'Terisi', dot: '🔵' },
              { id: 'WAITING_PAYMENT', label: 'Menunggu Bayar', dot: '🟡' },
              { id: 'WAITING_CLEANUP', label: 'Perlu Bersih', dot: '🟣' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${selectedStatus === tab.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                  }`}
              >
                {tab.dot && <span>{tab.dot}</span>}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. VISUAL FLOOR PLAN BY ZONE ACCORDION SECTIONS */}
      {isLoading ? (
        <div className="space-y-4 sm:space-y-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl" />
                ))}
              </div>
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
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {groupedTables.map(({ zone, tables: zoneTables }) => {
            const zoneKey = zone?.id || 'unzoned';
            const zoneTitle = zone ? zone.name : 'Area Umum (Tanpa Zona)';
            const zoneVacant = zoneTables.filter((t) => t.status === 'VACANT').length;
            const zoneOccupied = zoneTables.filter((t) => t.status === 'OCCUPIED').length;
            const isCollapsed = Boolean(collapsedZones[zoneKey]);

            return (
              <div
                key={zoneKey}
                className="rounded-3xl bg-white dark:bg-zinc-950/60 border border-stone-200/90 dark:border-zinc-800/80 shadow-xs overflow-hidden transition-all duration-200"
              >
                <div
                  onClick={() => toggleZoneCollapse(zoneKey)}
                  className="p-3.5 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none bg-white dark:bg-zinc-800/60 hover:bg-stone-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {/* Left Side: Icon + Title & Badges on Mobile/Tablet (< lg), Title & Description on Desktop (>= lg) */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {/* Zone Pin Icon Box */}
                    <div className="h-10 w-10 sm:h-9 sm:w-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
                    </div>

                    {/* Zone Title & Content */}
                    <div className="min-w-0 space-y-1 sm:space-y-0.5 flex-1">
                      <h2 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-zinc-100 truncate">
                        {zoneTitle}
                      </h2>

                      {/* Mobile & Tablet Badges (< lg) - Directly under Title, aligned next to Icon */}
                      <div className="flex lg:hidden items-center gap-1.5 text-[10.5px] sm:text-xs font-semibold text-stone-500 dark:text-zinc-400 flex-wrap pt-0.5">
                        <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300">
                          <strong className="font-bold">{zoneTables.length}</strong> Meja
                        </span>

                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                          <span>🟢 </span>
                          <strong className="font-bold">{zoneVacant}</strong> Kosong
                        </span>

                        {zoneOccupied > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                            <span>🔵 </span>
                            <strong className="font-bold">{zoneOccupied}</strong> Terisi
                          </span>
                        )}
                      </div>

                      {/* Desktop Description (>= lg) */}
                      {zone?.description && (
                        <p className="text-[11px] sm:text-xs text-stone-400 dark:text-zinc-500 truncate hidden lg:block">
                          {zone.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Desktop Badges (>= lg) + Chevron */}
                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {/* Desktop Badges (Hidden on Mobile & Tablet, shown on Desktop >= lg) */}
                    <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-zinc-400">
                      <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300">
                        <strong className="font-bold">{zoneTables.length}</strong> Meja
                      </span>

                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                        <span>🟢 </span>
                        <strong className="font-bold">{zoneVacant}</strong> Kosong
                      </span>

                      {zoneOccupied > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                          <span>🔵 </span>
                          <strong className="font-bold">{zoneOccupied}</strong> Terisi
                        </span>
                      )}
                    </div>

                    {/* Chevron Indicator */}
                    <div className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Zone Content (2-Columns on Mobile, 3-4 Columns on Desktop) */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 pt-0 sm:pt-0 border-t border-stone-100 dark:border-zinc-800/80">
                    {zoneTables.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-400 border border-dashed rounded-2xl my-2">
                        Belum ada meja di zona ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5 lg:gap-4 pt-3">
                        {zoneTables.map((table) => {
                          const config = getStatusConfig(table.status);
                          const displayNum = table.tableNumber.trim().toUpperCase().startsWith('MEJA')
                            ? table.tableNumber.trim().toUpperCase()
                            : `MEJA ${table.tableNumber.trim()}`;
                          const seatingIcon = SEATING_ICONS[table.seatingType] || '🍽️';

                          return (
                            <div
                              key={table.id}
                              className={`p-3.5 sm:p-4 rounded-2xl border ${config.borderClass} ${config.cardBg} transition-all duration-200 flex flex-col justify-between space-y-3 shadow-md dark:shadow-black/40 hover:shadow-lg dark:hover:shadow-black/60 hover:-translate-y-0.5 relative group overflow-hidden`}
                            >
                              {/* Top Subtle Ambient Accent Line */}
                              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${config.accentLine}`} />

                              {/* Top: Status Dot & Capacity */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`h-2 w-2 rounded-full shrink-0 ${config.indicator}`} />
                                  <span className={`text-[10px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-full border truncate ${config.badgeClass}`}>
                                    {config.label}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-stone-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md bg-stone-100/60 dark:bg-zinc-800/60 shrink-0">
                                  <Users className="h-3 w-3 text-stone-400" />
                                  <span>{table.capacity}</span>
                                </div>
                              </div>

                              {/* Center: Table Number & Seating Type */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-1">
                                  <h3 className="text-base sm:text-xl font-black tracking-tight text-stone-900 dark:text-zinc-50 font-mono truncate">
                                    {displayNum}
                                  </h3>
                                  <SimpleTooltip content={table.seatingType} side="top">
                                    <span
                                      className="text-[10px] sm:text-xs px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-zinc-800/90 border border-stone-200/60 dark:border-zinc-700/50 text-stone-700 dark:text-zinc-300 font-semibold shrink-0 cursor-default"
                                    >
                                      {seatingIcon} <span className="hidden sm:inline">{table.seatingType}</span>
                                    </span>
                                  </SimpleTooltip>
                                </div>

                                {/* Active Guest or Subtitle */}
                                {table.activeGuestName ? (
                                  <p className="text-[11px] sm:text-xs font-bold text-blue-700 dark:text-blue-400 truncate flex items-center gap-1">
                                    <span>👤</span>
                                    <span className="truncate">{table.activeGuestName}</span>
                                  </p>
                                ) : (
                                  <p className="text-[10px] sm:text-[11px] text-stone-400 dark:text-zinc-500 truncate">
                                    {table.status === 'VACANT' ? 'Siap digunakan' : 'Sesi aktif'}
                                  </p>
                                )}

                                {/* Facility Tags (Solid Dark Contrast Chips) */}
                                {table.tags && table.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {table.tags.slice(0, 2).map((tagId) => {
                                      const tagInfo = TAG_LABELS[tagId] || { label: tagId, icon: '🏷️' };
                                      return (
                                        <span
                                          key={tagId}
                                          className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-950/70 border border-stone-200/80 dark:border-zinc-800 text-stone-600 dark:text-zinc-300"
                                        >
                                          <span>{tagInfo.icon}</span>
                                          <span className="truncate">{tagInfo.label}</span>
                                        </span>
                                      );
                                    })}
                                    {table.tags.length > 2 && (
                                      <span className="text-[9px] font-semibold text-stone-400 px-1 py-0.5">
                                        +{table.tags.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Bottom: Action Buttons with Contrast & Clear Visuals */}
                              <div className="pt-2.5 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between gap-1.5">
                                {/* QR Sticker Button */}
                                <SimpleTooltip content="Stiker QR Meja" side="top">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenQr(table)}
                                    className="flex-1 text-[11px] sm:text-xs h-7.5 sm:h-8 px-2 rounded-xl font-semibold bg-stone-50 dark:bg-zinc-800/90 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 dark:hover:text-white border-stone-200 dark:border-zinc-700/60 text-stone-700 dark:text-zinc-200 shadow-2xs transition-all cursor-pointer"
                                  >
                                    <QrCode className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-amber-600 dark:text-amber-400 group-hover/btn:text-white shrink-0" />
                                    <span>QR</span>
                                  </Button>
                                </SimpleTooltip>

                                {/* Reset Session */}
                                {table.status !== 'VACANT' && (
                                  <SimpleTooltip content="Reset Sesi Meja" side="top">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleResetSession(table)}
                                      disabled={resetMutation.isPending}
                                      className="text-[11px] sm:text-xs h-7.5 sm:h-8 px-2 rounded-xl font-semibold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/60 shadow-2xs transition-all cursor-pointer"
                                    >
                                      <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-blue-600 dark:text-blue-400 shrink-0" />
                                      <span>Reset</span>
                                    </Button>
                                  </SimpleTooltip>
                                )}

                                {/* Edit & Delete Icons */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <SimpleTooltip content="Edit Meja" side="top">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(table)}
                                      className="h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-xl border border-stone-200 dark:border-zinc-700/60 bg-stone-50 dark:bg-zinc-800/70 flex items-center justify-center text-stone-400 hover:text-amber-600 hover:border-amber-500/80 transition-all cursor-pointer shadow-2xs"
                                    >
                                      <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    </button>
                                  </SimpleTooltip>
                                  <SimpleTooltip content="Hapus Meja" side="top">
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(table)}
                                      disabled={deleteMutation.isPending}
                                      className="h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-xl border border-stone-200 dark:border-zinc-700/60 bg-stone-50 dark:bg-zinc-800/70 flex items-center justify-center text-stone-400 hover:text-red-600 hover:border-red-500/80 transition-all cursor-pointer shadow-2xs"
                                    >
                                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    </button>
                                  </SimpleTooltip>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
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
        onOpenZoneManager={() => {
          setIsFormModalOpen(false);
          setIsZoneManagerOpen(true);
        }}
      />

      {/* QR Code Sticker Modal */}
      <TableQrModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setTableForQr(null);
        }}
        table={tableForQr}
      />

      {/* Modal Konfirmasi Reset Sesi Meja */}
      <TableResetModal
        isOpen={Boolean(tableToReset)}
        onClose={() => setTableToReset(null)}
        table={tableToReset}
        onConfirm={handleConfirmReset}
        isPending={resetMutation.isPending}
      />

      {/* Modal Konfirmasi Hapus Meja */}
      <TableDeleteModal
        isOpen={Boolean(tableToDelete)}
        onClose={() => setTableToDelete(null)}
        table={tableToDelete}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />

      {/* Modal Kelola Zona Kafe */}
      <ZoneManagerModal
        isOpen={isZoneManagerOpen}
        onClose={() => setIsZoneManagerOpen(false)}
      />
    </div>
  );
}
