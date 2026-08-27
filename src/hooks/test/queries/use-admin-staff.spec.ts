import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useAdminStaffPaginatedQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useUpdateStaffPinMutation,
  useDeleteStaffMutation,
} from '@/hooks/queries/use-admin-staff';
import { createQueryWrapper } from '@/test/test-utils';
import * as staffApi from '@/lib/api/admin-staff-api';
import { right, left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';
import { StaffItem } from '@/lib/validations/staff.schema';
import { ROLE } from '@/lib/constants/roles';
import { toast } from 'sonner';

vi.mock('@/lib/api/admin-staff-api', () => ({
  getAdminStaffPaginated: vi.fn(),
  createAdminStaff: vi.fn(),
  updateAdminStaff: vi.fn(),
  updateAdminStaffPin: vi.fn(),
  deleteAdminStaff: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('use-admin-staff query hooks', () => {
  const mockStaff: StaffItem = {
    id: 'staff-1',
    name: 'Ahmad Barista',
    email: 'ahmad@kumpulcafe.com',
    phone: '+6281234567890',
    role: ROLE.KITCHEN,
    pinCodeSet: true,
    dailyShiftHours: 8,
    isActive: true,
    avatarUrl: null,
    isEmailVerified: true,
    isPhoneVerified: true,
    joinedAt: '2026-01-10T08:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAdminStaffPaginatedQuery', () => {
    it('fetches paginated staff list', async () => {
      vi.mocked(staffApi.getAdminStaffPaginated).mockResolvedValue(
        right({
          items: [mockStaff],
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
      const { result } = renderHook(() => useAdminStaffPaginatedQuery({ page: 1, limit: 10 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.items[0].name).toBe('Ahmad Barista');
    });

    it('handles query error', async () => {
      vi.mocked(staffApi.getAdminStaffPaginated).mockResolvedValue(left(ApiError.networkError()));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useAdminStaffPaginatedQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useCreateStaffMutation', () => {
    it('creates staff account successfully and shows toast', async () => {
      vi.mocked(staffApi.createAdminStaff).mockResolvedValue(right(mockStaff));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateStaffMutation(), { wrapper });

      await result.current.mutateAsync({
        name: 'Ahmad Barista',
        email: 'ahmad@kumpulcafe.com',
        phone: '+6281234567890',
        role: ROLE.KITCHEN,
        password: 'password123',
        dailyShiftHours: 8,
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Akun karyawan Ahmad Barista berhasil dibuat')
      );
    });
  });

  describe('useUpdateStaffMutation', () => {
    it('updates staff data and shows toast', async () => {
      vi.mocked(staffApi.updateAdminStaff).mockResolvedValue(right(mockStaff));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateStaffMutation(), { wrapper });

      await result.current.mutateAsync({
        id: 'staff-1',
        payload: {
          name: 'Ahmad Barista Senior',
          email: 'ahmad@kumpulcafe.com',
          role: ROLE.KITCHEN,
          isActive: true,
          dailyShiftHours: 8,
        },
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Data karyawan Ahmad Barista berhasil diperbarui')
      );
    });
  });

  describe('useUpdateStaffPinMutation', () => {
    it('updates staff PIN code and shows toast', async () => {
      vi.mocked(staffApi.updateAdminStaffPin).mockResolvedValue(
        right({ success: true, message: 'PIN 4-digit karyawan berhasil diperbarui' })
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useUpdateStaffPinMutation(), { wrapper });

      await result.current.mutateAsync({
        id: 'staff-1',
        payload: { pinCode: '1234' },
      });

      expect(toast.success).toHaveBeenCalledWith('PIN 4-digit karyawan berhasil diperbarui');
    });
  });

  describe('useDeleteStaffMutation', () => {
    it('deletes staff account and shows toast', async () => {
      vi.mocked(staffApi.deleteAdminStaff).mockResolvedValue(right({ success: true, message: 'Deleted' }));

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useDeleteStaffMutation(), { wrapper });

      await result.current.mutateAsync('staff-1');

      expect(toast.success).toHaveBeenCalledWith('Akun karyawan berhasil dihapus');
    });
  });
});
