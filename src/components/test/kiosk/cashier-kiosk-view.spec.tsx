import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { CashierKioskView } from '@/components/kiosk/cashier-kiosk-view';
import { ROLE } from '@/lib/constants/roles';
import { getTodayWib } from '@/lib/utils/date-helpers';
import * as authApi from '@/lib/api/auth-api';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/cashier/kiosk',
}));

// Mock queries and mutations
const mockMutateClockIn = vi.fn().mockResolvedValue({ staffName: 'Siti Rahma' });
const mockMutateClockOut = vi.fn().mockResolvedValue({ staffName: 'Siti Rahma' });

vi.mock('@/hooks/queries/use-admin-settings', () => ({
  usePublicBranchLocationQuery: () => ({
    data: {
      name: 'Kumpul Cafe - Tebet',
      address: 'Jl. Tebet Raya No. 10',
      latitude: -6.2297465,
      longitude: 106.8557342,
      geofenceRadius: 100,
    },
    isLoading: false,
  }),
}));

// Kiosk roster (GET /admin/attendance/kiosk-roster): staff cards + today's attendance
const ROSTER = [
  {
    id: 'staff-1',
    employeeId: 'KC-001',
    name: 'Budi Santoso',
    role: ROLE.ADMIN,
    avatarUrl: null,
    hasPin: true,
    today: {
      attendanceId: 'att-1',
      clockInTime: '2026-11-23T01:00:00.000Z',
      clockOutTime: null,
      status: 'ON_TIME',
    },
  },
  {
    id: 'staff-2',
    employeeId: 'KC-002',
    name: 'Siti Rahma',
    role: ROLE.CASHIER,
    avatarUrl: null,
    hasPin: true,
    today: null,
  },
  {
    id: 'staff-3',
    employeeId: 'KC-003',
    name: 'Agus Pratama',
    role: ROLE.KITCHEN,
    avatarUrl: null,
    hasPin: true,
    today: null,
  },
];

const mockRefetchRoster = vi.fn();
const mockRosterQuery = vi.fn();
let mockRosterResult: Record<string, unknown> = {};

vi.mock('@/hooks/queries/use-admin-attendance', () => ({
  useKioskRosterQuery: (wibDate: string) => {
    mockRosterQuery(wibDate);
    return mockRosterResult;
  },
  useClockInMutation: () => ({
    mutateAsync: mockMutateClockIn,
    isPending: false,
  }),
  useClockOutMutation: () => ({
    mutateAsync: mockMutateClockOut,
    isPending: false,
  }),
}));

import { useAuthStore } from '@/store/use-auth-store';
import { useKioskLockStore } from '@/store/use-kiosk-lock-store';

describe('CashierKioskView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRosterResult = {
      data: ROSTER,
      isLoading: false,
      isError: false,
      refetch: mockRefetchRoster,
    };
    useAuthStore.setState({
      user: {
        id: 'cashier-1',
        name: 'Dendi Kasir',
        role: ROLE.CASHIER,
        email: 'dendi@kumpulcafe.com',
        username: 'dendi',
        employeeId: 'KC-001',
      },
      accessToken: 'mock-token',
      isAuthenticated: true,
    });
  });

  it('renders kiosk header, branch name, and staff cards', () => {
    render(<CashierKioskView />);

    expect(screen.getByText('Kumpul Cafe - Tebet')).toBeInTheDocument();
    expect(screen.getByText('KIOS PRESENSI')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Siti Rahma')).toBeInTheDocument();
    expect(screen.getByText('Agus Pratama')).toBeInTheDocument();
  });

  it('shows duty status for clocked-in staff', () => {
    render(<CashierKioskView />);

    // Budi Santoso has today.clockInTime in the roster
    expect(screen.getByText('Bertugas')).toBeInTheDocument();
  });

  it('loads the roster for the current WIB day', () => {
    render(<CashierKioskView />);

    expect(mockRosterQuery).toHaveBeenCalledWith(getTodayWib());
  });

  it('disables staff cards without a PIN', () => {
    mockRosterResult = {
      ...mockRosterResult,
      data: [{ ...ROSTER[1], hasPin: false }],
    };
    render(<CashierKioskView />);

    const card = document.getElementById('kiosk-staff-card-staff-2') as HTMLButtonElement;
    expect(card).toBeDisabled();
    expect(screen.getByText('PIN belum dibuat')).toBeInTheDocument();

    fireEvent.click(card);
    expect(screen.queryByText(/Ketik 4-digit PIN presensi Anda/i)).not.toBeInTheDocument();
  });

  it('keeps the last roster usable when a background refresh fails', () => {
    // TanStack Query reports isError while still holding the previous data
    mockRosterResult = { data: ROSTER, isLoading: false, isError: true, refetch: mockRefetchRoster };
    render(<CashierKioskView />);

    expect(screen.getByText('Siti Rahma')).toBeInTheDocument();
    expect(screen.queryByText('Daftar staf gagal dimuat')).not.toBeInTheDocument();
    expect(screen.getByText(/Gagal memperbarui daftar staf/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Muat Ulang/i }));
    expect(mockRefetchRoster).toHaveBeenCalled();
  });

  it('shows a reload button when the roster fails to load', () => {
    mockRosterResult = { data: undefined, isLoading: false, isError: true, refetch: mockRefetchRoster };
    render(<CashierKioskView />);

    expect(screen.getByText('Daftar staf gagal dimuat')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Muat Ulang/i }));
    expect(mockRefetchRoster).toHaveBeenCalled();
  });

  it('filters staff by search query input', () => {
    render(<CashierKioskView />);

    const searchInput = screen.getByPlaceholderText(/Cari nama staf atau NIK/i);
    fireEvent.change(searchInput, { target: { value: 'Siti' } });

    expect(screen.getByText('Siti Rahma')).toBeInTheDocument();
    expect(screen.queryByText('Agus Pratama')).not.toBeInTheDocument();
  });

  it('toggles mode between Clock-In and Clock-Out', () => {
    render(<CashierKioskView />);

    const clockOutTab = screen.getByRole('button', { name: /Presensi Pulang/i });
    fireEvent.click(clockOutTab);

    // Clicking a staff card now opens modal in Clock-Out mode
    fireEvent.click(screen.getByText('Siti Rahma'));

    expect(screen.getAllByText(/Presensi Pulang \(Clock-Out\)/i).length).toBeGreaterThanOrEqual(2);
  });

  it('opens PIN verification modal when staff card is tapped', () => {
    render(<CashierKioskView />);

    const staffCard = screen.getByText('Agus Pratama');
    fireEvent.click(staffCard);

    expect(screen.getByText(/Ketik 4-digit PIN presensi Anda/i)).toBeInTheDocument();
    expect(screen.getByText(/NIK: KC-003/i)).toBeInTheDocument();
  });

  it('opens Exit Dialog when Keluar Kios button is clicked', () => {
    render(<CashierKioskView />);

    const exitBtn = screen.getByRole('button', { name: /Keluar Kios/i });
    fireEvent.click(exitBtn);

    expect(screen.getByText('Proteksi Keluar Kios')).toBeInTheDocument();
    expect(screen.getByText('Dendi Kasir')).toBeInTheDocument();
  });

  describe('clock-in location', () => {
    function mockGeolocation(coords: { latitude: number; longitude: number } | null) {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: coords
          ? { getCurrentPosition: (onSuccess: PositionCallback) => onSuccess({ coords } as GeolocationPosition) }
          : undefined,
      });
    }

    async function enterPinFor(staffName: string, pin: string) {
      fireEvent.click(screen.getByText(staffName));
      for (const digit of pin) {
        await act(async () => {
          fireEvent.click(document.getElementById(`kiosk-pin-btn-${digit}`) as HTMLElement);
        });
      }
    }

    it('refuses to clock in without a GPS fix instead of using the branch coordinates', async () => {
      mockGeolocation(null);
      render(<CashierKioskView />);

      await enterPinFor('Siti Rahma', '1234');

      expect(await screen.findByText(/Lokasi GPS belum terdeteksi/i)).toBeInTheDocument();
      expect(mockMutateClockIn).not.toHaveBeenCalled();
    });

    it('sends the device GPS coordinates when a fix is available', async () => {
      // Same spot as the mocked branch, so the geofence check passes
      mockGeolocation({ latitude: -6.2297465, longitude: 106.8557342 });
      render(<CashierKioskView />);

      await enterPinFor('Siti Rahma', '1234');

      await waitFor(() => {
        expect(mockMutateClockIn).toHaveBeenCalledWith(
          expect.objectContaining({ staffId: 'staff-2', pinCode: '1234', latitude: -6.2297465, longitude: 106.8557342 })
        );
      });
    });
  });

  it('locks the device to the kiosk on mount', () => {
    useKioskLockStore.setState({ isLocked: false });

    render(<CashierKioskView />);

    expect(useKioskLockStore.getState().isLocked).toBe(true);
  });

  it('blocks the kiosk and ignores repeated logout taps while signing out', async () => {
    let finish: () => void = () => {};
    const signOutSpy = vi
      .spyOn(authApi, 'signOutStaff')
      .mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<CashierKioskView />);

    fireEvent.click(screen.getByRole('button', { name: /Keluar Kios/i }));
    fireEvent.click(screen.getByRole('button', { name: /Lupa PIN\? Keluar akun/i }));
    expect(screen.getByText('Mengakhiri sesi...')).toBeInTheDocument();

    // A second attempt while the first is still running does not start another sign-out
    fireEvent.click(screen.getByRole('button', { name: /Keluar Kios/i }));
    fireEvent.click(screen.getByRole('button', { name: /Lupa PIN\? Keluar akun/i }));
    expect(signOutSpy).toHaveBeenCalledTimes(1);

    await act(async () => finish());
    signOutSpy.mockRestore();
  });

  it('logging out from the exit dialog releases the lock', async () => {
    render(<CashierKioskView />);
    expect(useKioskLockStore.getState().isLocked).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /Keluar Kios/i }));
    fireEvent.click(screen.getByRole('button', { name: /Lupa PIN\? Keluar akun/i }));

    // Sign-out first revokes the session on the server, then clears it locally
    await waitFor(() => expect(useAuthStore.getState().user).toBeNull());
    expect(useKioskLockStore.getState().isLocked).toBe(false);
  });
});
