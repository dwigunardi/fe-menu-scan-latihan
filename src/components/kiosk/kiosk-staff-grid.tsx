'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  UserCheck,
  LogOut as LogOutIcon,
  LogIn as LogInIcon,
  BadgeCheck,
  Clock,
  Briefcase,
  IdCard,
} from 'lucide-react';
import { StaffItem } from '@/lib/validations/staff.schema';
import { AttendanceItem } from '@/lib/validations/attendance.schema';
import { ATTENDANCE_TYPE, AttendanceType } from '@/lib/constants/attendance';
import { ROLE } from '@/lib/constants/roles';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils/get-initials';
import { cn } from '@/lib/utils/cn';

interface KioskStaffGridProps {
  staffList: StaffItem[];
  activeAttendanceMap: Map<string, AttendanceItem>;
  mode: AttendanceType;
  onModeChange: (mode: AttendanceType) => void;
  onSelectStaff: (staff: StaffItem) => void;
  isLoading?: boolean;
}

const ROLE_FILTERS = [
  { id: 'ALL', label: 'Semua Staf' },
  { id: ROLE.CASHIER, label: 'Kasir' },
  { id: ROLE.KITCHEN, label: 'Dapur / Bar' },
  { id: ROLE.WAITER, label: 'Pelayan' },
  { id: ROLE.ADMIN, label: 'Manager / Admin' },
];

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  [ROLE.ADMIN]: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
  [ROLE.CASHIER]: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  [ROLE.KASIR]: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  [ROLE.KITCHEN]: {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  [ROLE.WAITER]: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  [ROLE.PELAYAN]: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
};

export function KioskStaffGrid({
  staffList,
  activeAttendanceMap,
  mode,
  onModeChange,
  onSelectStaff,
  isLoading = false,
}: KioskStaffGridProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Filter staff based on search (name/NIK) and role
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      // Must be active staff
      if (!staff.isActive) return false;

      // Role filter
      if (selectedRoleFilter !== 'ALL' && staff.role !== selectedRoleFilter) {
        return false;
      }

      // Search filter (name, employeeId, email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = staff.name.toLowerCase().includes(q);
        const matchNik = staff.employeeId?.toLowerCase().includes(q);
        const matchEmail = staff.email.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchEmail) {
          return false;
        }
      }

      return true;
    });
  }, [staffList, selectedRoleFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Top Toolbar: Mode Switcher & Search/Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-sm">
        {/* Mode Toggle: Masuk (Clock-In) vs Pulang (Clock-Out) */}
        <div className="flex items-center p-1.5 rounded-2xl bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60 shrink-0">
          <button
            type="button"
            onClick={() => onModeChange(ATTENDANCE_TYPE.CLOCK_IN)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer select-none',
              mode === ATTENDANCE_TYPE.CLOCK_IN
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-extrabold'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
            )}
            id="kiosk-mode-clockin"
          >
            <LogInIcon className="h-4 w-4" />
            <span>Presensi Masuk (Clock-In)</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange(ATTENDANCE_TYPE.CLOCK_OUT)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer select-none',
              mode === ATTENDANCE_TYPE.CLOCK_OUT
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-extrabold'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
            )}
            id="kiosk-mode-clockout"
          >
            <LogOutIcon className="h-4 w-4" />
            <span>Presensi Pulang (Clock-Out)</span>
          </button>
        </div>

        {/* Search by Name / NIK */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Cari nama staf atau NIK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border-stone-200 dark:border-zinc-700 text-sm focus-visible:ring-amber-500"
            id="kiosk-staff-search"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedRoleFilter(f.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border',
              selectedRoleFilter === f.id
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Staff Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-stone-100 dark:bg-zinc-800 animate-pulse border border-stone-200/60 dark:border-zinc-700/60"
            />
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Briefcase className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-base text-stone-800 dark:text-zinc-200">
            Tidak Ada Staf Ditemukan
          </h3>
          <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-sm">
            Tidak ada staf yang sesuai dengan filter role atau pencarian &quot;{searchQuery}&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
          {filteredStaff.map((staff) => {
            const roleStyle = ROLE_COLORS[staff.role] || {
              bg: 'bg-stone-50',
              text: 'text-stone-700',
              border: 'border-stone-200',
            };

            const attendance = activeAttendanceMap.get(staff.id);
            const isOnDuty = Boolean(attendance?.clockInTime && !attendance?.clockOutTime);
            const isCompletedToday = Boolean(attendance?.clockInTime && attendance?.clockOutTime);

            // In Clock-Out mode, emphasize staff currently on duty
            const isHighlightedInMode =
              mode === ATTENDANCE_TYPE.CLOCK_OUT ? isOnDuty : !isOnDuty && !isCompletedToday;

            return (
              <button
                key={staff.id}
                type="button"
                onClick={() => onSelectStaff(staff)}
                className={cn(
                  'group p-4 rounded-3xl bg-white dark:bg-zinc-900 border text-left transition-all relative flex flex-col justify-between cursor-pointer select-none',
                  'hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]',
                  isHighlightedInMode
                    ? 'border-amber-400/80 dark:border-amber-600/80 shadow-md shadow-amber-500/5 ring-2 ring-amber-500/10'
                    : 'border-stone-200/80 dark:border-zinc-800/80 opacity-80 hover:opacity-100'
                )}
                id={`kiosk-staff-card-${staff.id}`}
              >
                {/* Card Top: Avatar & Duty Status Indicator */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={cn(
                      'h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg border shadow-sm transition-transform group-hover:scale-105',
                      roleStyle.bg,
                      roleStyle.text,
                      roleStyle.border
                    )}
                  >
                    {getInitials(staff.name)}
                  </div>

                  {/* Duty Status Badge */}
                  {isOnDuty ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 shrink-0 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Bertugas
                    </span>
                  ) : isCompletedToday ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 shrink-0">
                      <BadgeCheck className="h-3 w-3" />
                      Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400 border border-stone-200 dark:border-zinc-700 shrink-0">
                      Belum Absen
                    </span>
                  )}
                </div>

                {/* Card Middle: Staff Name & Role */}
                <div className="min-w-0 mb-3">
                  <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-zinc-50 truncate tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {staff.name}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-zinc-400 truncate mt-0.5">
                    {staff.role}
                  </p>
                </div>

                {/* Card Bottom: NIK badge & Tap Instruction */}
                <div className="pt-2 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1 text-stone-400 dark:text-zinc-500 font-mono font-bold truncate">
                    <IdCard className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{staff.employeeId || 'NIK -'}</span>
                  </div>
                  <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 text-[10px]">
                    Tap & Absen →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
