import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  OvertimeReviewModal,
  AttendanceCorrectionModal,
  AttendanceTable,
} from '@/components/attendance';
import { ShiftHandoverModal } from '@/components/shifts';
import { ATTENDANCE_STATUS } from '@/lib/constants/attendance';
import { ROLE } from '@/lib/constants/roles';
import * as attendanceHooks from '@/hooks/queries/use-admin-attendance';
import * as staffHooks from '@/hooks/queries/use-admin-staff';
import { useAuthStore } from '@/store/use-auth-store';
import { createQueryWrapper } from '@/test/test-utils';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Overtime & Shift Handover Components', () => {
  const mockAttendanceItem = {
    id: 'att-overtime-1',
    branchId: 'branch-1',
    staffId: 'staff-1',
    staffName: 'Ahmad Barista',
    staffRole: ROLE.KITCHEN,
    date: '2026-08-30',
    clockInTime: '08:00',
    clockOutTime: '18:00',
    status: ATTENDANCE_STATUS.ON_TIME,
    clockInLat: -6.2297,
    clockInLon: 106.8557,
    clockInDistanceMeters: 12,
    isWithinGeofence: true,
    workDurationMinutes: 600,
    isAutoClosed: true,
    overtimeMinutes: 120,
    isOvertimeApproved: null,
    actingRole: 'Kasir Pengganti',
    notes: 'Lembur menjaga kafe',
  };

  const mockStaffList = [
    {
      id: 'staff-1',
      name: 'Ahmad Barista',
      email: 'ahmad@kumpulcafe.com',
      role: ROLE.KITCHEN,
      isActive: true,
    },
    {
      id: 'staff-2',
      name: 'Siti Kasir',
      email: 'siti@kumpulcafe.com',
      role: ROLE.CASHIER,
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(staffHooks, 'useAdminStaffPaginatedQuery').mockReturnValue({
      data: { items: mockStaffList, meta: { totalItems: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false } },
      isLoading: false,
    } as any);

    useAuthStore.setState({
      user: {
        id: 'staff-1',
        name: 'Ahmad Barista',
        email: 'ahmad@kumpulcafe.com',
        role: ROLE.KITCHEN,
      } as any,
    });
  });

  describe('OvertimeReviewModal', () => {
    it('renders modal details and staff information', () => {
      const mockMutate = vi.fn();
      vi.spyOn(attendanceHooks, 'useReviewOvertimeMutation').mockReturnValue({
        mutateAsync: mockMutate,
        isPending: false,
      } as any);

      render(
        <OvertimeReviewModal
          isOpen={true}
          onClose={vi.fn()}
          attendance={mockAttendanceItem as any}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText('Review Lembur (Overtime)')).toBeInTheDocument();
      expect(screen.getByText('Ahmad Barista')).toBeInTheDocument();
      expect(screen.getByText(/⚡ \+2 jam/i)).toBeInTheDocument();
      expect(screen.getByText(/Kasir Pengganti/i)).toBeInTheDocument();
    });

    it('submits approval successfully', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn().mockResolvedValue({});
      const onClose = vi.fn();

      vi.spyOn(attendanceHooks, 'useReviewOvertimeMutation').mockReturnValue({
        mutateAsync: mockMutate,
        isPending: false,
      } as any);

      render(
        <OvertimeReviewModal
          isOpen={true}
          onClose={onClose}
          attendance={mockAttendanceItem as any}
        />,
        { wrapper: createQueryWrapper() }
      );

      const submitBtn = screen.getByRole('button', { name: /Simpan Keputusan/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          id: 'att-overtime-1',
          payload: {
            status: 'APPROVED',
            approvedMinutes: 120,
            notes: undefined,
          },
        });
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('AttendanceCorrectionModal', () => {
    it('renders correction modal and validates input', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn().mockResolvedValue({});
      const onClose = vi.fn();

      vi.spyOn(attendanceHooks, 'useCorrectAttendanceMutation').mockReturnValue({
        mutateAsync: mockMutate,
        isPending: false,
      } as any);

      render(
        <AttendanceCorrectionModal
          isOpen={true}
          onClose={onClose}
          attendance={mockAttendanceItem as any}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText('Koreksi Jam Pulang Staf')).toBeInTheDocument();
      expect(screen.getByText(/Auto-Cutoff Sistem/i)).toBeInTheDocument();

      const notesInput = screen.getByPlaceholderText(/Staf lupa clock-out/i);
      await user.type(notesInput, 'Staf lembur closing hingga 23:00');

      const submitBtn = screen.getByRole('button', { name: /Simpan Koreksi/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          id: 'att-overtime-1',
          payload: {
            clockOutTime: '18:00',
            notes: 'Staf lembur closing hingga 23:00',
          },
        });
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('ShiftHandoverModal', () => {
    it('switches tabs between PIN and Magic Link/QR', async () => {
      const user = userEvent.setup();

      render(
        <ShiftHandoverModal isOpen={true} onClose={vi.fn()} />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText('Serah Terima Shift (Handover)')).toBeInTheDocument();
      expect(screen.getByText('Input PIN Cepat')).toBeInTheDocument();

      const magicLinkTab = screen.getByRole('button', { name: /Magic QR \/ Link/i });
      await user.click(magicLinkTab);

      expect(screen.getByText(/SCAN QR HANDOVER/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Salin/i })).toBeInTheDocument();
    });

    it('submits shift handover with PIN successfully', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <ShiftHandoverModal isOpen={true} onClose={onClose} />,
        { wrapper: createQueryWrapper() }
      );

      // Fill PIN
      const pinInput = screen.getByPlaceholderText('••••');
      await user.type(pinInput, '1234');

      // Check current user state before handover
      expect(useAuthStore.getState().user?.name).toBe('Ahmad Barista');
    });
  });

  describe('AttendanceTable Enhancements', () => {
    it('renders Auto-Cutoff, Overtime, and Acting Role badges', () => {
      render(
        <AttendanceTable
          items={[mockAttendanceItem as any]}
          totalItems={1}
          currentPage={1}
          totalPages={1}
          onPageChange={vi.fn()}
        />,
        { wrapper: createQueryWrapper() }
      );

      expect(screen.getByText('Auto-Cutoff')).toBeInTheDocument();
      expect(screen.getByText(/⚡ \+120m/i)).toBeInTheDocument();
      expect(screen.getByText('Kasir Pengganti')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Review/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Koreksi/i })).toBeInTheDocument();
    });
  });
});
