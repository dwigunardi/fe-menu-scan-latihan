import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ShiftHandoverModal } from '@/components/shifts/shift-handover-modal';
import * as staffHooks from '@/hooks/queries/use-admin-staff';
import * as shiftHooks from '@/hooks/queries/use-admin-shifts';
import * as authApi from '@/lib/api/auth-api';
import { left, right } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';
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
  name: 'Siti Rahma',
  email: 'siti@kumpulcafe.com',
  role: ROLE.CASHIER,
  isActive: true,
};

function signInAs(role: UserRole) {
  useAuthStore.getState().setAuth(
    { id: 'staff-1', name: 'Dendi Kasir', email: 'dendi@kumpulcafe.com', role },
    'old-access-token',
    'old-refresh-token'
  );
}

function mockCurrentShift(shift: { status: 'OPEN' | 'CLOSED'; staffId: string } | null) {
  return vi.spyOn(shiftHooks, 'useCurrentShiftQuery').mockReturnValue({
    data: shift,
    isLoading: false,
  } as unknown as ReturnType<typeof shiftHooks.useCurrentShiftQuery>);
}

function renderModal() {
  const onClose = vi.fn();
  render(<ShiftHandoverModal isOpen={true} onClose={onClose} />, {
    wrapper: createQueryWrapper(),
  });
  return { onClose };
}

function fillForm(password: string) {
  fireEvent.change(screen.getByLabelText('Staf pengganti'), { target: { value: INCOMING.id } });
  fireEvent.change(screen.getByLabelText(/Password Staf Pengganti/i), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole('button', { name: /Konfirmasi Serah Terima/i }));
}

describe('ShiftHandoverModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    signInAs(ROLE.CASHIER);
    vi.spyOn(staffHooks, 'useAdminStaffPaginatedQuery').mockReturnValue({
      data: { items: [INCOMING] },
    } as unknown as ReturnType<typeof staffHooks.useAdminStaffPaginatedQuery>);
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

  it('logs the incoming staff in and replaces the session with their tokens', async () => {
    mockCurrentShift(null);
    const loginSpy = vi.spyOn(authApi, 'loginStaff').mockResolvedValue(
      right({
        user: { id: INCOMING.id, name: INCOMING.name, email: INCOMING.email, role: ROLE.CASHIER },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      })
    );
    const { onClose } = renderModal();

    fillForm('rahasia123');

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(loginSpy).toHaveBeenCalledWith({
      usernameOrEmail: INCOMING.email,
      password: 'rahasia123',
    });

    const state = useAuthStore.getState();
    expect(state.user?.id).toBe(INCOMING.id);
    expect(state.accessToken).toBe('new-access-token');
    expect(state.refreshToken).toBe('new-refresh-token');
    expect(mockReplace).toHaveBeenCalledWith('/cashier/tables');
  });

  it('keeps the current session when the password is wrong', async () => {
    mockCurrentShift(null);
    vi.spyOn(authApi, 'loginStaff').mockResolvedValue(
      left(new ApiError(401, 'Unauthorized', 'Invalid credentials'))
    );
    const { onClose } = renderModal();

    fillForm('salah');

    expect(await screen.findByText('Password staf pengganti salah.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user?.id).toBe('staff-1');
    expect(useAuthStore.getState().accessToken).toBe('old-access-token');
  });

  it('skips the cash drawer check for kitchen staff', () => {
    signInAs(ROLE.KITCHEN);
    const shiftSpy = mockCurrentShift(null);
    renderModal();

    expect(shiftSpy).toHaveBeenCalledWith({ enabled: false });
    expect(screen.getByRole('button', { name: /Konfirmasi Serah Terima/i })).toBeInTheDocument();
  });
});
