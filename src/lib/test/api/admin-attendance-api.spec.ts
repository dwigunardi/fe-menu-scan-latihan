import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminAttendancePaginated,
  getAdminAttendanceSummary,
  recordClockIn,
  recordClockOut,
  createLeaveRequest,
} from '@/lib/api/admin-attendance-api';
import * as hardenedFetchModule from '@/lib/api/hardened-fetch';
import { right, left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';
import { ATTENDANCE_STATUS, LEAVE_TYPE } from '@/lib/constants/attendance';
import { ROLE } from '@/lib/constants/roles';

vi.mock('@/lib/api/hardened-fetch', () => ({
  hardenedFetch: vi.fn(),
}));

describe('admin-attendance-api', () => {
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

  describe('getAdminAttendancePaginated', () => {
    it('fetches paginated attendance log successfully with all filter parameters', async () => {
      const mockResponse = {
        items: [mockAttendanceItem],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      vi.mocked(hardenedFetchModule.hardenedFetch).mockResolvedValue(right(mockResponse));

      const result = await getAdminAttendancePaginated({
        page: 1,
        limit: 10,
        startDate: '2026-01-01',
        endDate: '2026-01-07',
        status: ATTENDANCE_STATUS.ON_TIME,
        role: ROLE.KITCHEN,
        search: 'Budi',
      });

      expect(result.isRight()).toBe(true);
      expect(hardenedFetchModule.hardenedFetch).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2026-01-01&endDate=2026-01-07&status=ON_TIME&role=KITCHEN&search=Budi'),
        expect.anything(),
        expect.anything()
      );
      if (result.isRight()) {
        expect(result.value.items[0].staffName).toBe('Budi Barista');
        expect(result.value.items[0].isWithinGeofence).toBe(true);
      }
    });

    it('returns ApiError on network failure', async () => {
      vi.mocked(hardenedFetchModule.hardenedFetch).mockResolvedValue(left(ApiError.networkError()));

      const result = await getAdminAttendancePaginated();
      expect(result.isLeft()).toBe(true);
    });
  });

  describe('getAdminAttendanceSummary', () => {
    it('fetches attendance KPI summary with and without date parameter', async () => {
      const mockSummary = {
        totalStaff: 10,
        presentCount: 8,
        onTimeCount: 7,
        lateCount: 1,
        earlyLeaveCount: 0,
        leaveCount: 1,
        absentCount: 1,
        attendanceRatePercent: 80,
      };

      vi.mocked(hardenedFetchModule.hardenedFetch).mockResolvedValue(right(mockSummary));

      // Without date
      const resultDefault = await getAdminAttendanceSummary();
      expect(resultDefault.isRight()).toBe(true);

      // With date
      const resultWithDate = await getAdminAttendanceSummary({ date: '2026-01-01' });
      expect(resultWithDate.isRight()).toBe(true);
      expect(hardenedFetchModule.hardenedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/summary?date=2026-01-01'),
        expect.anything(),
        expect.anything()
      );
      if (resultWithDate.isRight()) {
        expect(resultWithDate.value.totalStaff).toBe(10);
        expect(resultWithDate.value.attendanceRatePercent).toBe(80);
      }
    });
  });

  describe('recordClockIn and recordClockOut', () => {
    it('records clock-in successfully', async () => {
      vi.mocked(hardenedFetchModule.hardenedFetch).mockResolvedValue(right(mockAttendanceItem));

      const result = await recordClockIn({
        staffId: 'staff-1',
        pinCode: '1234',
        latitude: -6.2297,
        longitude: 106.8557,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.staffName).toBe('Budi Barista');
      }
    });

    it('records clock-out successfully', async () => {
      vi.mocked(hardenedFetchModule.hardenedFetch).mockResolvedValue(right(mockAttendanceItem));

      const result = await recordClockOut({
        staffId: 'staff-1',
        pinCode: '1234',
        latitude: -6.2297,
        longitude: 106.8557,
      });

      expect(result.isRight()).toBe(true);
    });
  });

  describe('createLeaveRequest', () => {
    it('submits leave request successfully', async () => {
      vi.mocked(hardenedFetchModule.hardenedFetch).mockResolvedValue(
        right({ success: true, message: 'Izin berhasil diajukan' })
      );

      const result = await createLeaveRequest({
        staffId: 'staff-1',
        leaveType: LEAVE_TYPE.SICK,
        startDate: '2026-01-02',
        endDate: '2026-01-03',
        reason: 'Sakit flu dan demam',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.success).toBe(true);
      }
    });
  });
});
