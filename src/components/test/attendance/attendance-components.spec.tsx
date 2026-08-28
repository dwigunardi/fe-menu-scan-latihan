import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  AttendanceSummaryCards,
  AttendanceFilterBar,
  AttendanceTable,
  LeaveRequestModal,
} from '@/components/attendance';
import { ATTENDANCE_STATUS, LEAVE_TYPE } from '@/lib/constants/attendance';
import { ROLE } from '@/lib/constants/roles';
import * as staffHooks from '@/hooks/queries/use-admin-staff';
import * as attendanceHooks from '@/hooks/queries/use-admin-attendance';

describe('Attendance UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      const lateFilter = screen.getByRole('button', { name: /Terlambat/i });
      fireEvent.click(lateFilter);
      expect(onStatusChange).toHaveBeenCalledWith(ATTENDANCE_STATUS.LATE);

      const yesterdayPreset = screen.getByRole('button', { name: /Kemarin/i });
      fireEvent.click(yesterdayPreset);
      expect(onDatePresetChange).toHaveBeenCalledWith('yesterday');

      const exportBtn = screen.getByRole('button', { name: /Ekspor CSV/i });
      fireEvent.click(exportBtn);
      expect(onExportCSV).toHaveBeenCalled();
    });
  });

  describe('AttendanceTable', () => {
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
    ];

    it('renders attendance rows with staff name, status, and geofence distance', () => {
      render(
        <AttendanceTable
          items={mockItems}
          totalItems={1}
          currentPage={1}
          totalPages={1}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.getByText('Budi Barista')).toBeInTheDocument();
      expect(screen.getByText('Tepat Waktu')).toBeInTheDocument();
      expect(screen.getByText('14m')).toBeInTheDocument();
      expect(screen.getByText('Shift pagi')).toBeInTheDocument();
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
      render(<LeaveRequestModal isOpen={true} onClose={onClose} />);

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
});
