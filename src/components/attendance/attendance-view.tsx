'use client';

import { useState } from 'react';
import {
  CalendarCheck,
  ShieldCheck,
  Plus,
  CalendarOff,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttendanceSummaryCards } from './attendance-summary-cards';
import { AttendanceFilterBar } from './attendance-filter-bar';
import { AttendanceTable } from './attendance-table';
import { ClockInModal } from './clock-in-modal';
import { LeaveRequestModal } from './leave-request-modal';
import {
  useAdminAttendancePaginatedQuery,
  useAdminAttendanceSummaryQuery,
} from '@/hooks/queries/use-admin-attendance';
import { AttendanceStatus } from '@/lib/constants/attendance';
import { StaffRole } from '@/lib/validations/staff.schema';
import { toast } from 'sonner';

export function AttendanceView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | 'ALL'>('ALL');
  const [selectedRole, setSelectedRole] = useState<StaffRole | 'ALL'>('ALL');
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'month' | 'custom'>('today');

  // Modals state
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Queries
  const { data: attendanceData, isLoading: isListLoading } = useAdminAttendancePaginatedQuery({
    page,
    limit: 10,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    role: selectedRole === 'ALL' ? undefined : selectedRole,
    search: search.trim() || undefined,
  });

  const { data: summaryData, isLoading: isSummaryLoading } = useAdminAttendanceSummaryQuery();

  const handleExportCSV = () => {
    try {
      const items = attendanceData?.items || [];
      if (items.length === 0) {
        toast.error('Tidak ada data presensi untuk diekspor');
        return;
      }

      const rows: string[][] = [
        ['LAPORAN REKAPITULASI PRESENSI & ABSENSI STAF KUMPUL CAFE'],
        ['Waktu Ekspor:', new Date().toLocaleString('id-ID')],
        [''],
        ['ID', 'Nama Karyawan', 'Peran', 'Tanggal', 'Clock-In', 'Clock-Out', 'Durasi (Mnt)', 'Status', 'Jarak GPS (m)', 'Catatan'],
      ];

      items.forEach((item) => {
        rows.push([
          item.id,
          `"${item.staffName.replace(/"/g, '""')}"`,
          item.staffRole,
          item.date,
          item.clockInTime || '-',
          item.clockOutTime || '-',
          String(item.workDurationMinutes || 0),
          item.status,
          String(item.clockInDistanceMeters || 0),
          `"${(item.notes || item.leaveReason || '-').replace(/"/g, '""')}"`,
        ]);
      });

      const csvContent = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `Rekap_Presensi_KumpulCafe_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Rekapitulasi presensi berhasil diekspor ke CSV!');
    } catch {
      toast.error('Gagal mengekspor laporan presensi');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header with Title and Action Modals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sistem Presensi Geofence
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-amber-600" />
            <span>Presensi & Absensi Karyawan</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400">
            Monitoring kehadiran real-time, validasi geolokasi 100m, dan rekapitulasi jam kerja staf.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsLeaveModalOpen(true)}
            className="rounded-2xl text-xs font-bold h-11 px-4 gap-2 border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <CalendarOff className="w-4 h-4 text-indigo-600" />
            <span>Catat Izin / Cuti</span>
          </Button>

          <Button
            type="button"
            onClick={() => setIsClockInModalOpen(true)}
            className="rounded-2xl text-xs font-bold h-11 px-5 gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Presensi Staf (Clock-In)</span>
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <AttendanceSummaryCards
        summary={summaryData}
        isLoading={isSummaryLoading}
      />

      {/* Filter and Search Bar */}
      <AttendanceFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        onExportCSV={handleExportCSV}
      />

      {/* Main Attendance Table */}
      <AttendanceTable
        items={attendanceData?.items || []}
        isLoading={isListLoading}
        totalItems={attendanceData?.meta.totalItems || 0}
        currentPage={attendanceData?.meta.page || 1}
        totalPages={attendanceData?.meta.totalPages || 1}
        limit={attendanceData?.meta.limit || 10}
        hasNextPage={attendanceData?.meta.hasNextPage || false}
        hasPrevPage={attendanceData?.meta.hasPrevPage || false}
        onPageChange={setPage}
      />

      {/* Modals */}
      <ClockInModal
        isOpen={isClockInModalOpen}
        onClose={() => setIsClockInModalOpen(false)}
      />

      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />
    </div>
  );
}
