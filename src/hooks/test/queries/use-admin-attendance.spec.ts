import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useAdminAttendancePaginatedQuery,
  useAdminAttendanceSummaryQuery,
  useClockInMutation,
  useClockOutMutation,
  useCreateLeaveRequestMutation,
} from '@/hooks/queries/use-admin-attendance';
import { createQueryWrapper } from '@/test/test-utils';
import * as attendanceApi from '@/lib/api/admin-attendance-api';
import { right, left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';
import { ATTENDANCE_STATUS, LEAVE_TYPE } from '@/lib/constants/attendance';
import { ROLE } from '@/lib/constants/roles';
import { toast } from 'sonner';

vi.mock('@/lib/api/admin-attendance-api', () => ({
  getAdminAttendancePaginated: vi.fn(),
  getAdminAttendanceSummary: vi.fn(),
  recordClockIn: vi.fn(),
  recordClockOut: vi.fn(),
  createLeaveRequest: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('use-admin-attendance query hooks', () => {
  const mockAttendanceItem = {
    id: 'att-1',
    branchId: 'branch-1',
    staffId: 'staff-1',
    staffName: 'Budi Barista',
    staffRole: ROLE.KITCHEN,
    date: '2026-01-01',
    clockInTime: '2026-01-01T08:00:00.000Z',
    clockOutTime: '2026-01-01T16:00:00.000Z',
    status: ATTENDANCE_STATUS.ON_TIME,
    clockInLat: -6.2297,
    clockInLon: 106.8557,
    clockInDistanceMeters: 12.5,
    isWithinGeofence: true,
    workDurationMinutes: 480,
    notes: 'Presensi normal',
    leaveType: null,
    leaveStatus: null,
    leaveReason: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAdminAttendancePaginatedQuery', () => {
    it('fetches paginated attendance data successfully', async () => {
      vi.mocked(attendanceApi.getAdminAttendancePaginated).mockResolvedValue(
        right({
          items: [mockAttendanceItem],
          meta: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminAttendancePaginatedQuery({ page: 1, limit: 10 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.items[0].staffName).toBe('Budi Barista');
    });

    it('handles query error when fetching fails', async () => {
      vi.mocked(attendanceApi.getAdminAttendancePaginated).mockResolvedValue(left(ApiError.networkError()));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminAttendancePaginatedQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAdminAttendanceSummaryQuery', () => {
    it('fetches attendance summary metrics', async () => {
      vi.mocked(attendanceApi.getAdminAttendanceSummary).mockResolvedValue(
        right({
          totalStaff: 10,
          presentCount: 8,
          onTimeCount: 7,
          lateCount: 1,
          earlyLeaveCount: 0,
          leaveCount: 1,
          absentCount: 1,
          attendanceRatePercent: 80,
        })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminAttendanceSummaryQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.totalStaff).toBe(10);
    });
  });

  describe('useClockInMutation', () => {
    it('submits clock-in mutation and triggers success toast', async () => {
      vi.mocked(attendanceApi.recordClockIn).mockResolvedValue(right(mockAttendanceItem));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useClockInMutation(), { wrapper });

      await result.current.mutateAsync({
        staffId: 'staff-1',
        pinCode: '1234',
        latitude: -6.2297,
        longitude: 106.8557,
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Presensi Masuk (Clock-In) berhasil')
      );
    });
  });

  describe('useClockOutMutation', () => {
    it('submits clock-out mutation and triggers success toast', async () => {
      vi.mocked(attendanceApi.recordClockOut).mockResolvedValue(right(mockAttendanceItem));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useClockOutMutation(), { wrapper });

      await result.current.mutateAsync({
        staffId: 'staff-1',
        pinCode: '1234',
        latitude: -6.2297,
        longitude: 106.8557,
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Presensi Pulang (Clock-Out) berhasil')
      );
    });
  });

  describe('useCreateLeaveRequestMutation', () => {
    it('submits leave request mutation and triggers success toast', async () => {
      vi.mocked(attendanceApi.createLeaveRequest).mockResolvedValue(
        right({ success: true, message: 'Izin dicatat' })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateLeaveRequestMutation(), { wrapper });

      await result.current.mutateAsync({
        staffId: 'staff-1',
        leaveType: LEAVE_TYPE.ANNUAL_LEAVE,
        startDate: '2026-01-05',
        endDate: '2026-01-06',
        reason: 'Cuti keluarga tahun baru',
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Pengajuan izin/sakit/cuti staf berhasil dicatat')
      );
    });
  });
});
