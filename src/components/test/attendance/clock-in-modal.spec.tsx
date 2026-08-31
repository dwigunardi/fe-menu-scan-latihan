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
    {
      id: 'staff-2',
      name: 'Inaktif Staf',
      email: 'inaktif@kumpulcafe.com',
      role: ROLE.WAITER,
      pinCodeSet: false,
      isActive: false,
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

    vi.spyOn(settingsHooks, 'usePublicBranchLocationQuery').mockReturnValue({
      data: mockBranchSetting,
      isLoading: false,
    } as any);

    vi.spyOn(staffHooks, 'useAdminStaffPaginatedQuery').mockReturnValue({
      data: { items: mockStaff, total: 2 },
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

  it('renders modal with geofence indicator and staff options (filters out inactive staff)', async () => {
    render(<ClockInModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Terminal Presensi Staf Kafe')).toBeInTheDocument();
    expect(screen.getByText('Posisi Dalam Jangkauan Kafe')).toBeInTheDocument();
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);
    
    expect(await screen.findByText(/Rian Barista/i)).toBeInTheDocument();
    expect(screen.queryByText(/Inaktif Staf/i)).not.toBeInTheDocument();
  });

  it('handles fallback when branchSetting and staffData are undefined', () => {
    vi.spyOn(settingsHooks, 'useAdminBranchSettingQuery').mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
    vi.spyOn(staffHooks, 'useAdminStaffPaginatedQuery').mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    render(<ClockInModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Radius: 100m/i)).toBeInTheDocument();
  });

  it('handles GPS permission denied error', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((_success, error) =>
          error({
            code: 1,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          })
        ),
      },
      configurable: true,
      writable: true,
    });

    render(<ClockInModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Izin akses lokasi GPS ditolak/i)).toBeInTheDocument();
  });

  it('handles GPS position unavailable error', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((_success, error) =>
          error({
            code: 2,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          })
        ),
      },
      configurable: true,
      writable: true,
    });

    render(<ClockInModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Sinyal GPS lokasi tidak terdeteksi/i)).toBeInTheDocument();
  });

  it('handles GPS timeout error', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((_success, error) =>
          error({
            code: 3,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          })
        ),
      },
      configurable: true,
      writable: true,
    });

    render(<ClockInModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Waktu permintaan lokasi habis/i)).toBeInTheDocument();
  });

  it('handles environment where navigator.geolocation is not supported', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    render(<ClockInModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Browser tidak mendukung/i)).toBeInTheDocument();
  });

  it('disables submit button when staff is not selected or PIN is incomplete', async () => {
    render(<ClockInModal isOpen={true} onClose={vi.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /Konfirmasi Clock-In/i });
    expect(submitBtn).toBeDisabled();

    // Select staff
    const staffSelect = screen.getByRole('combobox');
    fireEvent.click(staffSelect);
    const staffOption = await screen.findByText(/Rian Barista/i);
    fireEvent.click(staffOption);
    expect(submitBtn).toBeDisabled();

    // Enter partial PIN (2 digits)
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(submitBtn).toBeDisabled();

    // Enter remaining 2 digits -> enabled
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(submitBtn).not.toBeDisabled();
  });

  it('validates outside geofence boundary warning and disables submit button', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((success) =>
          success({
            coords: {
              latitude: -6.3000,
              longitude: 106.9000,
            },
          })
        ),
      },
      configurable: true,
      writable: true,
    });

    render(<ClockInModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Posisi di Luar Jangkauan/i)).toBeInTheDocument();

    const staffSelect = screen.getByRole('combobox');
    fireEvent.click(staffSelect);
    const staffOption = await screen.findByText(/Rian Barista/i);
    fireEvent.click(staffOption);

    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));

    const submitBtn = screen.getByRole('button', { name: /Konfirmasi Clock-In/i });
    expect(submitBtn).toBeDisabled();
  });

  it('switches to Clock-Out mode and back to Clock-In mode, submits with notes', async () => {
    mockClockOutMutate.mockResolvedValue({ staffName: 'Rian Barista' });
    const onClose = vi.fn();

    render(<ClockInModal isOpen={true} onClose={onClose} />);

    // Switch to Clock-Out
    const clockOutTab = screen.getByRole('button', { name: /Presensi Pulang \(Clock-Out\)/i });
    fireEvent.click(clockOutTab);

    // Switch back to Clock-In
    const clockInTab = screen.getByRole('button', { name: /Presensi Masuk \(Clock-In\)/i });
    fireEvent.click(clockInTab);

    // Switch again to Clock-Out
    fireEvent.click(clockOutTab);

    // Select staff
    const staffSelect = screen.getByRole('combobox');
    fireEvent.click(staffSelect);
    const staffOption = await screen.findByText(/Rian Barista/i);
    fireEvent.click(staffOption);

    // Enter PIN 1, 2, 3, 0
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));

    // Input notes
    const notesInput = screen.getByPlaceholderText(/Contoh: Terlambat karena hujan/i);
    fireEvent.change(notesInput, { target: { value: 'Selesai shift sore tepat waktu' } });

    // Submit Clock-Out
    const submitBtn = screen.getByRole('button', { name: /Konfirmasi Clock-Out/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockClockOutMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          staffId: 'staff-1',
          pinCode: '1230',
          notes: 'Selesai shift sore tepat waktu',
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('inputs 4-digit PIN via keypad and submits clock-in with empty notes', async () => {
    mockClockInMutate.mockResolvedValue({ staffName: 'Rian Barista' });
    const onClose = vi.fn();

    render(<ClockInModal isOpen={true} onClose={onClose} />);

    // Select staff
    const staffSelect = screen.getByRole('combobox');
    fireEvent.click(staffSelect);
    const staffOption = await screen.findByText(/Rian Barista/i);
    fireEvent.click(staffOption);

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
          notes: undefined,
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles mutation rejection without crashing', async () => {
    mockClockInMutate.mockRejectedValue(new Error('Network error'));
    const onClose = vi.fn();

    render(<ClockInModal isOpen={true} onClose={onClose} />);

    const staffSelect = screen.getByRole('combobox');
    fireEvent.click(staffSelect);
    const staffOption = await screen.findByText(/Rian Barista/i);
    fireEvent.click(staffOption);

    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));

    const submitBtn = screen.getByRole('button', { name: /Konfirmasi Clock-In/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockClockInMutate).toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('handles backspace and clear pin keypad interactions, and dialog dismiss', () => {
    const onClose = vi.fn();
    render(<ClockInModal isOpen={true} onClose={onClose} />);

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

    // Press Batal button
    const cancelBtn = screen.getByRole('button', { name: 'Batal' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
