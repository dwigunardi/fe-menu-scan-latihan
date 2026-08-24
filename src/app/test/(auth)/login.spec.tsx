import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffLoginPage from '@/app/(auth)/login/page';
import { useAuthStore } from '@/store/use-auth-store';
import * as authApi from '@/lib/api/auth-api';
import { Right } from '@/lib/api/either';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('StaffLoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('renders login form and quick demo credentials pills', () => {
    render(<StaffLoginPage />);

    expect(screen.getByText('Portal Staf Kumpul Cafe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Masukkan username staf/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Masukkan kata sandi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Masuk ke Portal/i })).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('KITCHEN')).toBeInTheDocument();
  });

  it('autofills credentials when demo quick button is clicked', () => {
    render(<StaffLoginPage />);

    const kitchenPill = screen.getByText('kitchen');
    fireEvent.click(kitchenPill);

    expect(screen.getByPlaceholderText(/Masukkan username staf/i)).toHaveValue('kitchen');
    expect(screen.getByPlaceholderText(/Masukkan kata sandi/i)).toHaveValue('KitchenPass123!');
  });

  it('successfully logs in and redirects KITCHEN staff to /kitchen/orders', async () => {
    vi.spyOn(authApi, 'loginStaff').mockResolvedValue(
      new Right({
        user: {
          id: 'k1',
          username: 'kitchen',
          name: 'Chef Juna',
          role: 'KITCHEN' as const,
        },
        accessToken: 'token-abc',
        refreshToken: 'refresh-xyz',
      })
    );

    render(<StaffLoginPage />);

    const usernameInput = screen.getByPlaceholderText(/Masukkan username staf/i);
    const passwordInput = screen.getByPlaceholderText(/Masukkan kata sandi/i);

    fireEvent.change(usernameInput, { target: { value: 'kitchen' } });
    fireEvent.change(passwordInput, { target: { value: 'KitchenPass123!' } });

    const submitBtn = screen.getByRole('button', { name: /Masuk ke Portal/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/kitchen/orders');
    });
  });

  it('successfully logs in and redirects CASHIER staff to /cashier/tables', async () => {
    vi.spyOn(authApi, 'loginStaff').mockResolvedValue(
      new Right({
        user: {
          id: 'c1',
          username: 'cashier',
          name: 'Kasir Susi',
          role: 'CASHIER' as const,
        },
        accessToken: 'token-abc',
        refreshToken: 'refresh-xyz',
      })
    );

    render(<StaffLoginPage />);

    const usernameInput = screen.getByPlaceholderText(/Masukkan username staf/i);
    const passwordInput = screen.getByPlaceholderText(/Masukkan kata sandi/i);

    fireEvent.change(usernameInput, { target: { value: 'cashier' } });
    fireEvent.change(passwordInput, { target: { value: 'CashierPass123!' } });

    const submitBtn = screen.getByRole('button', { name: /Masuk ke Portal/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/cashier/tables');
    });
  });
});
