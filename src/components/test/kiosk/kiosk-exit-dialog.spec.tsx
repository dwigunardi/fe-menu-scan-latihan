import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KioskExitDialog } from '@/components/kiosk/kiosk-exit-dialog';
import { useAuthStore, ROLE } from '@/store/use-auth-store';

describe('KioskExitDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    render(
      <KioskExitDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirmExit={vi.fn()}
      />
    );

    expect(screen.getByText('Proteksi Keluar Kios')).toBeInTheDocument();
    expect(screen.getByText('Dendi Kasir')).toBeInTheDocument();
    expect(screen.getByText(/Masukkan 4-digit PIN/i)).toBeInTheDocument();
  });

  it('allows entering 4 digits and confirms exit on valid PIN', async () => {
    const handleConfirmExit = vi.fn();

    render(
      <KioskExitDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirmExit={handleConfirmExit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));

    await waitFor(() => {
      expect(handleConfirmExit).toHaveBeenCalled();
    });
  });

  it('rejects forbidden test pin 0000 and displays error', async () => {
    const handleConfirmExit = vi.fn();

    render(
      <KioskExitDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirmExit={handleConfirmExit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '0' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));

    await waitFor(() => {
      expect(screen.getByText(/PIN kasir salah/i)).toBeInTheDocument();
      expect(handleConfirmExit).not.toHaveBeenCalled();
    });
  });
});
