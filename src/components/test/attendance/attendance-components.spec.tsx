import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  AttendanceSummaryCards,
  AttendanceFilterBar,
  AttendanceTable,
  LeaveRequestModal,
  AttendanceView,
} from '@/components/attendance';
import { ATTENDANCE_STATUS, LEAVE_TYPE } from '@/lib/constants/attendance';
import { ROLE } from '@/lib/constants/roles';
import * as staffHooks from '@/hooks/queries/use-admin-staff';
import * as attendanceHooks from '@/hooks/queries/use-admin-attendance';
import * as settingsHooks from '@/hooks/queries/use-admin-settings';
import { createQueryWrapper } from '@/test/test-utils';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Attendance UI Components', () => {
  const mockItems = [
    {
      id: 'att-1',
      branchId: 'b-1',
      staffId: 's-1',
      staffName: 'Budi Barista',
      staffRole: ROLE.KITCHEN,
      date: '2026-01-01',
      clockInTime: '2026-01-01T08:05:00.000Z',
      clockOutTime: '2026-01-01T16:00:00.000Z',
      status: ATTENDANCE_STATUS.ON_TIME,
      clockInLat: -6.2297,
      clockInLon: 106.8557,
      clockInDistanceMeters: 14,
      isWithinGeofence: true,
      workDurationMinutes: 475,
      notes: 'Shift pagi',
    },
    {
      id: 'att-2',
      branchId: 'b-1',
      staffId: 's-2',
      staffName: 'Siti Kasir',
      staffRole: ROLE.CASHIER,
      date: '2026-01-01',
      clockInTime: null,
      clockOutTime: null,
      status: ATTENDANCE_STATUS.ABSENT,
      clockInLat: null,
      clockInLon: null,
      clockInDistanceMeters: null,
      isWithinGeofence: false,
      workDurationMinutes: 0,
      notes: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL object methods for CSV export
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('AttendanceSummaryCards', () => {
    it('renders KPI metrics properly', () => {
      render(
        <AttendanceSummaryCards
          summary={{
            totalStaff: 12,
            presentCount: 10,
            onTimeCount: 9,
            lateCount: 1,
            earlyLeaveCount: 0,
            leaveCount: 1,
            absentCount: 1,
            attendanceRatePercent: 83,
          }}
        />
      );

      expect(screen.getByText('Total Staf Hari Ini')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Hadir Tepat Waktu')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.getByText(/83% Tingkat Kehadiran/i)).toBeInTheDocument();
    });

    it('renders skeleton placeholders when loading', () => {
      const { container } = render(<AttendanceSummaryCards isLoading={true} />);
      expect(container.querySelectorAll('.animate-pulse').length).toBe(5);
    });
  });

  describe('AttendanceFilterBar', () => {
    it('handles search, role change, status change, and preset selection', () => {
      const onSearchChange = vi.fn();
      const onRoleChange = vi.fn();
      const onStatusChange = vi.fn();
      const onDatePresetChange = vi.fn();
      const onExportCSV = vi.fn();

      render(
        <AttendanceFilterBar
          search=""
          onSearchChange={onSearchChange}
          selectedRole="ALL"
          onRoleChange={onRoleChange}
          selectedStatus="ALL"
          onStatusChange={onStatusChange}
          datePreset="today"
          onDatePresetChange={onDatePresetChange}
          onExportCSV={onExportCSV}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Cari nama staf/i);
      fireEvent.change(searchInput, { target: { value: 'Budi' } });
      expect(onSearchChange).toHaveBeenCalledWith('Budi');

      const roleSelect = screen.getByRole('combobox');
      fireEvent.change(roleSelect, { target: { value: ROLE.KITCHEN } });
      expect(onRoleChange).toHaveBeenCalledWith(ROLE.KITCHEN);

      const lateFilter = screen.getByRole('button', { name: /Terlambat/i });
      fireEvent.click(lateFilter);
      expect(onStatusChange).toHaveBeenCalledWith(ATTENDANCE_STATUS.LATE);

      const todayPreset = screen.getByRole('button', { name: /Hari Ini/i });
      fireEvent.click(todayPreset);
      expect(onDatePresetChange).toHaveBeenCalledWith('today');

      const yesterdayPreset = screen.getByRole('button', { name: /Kemarin/i });
      fireEvent.click(yesterdayPreset);
      expect(onDatePresetChange).toHaveBeenCalledWith('yesterday');

      const monthPreset = screen.getByRole('button', { name: /Bulan Ini/i });
      fireEvent.click(monthPreset);
      expect(onDatePresetChange).toHaveBeenCalledWith('month');

      const exportBtn = screen.getByRole('button', { name: /Ekspor CSV/i });
      fireEvent.click(exportBtn);
      expect(onExportCSV).toHaveBeenCalled();
    });

    it('renders with yesterday and month presets active and toggles all status filters', () => {
      const onStatusChange = vi.fn();
      const { rerender } = render(
        <AttendanceFilterBar
          search=""
          onSearchChange={vi.fn()}
          selectedRole="ALL"
          onRoleChange={vi.fn()}
          selectedStatus={ATTENDANCE_STATUS.ON_TIME}
          onStatusChange={onStatusChange}
          datePreset="yesterday"
          onDatePresetChange={vi.fn()}
          onExportCSV={vi.fn()}
        />
      );

      // Status filters
      fireEvent.click(screen.getByRole('button', { name: /Semua/i }));
      expect(onStatusChange).toHaveBeenCalledWith('ALL');

      fireEvent.click(screen.getByRole('button', { name: /Tepat Waktu/i }));
      expect(onStatusChange).toHaveBeenCalledWith(ATTENDANCE_STATUS.ON_TIME);

      fireEvent.click(screen.getByRole('button', { name: /Izin \/ Cuti/i }));
      expect(onStatusChange).toHaveBeenCalledWith(ATTENDANCE_STATUS.LEAVE);

      fireEvent.click(screen.getByRole('button', { name: /Alpa/i }));
      expect(onStatusChange).toHaveBeenCalledWith(ATTENDANCE_STATUS.ABSENT);

      // Month preset active
      rerender(
        <AttendanceFilterBar
          search=""
          onSearchChange={vi.fn()}
          selectedRole="ALL"
          onRoleChange={vi.fn()}
          selectedStatus={ATTENDANCE_STATUS.ABSENT}
          onStatusChange={onStatusChange}
          datePreset="month"
          onDatePresetChange={vi.fn()}
          onExportCSV={vi.fn()}
        />
      );
    });
  });

  describe('AttendanceTable', () => {
    it('renders attendance rows with staff name, status, and geofence distance', () => {
      const onLimitChange = vi.fn();
      render(
        <AttendanceTable
          items={mockItems}
          totalItems={2}
          currentPage={1}
          totalPages={1}
          onPageChange={vi.fn()}
          onLimitChange={onLimitChange}
        />
      );

      expect(screen.getByText('Budi Barista')).toBeInTheDocument();
      expect(screen.getByText('Siti Kasir')).toBeInTheDocument();
      expect(screen.getByText('Tepat Waktu')).toBeInTheDocument();
      expect(screen.getByText('14m')).toBeInTheDocument();
      expect(screen.getByText('Shift pagi')).toBeInTheDocument();
    });

    it('renders loading skeleton when isLoading is true', () => {
      const { container } = render(
        <AttendanceTable
          items={[]}
          totalItems={0}
          currentPage={1}
          totalPages={1}
          isLoading={true}
          onPageChange={vi.fn()}
        />
      );

      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('renders empty state when no items exist', () => {
      render(
        <AttendanceTable
          items={[]}
          totalItems={0}
          currentPage={1}
          totalPages={1}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.getByText('Belum Ada Data Presensi')).toBeInTheDocument();
    });
  });

  describe('LeaveRequestModal', () => {
    it('submits leave request successfully and resets modal', async () => {
      const mockCreateLeave = vi.fn().mockResolvedValue({ success: true });
      vi.spyOn(attendanceHooks, 'useCreateLeaveRequestMutation').mockReturnValue({
        mutateAsync: mockCreateLeave,
        isPending: false,
      } as any);

      vi.spyOn(staffHooks, 'useAdminStaffPaginatedQuery').mockReturnValue({
        data: { items: [{ id: 's-1', name: 'Budi Barista', role: ROLE.KITCHEN, isActive: true }] },
        isLoading: false,
      } as any);

      const onClose = vi.fn();
      render(<LeaveRequestModal isOpen={true} onClose={onClose} />, { wrapper: createQueryWrapper() });

      expect(screen.getByText('Form Izin / Sakit / Cuti Staf')).toBeInTheDocument();

      const staffSelect = screen.getByLabelText(/Nama Karyawan/i);
      fireEvent.change(staffSelect, { target: { value: 's-1' } });

      const reasonInput = screen.getByPlaceholderText(/Contoh: Sakit demam berdarah/i);
      fireEvent.change(reasonInput, { target: { value: 'Izin mengurus dokumen kependudukan' } });

      const submitBtn = screen.getByRole('button', { name: /Simpan Izin Staf/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateLeave).toHaveBeenCalledWith(
          expect.objectContaining({
            staffId: 's-1',
            reason: 'Izin mengurus dokumen kependudukan',
          })
        );
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('AttendanceView Coordinator', () => {
    beforeEach(() => {
      vi.spyOn(settingsHooks, 'useAdminBranchSettingQuery').mockReturnValue({
        data: { id: 'b-1', name: 'Kumpul Cafe', latitude: -6.22, longitude: 106.85, geofenceRadius: 100 },
        isLoading: false,
      } as any);

      vi.spyOn(staffHooks, 'useAdminStaffPaginatedQuery').mockReturnValue({
        data: { items: [{ id: 's-1', name: 'Budi Barista', role: ROLE.KITCHEN, isActive: true }] },
        isLoading: false,
      } as any);

      vi.spyOn(attendanceHooks, 'useAdminAttendancePaginatedQuery').mockReturnValue({
        data: {
          items: mockItems,
          meta: { page: 1, limit: 10, totalItems: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
        },
        isLoading: false,
      } as any);

      vi.spyOn(attendanceHooks, 'useAdminAttendanceSummaryQuery').mockReturnValue({
        data: {
          totalStaff: 5,
          presentCount: 4,
          onTimeCount: 3,
          lateCount: 1,
          earlyLeaveCount: 0,
          leaveCount: 1,
          absentCount: 0,
          attendanceRatePercent: 80,
        },
        isLoading: false,
      } as any);
    });

    it('renders master view with header, cards, filters, and table', () => {
      render(<AttendanceView />, { wrapper: createQueryWrapper() });

      expect(screen.getByText('Presensi & Absensi Karyawan')).toBeInTheDocument();
      expect(screen.getByText('Total Staf Hari Ini')).toBeInTheDocument();
      expect(screen.getByText('Budi Barista')).toBeInTheDocument();
    });

    it('exports attendance data to CSV and shows success toast', () => {
      render(<AttendanceView />, { wrapper: createQueryWrapper() });

      const exportBtn = screen.getByRole('button', { name: /Ekspor CSV/i });
      fireEvent.click(exportBtn);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Rekapitulasi presensi berhasil diekspor ke CSV')
      );
    });

    it('shows error toast on CSV export if attendance data is empty', () => {
      vi.spyOn(attendanceHooks, 'useAdminAttendancePaginatedQuery').mockReturnValue({
        data: {
          items: [],
          meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
        },
        isLoading: false,
      } as any);

      render(<AttendanceView />, { wrapper: createQueryWrapper() });

      const exportBtn = screen.getByRole('button', { name: /Ekspor CSV/i });
      fireEvent.click(exportBtn);

      expect(toast.error).toHaveBeenCalledWith('Tidak ada data presensi untuk diekspor');
    });

    it('opens and closes ClockInModal and LeaveRequestModal from header actions', () => {
      render(<AttendanceView />, { wrapper: createQueryWrapper() });

      const clockInBtn = screen.getByRole('button', { name: /Presensi Staf \(Clock-In\)/i });
      fireEvent.click(clockInBtn);
      expect(screen.getByText('Terminal Presensi Staf Kafe')).toBeInTheDocument();

      const cancelClockInBtn = screen.getByRole('button', { name: 'Batal' });
      fireEvent.click(cancelClockInBtn);

      const leaveBtn = screen.getByRole('button', { name: /Catat Izin \/ Cuti/i });
      fireEvent.click(leaveBtn);
      expect(screen.getByText('Form Izin / Sakit / Cuti Staf')).toBeInTheDocument();

      const cancelLeaveBtn = screen.getByRole('button', { name: 'Batal' });
      fireEvent.click(cancelLeaveBtn);
    });
  });
});
