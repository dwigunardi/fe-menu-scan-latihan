import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminAttendancePage from '@/app/(dashboard)/admin/attendance/page';
import { createQueryWrapper } from '@/test/test-utils';
import * as attendanceHooks from '@/hooks/queries/use-admin-attendance';
import * as settingsHooks from '@/hooks/queries/use-admin-settings';
import * as staffHooks from '@/hooks/queries/use-admin-staff';
import { useAuthStore, ROLE } from '@/store/use-auth-store';
import { ATTENDANCE_STATUS } from '@/lib/constants/attendance';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/admin/attendance',
}));

describe('AdminAttendancePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      user: {
        id: 'admin-1',
        name: 'Manager Kafe',
        role: ROLE.ADMIN,
        email: 'admin@kumpulcafe.com',
      },
      isAuthenticated: true,
    });

    vi.spyOn(settingsHooks, 'useAdminBranchSettingQuery').mockReturnValue({
      data: {
        id: 'b-1',
        name: 'Kumpul Cafe Pusat',
        latitude: -6.2297465,
        longitude: 106.8557342,
        geofenceRadius: 100,
      },
      isLoading: false,
    } as any);

    vi.spyOn(staffHooks, 'useAdminStaffPaginatedQuery').mockReturnValue({
      data: {
        items: [
          { id: 's-1', name: 'Budi Kasir', role: ROLE.CASHIER, isActive: true },
          { id: 's-2', name: 'Rian Kitchen', role: ROLE.KITCHEN, isActive: true },
        ],
        total: 2,
      },
      isLoading: false,
    } as any);

    vi.spyOn(attendanceHooks, 'useAdminAttendancePaginatedQuery').mockReturnValue({
      data: {
        items: [
          {
            id: 'att-1',
            branchId: 'b-1',
            staffId: 's-1',
            staffName: 'Budi Kasir',
            staffRole: ROLE.CASHIER,
            date: '2026-01-01',
            clockInTime: '2026-01-01T08:00:00.000Z',
            clockOutTime: '2026-01-01T16:00:00.000Z',
            status: ATTENDANCE_STATUS.ON_TIME,
            clockInLat: -6.2297,
            clockInLon: 106.8557,
            clockInDistanceMeters: 10,
            isWithinGeofence: true,
            workDurationMinutes: 480,
            notes: 'Hadir tepat waktu',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
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

  it('renders attendance page header, KPI cards, filter bar, and log table', () => {
    const wrapper = createQueryWrapper();
    render(<AdminAttendancePage />, { wrapper });

    expect(screen.getByText('Presensi & Absensi Karyawan')).toBeInTheDocument();
    expect(screen.getByText('Total Staf Hari Ini')).toBeInTheDocument();
    expect(screen.getByText('Budi Kasir')).toBeInTheDocument();
    expect(screen.getByText('Presensi Staf (Clock-In)')).toBeInTheDocument();
    expect(screen.getByText('Catat Izin / Cuti')).toBeInTheDocument();
  });

  it('opens Clock-In modal when Presensi Staf button is clicked', () => {
    const wrapper = createQueryWrapper();
    render(<AdminAttendancePage />, { wrapper });

    const clockInBtn = screen.getByRole('button', { name: /Presensi Staf \(Clock-In\)/i });
    fireEvent.click(clockInBtn);

    expect(screen.getByText('Terminal Presensi Staf Kafe')).toBeInTheDocument();
  });

  it('opens Leave Request modal when Catat Izin button is clicked', () => {
    const wrapper = createQueryWrapper();
    render(<AdminAttendancePage />, { wrapper });

    const leaveBtn = screen.getByRole('button', { name: /Catat Izin \/ Cuti/i });
    fireEvent.click(leaveBtn);

    expect(screen.getByText('Form Izin / Sakit / Cuti Staf')).toBeInTheDocument();
  });
});
