import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ShiftHandoverModal } from '@/components/shifts/shift-handover-modal';
import * as handoverHooks from '@/hooks/queries/use-handover';
import * as shiftHooks from '@/hooks/queries/use-admin-shifts';
import * as authApi from '@/lib/api/auth-api';
import { left, right } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';
import { ErrorCode } from '@/lib/api/error-codes';
import { useAuthStore, ROLE } from '@/store/use-auth-store';
import type { UserRole } from '@/store/use-auth-store';
import { createQueryWrapper } from '@/test/test-utils';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Radix Select is hard to drive in happy-dom; a native <select> keeps the same contract
vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: ReactNode;
  }) => (
    <select aria-label="Staf pengganti" value={value} onChange={(e) => onValueChange(e.target.value)}>
      <option value="">-</option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value }: { value: string }) => <option value={value}>{value}</option>,
}));

const INCOMING = {
  id: 'staff-2',
  employeeId: 'KC-002',
  name: 'Siti Rahma',
  role: 'KITCHEN' as const,
  avatarUrl: null,
};

function signInAs(role: UserRole) {
  useAuthStore.getState().setAuth(
    { id: 'staff-1', name: 'Dendi Kasir', email: 'dendi@kumpulcafe.com', role },
    'old-access-token'
  );
}

function mockCurrentShift(shift: { status: 'OPEN' | 'CLOSED'; staffId: string } | null) {
  return vi.spyOn(shiftHooks, 'useCurrentShiftQuery').mockReturnValue({
    data: shift,
    isLoading: false,
  } as unknown as ReturnType<typeof shiftHooks.useCurrentShiftQuery>);
}

const mockRefetchCandidates = vi.fn();

function mockCandidates(items: (typeof INCOMING)[]) {
  vi.spyOn(handoverHooks, 'useHandoverCandidatesQuery').mockReturnValue({
    data: items,
    isLoading: false,
    refetch: mockRefetchCandidates,
  } as unknown as ReturnType<typeof handoverHooks.useHandoverCandidatesQuery>);
}

function renderModal() {
  const onClose = vi.fn();
  render(<ShiftHandoverModal isOpen={true} onClose={onClose} />, {
    wrapper: createQueryWrapper(),
  });
  return { onClose };
}

function submitHandover(pin: string, notes = '') {
  fireEvent.change(screen.getByLabelText('Staf pengganti'), { target: { value: INCOMING.id } });
  fireEvent.change(screen.getByLabelText(/PIN 4-Digit Staf Pengganti/i), { target: { value: pin } });
  if (notes) {
    fireEvent.change(screen.getByLabelText(/Catatan Serah Terima/i), { target: { value: notes } });
  }
  fireEvent.click(screen.getByRole('button', { name: /Konfirmasi Serah Terima/i }));
}

describe('ShiftHandoverModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockRefetchCandidates.mockClear();
    signInAs(ROLE.CASHIER);
    mockCandidates([INCOMING]);
  });

  it('asks a cashier with an open cash drawer to close the shift first', () => {
    mockCurrentShift({ status: 'OPEN', staffId: 'staff-1' });
    const { onClose } = renderModal();

    expect(screen.getByText(/Tutup shift kas Anda terlebih dahulu/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Konfirmasi Serah Terima/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Buka Halaman Shift/i }));
    expect(mockPush).toHaveBeenCalledWith('/admin/shifts');
    expect(onClose).toHaveBeenCalled();
  });

  it('hands over with the incoming PIN and replaces the session with the returned one', async () => {
    mockCurrentShift(null);
    const handoverSpy = vi.spyOn(authApi, 'handoverShift').mockResolvedValue(
      right({
        user: { id: INCOMING.id, name: INCOMING.name, role: ROLE.KITCHEN },
        accessToken: 'new-access-token',
      })
    );
    const { onClose } = renderModal();

    submitHandover('1234', 'Meja 5 menunggu');

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(handoverSpy).toHaveBeenCalledWith({
      incomingStaffId: INCOMING.id,
      pinCode: '1234',
      notes: 'Meja 5 menunggu',
    });

    const state = useAuthStore.getState();
    expect(state.user?.id).toBe(INCOMING.id);
    expect(state.accessToken).toBe('new-access-token');
    expect(mockReplace).toHaveBeenCalledWith('/kitchen/orders');
  });

  it('shows the backend message on a wrong PIN and keeps the current session', async () => {
    mockCurrentShift(null);
    vi.spyOn(authApi, 'handoverShift').mockResolvedValue(
      left(new ApiError(400, 'Bad Request', 'PIN staf pengganti salah.'))
    );
    const { onClose } = renderModal();

    submitHandover('0000');

    expect(await screen.findByText('PIN staf pengganti salah.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user?.id).toBe('staff-1');
    expect(useAuthStore.getState().accessToken).toBe('old-access-token');
  });

  it('shows the PIN lockout wait time on 429', async () => {
    mockCurrentShift(null);
    vi.spyOn(authApi, 'handoverShift').mockResolvedValue(
      left(new ApiError(429, 'Too Many Requests', 'Terlalu banyak percobaan PIN. Coba lagi dalam 5 menit.'))
    );
    renderModal();

    submitHandover('1111');

    expect(await screen.findByText(/Coba lagi dalam 5 menit/i)).toBeInTheDocument();
  });

  it('switches to the close-shift step when the backend answers SHIFT_STILL_OPEN', async () => {
    // e.g. a waiter or kitchen staff holding a drawer, which the FE pre-check does not cover
    signInAs(ROLE.WAITER);
    mockCurrentShift(null);
    vi.spyOn(authApi, 'handoverShift').mockResolvedValue(
      left(new ApiError(409, 'Conflict', 'Shift kas masih terbuka', { code: ErrorCode.SHIFT_STILL_OPEN }))
    );
    renderModal();

    submitHandover('1234');

    expect(await screen.findByText(/Tutup shift kas Anda terlebih dahulu/i)).toBeInTheDocument();
    // Waiters cannot open /admin/shifts, so they are asked to contact an admin instead
    expect(screen.getByText(/Minta admin menutup shift/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Buka Halaman Shift/i })).not.toBeInTheDocument();
  });

  it('clears the stale choice and refreshes the list when the incoming staff is no longer available (404)', async () => {
    mockCurrentShift(null);
    vi.spyOn(authApi, 'handoverShift').mockResolvedValue(
      left(new ApiError(404, 'Not Found', 'Staf pengganti tidak ditemukan.'))
    );
    renderModal();

    submitHandover('1234');

    expect(await screen.findByText(/Pilih staf lain/i)).toBeInTheDocument();
    expect(mockRefetchCandidates).toHaveBeenCalled();
    expect(screen.getByLabelText('Staf pengganti')).toHaveValue('');
  });

  it('shows a retryable error when the candidate list fails to load', () => {
    mockCurrentShift(null);
    vi.spyOn(handoverHooks, 'useHandoverCandidatesQuery').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch: mockRefetchCandidates,
    } as unknown as ReturnType<typeof handoverHooks.useHandoverCandidatesQuery>);
    renderModal();

    expect(screen.getByText(/Gagal memuat daftar staf/i)).toBeInTheDocument();
    expect(screen.queryByText(/Belum ada staf lain/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Coba lagi/i }));
    expect(mockRefetchCandidates).toHaveBeenCalled();
  });

  it('skips the cash drawer pre-check for kitchen staff and loads candidates only while open', () => {
    signInAs(ROLE.KITCHEN);
    const shiftSpy = mockCurrentShift(null);
    const candidatesSpy = vi.spyOn(handoverHooks, 'useHandoverCandidatesQuery');
    mockCandidates([INCOMING]);
    renderModal();

    expect(shiftSpy).toHaveBeenCalledWith({ enabled: false });
    expect(candidatesSpy).toHaveBeenCalledWith({ enabled: true });
    expect(screen.getByRole('button', { name: /Konfirmasi Serah Terima/i })).toBeInTheDocument();
  });

  it('explains an empty candidate list', () => {
    mockCurrentShift(null);
    mockCandidates([]);
    renderModal();

    expect(screen.getByText(/Belum ada staf lain yang bisa menerima serah terima/i)).toBeInTheDocument();
  });
});
