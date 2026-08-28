'use client';

import { Search, Download, Calendar, Filter, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AttendanceStatus, ATTENDANCE_STATUS } from '@/lib/constants/attendance';
import { StaffRole } from '@/lib/validations/staff.schema';
import { ROLE } from '@/lib/constants/roles';
import { cn } from '@/lib/utils/cn';

interface AttendanceFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedStatus: AttendanceStatus | 'ALL';
  onStatusChange: (status: AttendanceStatus | 'ALL') => void;
  selectedRole: StaffRole | 'ALL';
  onRoleChange: (role: StaffRole | 'ALL') => void;
  datePreset: 'today' | 'yesterday' | 'month' | 'custom';
  onDatePresetChange: (preset: 'today' | 'yesterday' | 'month' | 'custom') => void;
  onExportCSV: () => void;
  isExporting?: boolean;
}

export function AttendanceFilterBar({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedRole,
  onRoleChange,
  datePreset,
  onDatePresetChange,
  onExportCSV,
  isExporting = false,
}: AttendanceFilterBarProps) {
  const statusOptions: { key: AttendanceStatus | 'ALL'; label: string }[] = [
    { key: 'ALL', label: 'Semua Status' },
    { key: ATTENDANCE_STATUS.ON_TIME, label: 'Tepat Waktu' },
    { key: ATTENDANCE_STATUS.LATE, label: 'Terlambat' },
    { key: ATTENDANCE_STATUS.SICK, label: 'Sakit' },
    { key: ATTENDANCE_STATUS.LEAVE, label: 'Izin / Cuti' },
    { key: ATTENDANCE_STATUS.ABSENT, label: 'Alpa' },
  ];

  return (
    <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input & Role Filter */}
        <div className="flex flex-1 items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama staf atau posisi..."
              className="pl-10 h-10 text-xs rounded-xl"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value as any)}
            className="h-10 px-3 text-xs font-semibold rounded-xl border border-stone-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">Semua Peran (Role)</option>
            <option value={ROLE.CASHIER}>Kasir</option>
            <option value={ROLE.KITCHEN}>Kitchen / Barista</option>
            <option value={ROLE.WAITER}>Pelayan (Waiter)</option>
            <option value={ROLE.ADMIN}>Manager / Admin</option>
          </select>
        </div>

        {/* Date Presets & CSV Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => onDatePresetChange('today')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer',
                datePreset === 'today'
                  ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
              )}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => onDatePresetChange('yesterday')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer',
                datePreset === 'yesterday'
                  ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
              )}
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => onDatePresetChange('month')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer',
                datePreset === 'month'
                  ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
              )}
            >
              Bulan Ini
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            disabled={isExporting}
            className="rounded-xl h-10 px-3.5 text-xs font-bold gap-1.5 border-stone-200 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-stone-800 dark:text-zinc-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Ekspor CSV</span>
          </Button>
        </div>
      </div>

      {/* Status Filter Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-stone-400 text-[11px] font-bold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Status:
        </span>
        {statusOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onStatusChange(opt.key)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
              selectedStatus === opt.key
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200/80 dark:hover:bg-zinc-700'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
