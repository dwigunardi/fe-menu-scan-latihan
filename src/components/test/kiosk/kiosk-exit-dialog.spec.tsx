import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KioskExitDialog } from '@/components/kiosk/kiosk-exit-dialog';
import { useAuthStore, ROLE } from '@/store/use-auth-store';
import * as authApi from '@/lib/api/auth-api';
import { left, right } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';

function enterPin(digits: string) {
  for (const d of digits) {
    fireEvent.click(screen.getByRole('button', { name: d }));
  }
}

function renderDialog(onConfirmExit = vi.fn()) {
  render(<KioskExitDialog isOpen={true} onClose={vi.fn()} onConfirmExit={onConfirmExit} />);
  return onConfirmExit;
}

describe('KioskExitDialog Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

  it('renders cashier details properly in exit guard modal', () => {
    renderDialog();

    expect(screen.getByText('Proteksi Keluar Kios')).toBeInTheDocument();
    expect(screen.getByText('Dendi Kasir')).toBeInTheDocument();
    expect(screen.getByText(/Masukkan 4-digit PIN/i)).toBeInTheDocument();
  });

  it('verifies the PIN with the backend and exits when it is valid', async () => {
    const verifySpy = vi
      .spyOn(authApi, 'verifyStaffPin')
      .mockResolvedValue(right({ valid: true }));
    const onConfirmExit = renderDialog();

    enterPin('8520');

    await waitFor(() => {
      expect(onConfirmExit).toHaveBeenCalled();
    });
    expect(verifySpy).toHaveBeenCalledWith('8520');
  });

  it('stays locked when the backend says the PIN is wrong', async () => {
    vi.spyOn(authApi, 'verifyStaffPin').mockResolvedValue(right({ valid: false }));
    const onConfirmExit = renderDialog();

    // Any 4-digit PIN used to be accepted without verification.
    enterPin('1234');

    await waitFor(() => {
      expect(screen.getByText(/PIN kasir salah/i)).toBeInTheDocument();
    });
    expect(onConfirmExit).not.toHaveBeenCalled();
  });

  it('stays locked and shows a connection message when the server is unreachable', async () => {
    vi.spyOn(authApi, 'verifyStaffPin').mockResolvedValue(left(ApiError.networkError()));
    const onConfirmExit = renderDialog();

    enterPin('8520');

    await waitFor(() => {
      expect(screen.getByText(/Tidak dapat terhubung ke server/i)).toBeInTheDocument();
    });
    expect(onConfirmExit).not.toHaveBeenCalled();
  });

  it('stays locked when the backend rejects the PIN with a 4xx error', async () => {
    vi.spyOn(authApi, 'verifyStaffPin').mockResolvedValue(
      left(new ApiError(400, 'Bad Request', 'Invalid PIN'))
    );
    const onConfirmExit = renderDialog();

    enterPin('0000');

    await waitFor(() => {
      expect(screen.getByText(/PIN kasir salah/i)).toBeInTheDocument();
    });
    expect(onConfirmExit).not.toHaveBeenCalled();
  });

  it('shows the backend lockout message with the remaining minutes on 429', async () => {
    vi.spyOn(authApi, 'verifyStaffPin').mockResolvedValue(
      left(new ApiError(429, 'Too Many Requests', 'Terlalu banyak percobaan PIN. Coba lagi dalam 4 menit.'))
    );
    const onConfirmExit = renderDialog();

    enterPin('1111');

    await waitFor(() => {
      expect(screen.getByText(/Coba lagi dalam 4 menit/i)).toBeInTheDocument();
    });
    expect(onConfirmExit).not.toHaveBeenCalled();
  });

  it('offers a logout escape hatch for a forgotten PIN when onLogout is given', () => {
    const onLogout = vi.fn();
    const onConfirmExit = vi.fn();
    render(
      <KioskExitDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirmExit={onConfirmExit}
        onLogout={onLogout}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Lupa PIN\? Keluar akun/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onConfirmExit).not.toHaveBeenCalled();
  });

  it('hides the logout escape hatch without onLogout', () => {
    renderDialog();

    expect(screen.queryByRole('button', { name: /Lupa PIN/i })).not.toBeInTheDocument();
  });
});
