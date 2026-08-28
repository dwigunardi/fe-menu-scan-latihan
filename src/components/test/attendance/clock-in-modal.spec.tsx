import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClockInModal } from '@/components/attendance/clock-in-modal';
import * as settingsHooks from '@/hooks/queries/use-admin-settings';
import * as staffHooks from '@/hooks/queries/use-admin-staff';
import * as attendanceHooks from '@/hooks/queries/use-admin-attendance';
import { ROLE } from '@/lib/constants/roles';

describe('ClockInModal Component', () => {
  const mockStaff = [
    {
      id: 'staff-1',
      name: 'Rian Barista',
      email: 'rian@kumpulcafe.com',
      role: ROLE.KITCHEN,
      pinCodeSet: true,
      isActive: true,
      dailyShiftHours: 8,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  ];

  const mockBranchSetting = {
    id: 'b-1',
    name: 'Kumpul Cafe Tebet',
    latitude: -6.2297465,
    longitude: 106.8557342,
    geofenceRadius: 100,
  };

  const mockClockInMutate = vi.fn();
  const mockClockOutMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(settingsHooks, 'useAdminBranchSettingQuery').mockReturnValue({
      data: mockBranchSetting,
      isLoading: false,
    } as any);

    vi.spyOn(staffHooks, 'useAdminStaffPaginatedQuery').mockReturnValue({
      data: { items: mockStaff, total: 1 },
      isLoading: false,
    } as any);

    vi.spyOn(attendanceHooks, 'useClockInMutation').mockReturnValue({
      mutateAsync: mockClockInMutate,
      isPending: false,
    } as any);

    vi.spyOn(attendanceHooks, 'useClockOutMutation').mockReturnValue({
      mutateAsync: mockClockOutMutate,
      isPending: false,
    } as any);

    // Mock navigator.geolocation with defineProperty
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((success) =>
          success({
            coords: {
              latitude: -6.2297465,
              longitude: 106.8557342,
            },
          })
        ),
      },
      configurable: true,
      writable: true,
    });
  });

  it('renders modal with geofence indicator and staff options', () => {
    render(<ClockInModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Terminal Presensi Staf Kafe')).toBeInTheDocument();
    expect(screen.getByText('Posisi Dalam Jangkauan Kafe')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Rian Barista/i })).toBeInTheDocument();
  });

  it('switches to Clock-Out mode', () => {
    render(<ClockInModal isOpen={true} onClose={vi.fn()} />);

    const clockOutTab = screen.getByRole('button', { name: /Presensi Pulang \(Clock-Out\)/i });
    fireEvent.click(clockOutTab);

    expect(screen.getByRole('button', { name: /Konfirmasi Clock-Out/i })).toBeInTheDocument();
  });

  it('inputs 4-digit PIN via keypad and submits clock-in', async () => {
    mockClockInMutate.mockResolvedValue({ staffName: 'Rian Barista' });
    const onClose = vi.fn();

    render(<ClockInModal isOpen={true} onClose={onClose} />);

    // Select staff
    const staffSelect = screen.getByRole('combobox');
    fireEvent.change(staffSelect, { target: { value: 'staff-1' } });

    // Press PIN numbers 1, 2, 3, 4
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));

    // Submit Clock-In
    const submitBtn = screen.getByRole('button', { name: /Konfirmasi Clock-In/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockClockInMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          staffId: 'staff-1',
          pinCode: '1234',
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles backspace and clear pin keypad interactions', () => {
    render(<ClockInModal isOpen={true} onClose={vi.fn()} />);

    // Press PIN 1, 2, 3
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));

    // Press Backspace
    const backspaceBtn = screen.getByRole('button', { name: /Hapus satu angka/i });
    fireEvent.click(backspaceBtn);

    // Press Clear
    const clearBtn = screen.getByRole('button', { name: 'C' });
    fireEvent.click(clearBtn);
  });
});
