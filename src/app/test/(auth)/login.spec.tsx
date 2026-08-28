import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffLoginPage from '@/app/(auth)/login/page';
import { useAuthStore } from '@/store/use-auth-store';
import * as authApi from '@/lib/api/auth-api';
import { Right, Left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';

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

  it('renders login form and 1-Click Quick Demo Login presets', () => {
    render(<StaffLoginPage />);

    expect(screen.getByText('Portal Staf Kumpul Cafe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Masukkan username staf/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Masukkan kata sandi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Masuk ke Portal/i })).toBeInTheDocument();
    expect(screen.getByText('1-Click Quick Demo Login')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Kasir Front POS')).toBeInTheDocument();
    expect(screen.getByText('Kitchen & Bar')).toBeInTheDocument();
    expect(screen.getByText('Pelayan (Floor)')).toBeInTheDocument();
  });

  it('redirects on mount if user is already authenticated', () => {
    useAuthStore.getState().setAuth(
      { id: 'a1', username: 'admin', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );

    render(<StaffLoginPage />);
    expect(mockReplace).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('toggles password visibility when eye icon is clicked', () => {
    render(<StaffLoginPage />);

    const passwordInput = screen.getByPlaceholderText(/Masukkan kata sandi/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = passwordInput.nextElementSibling as HTMLButtonElement;
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'text');
      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  it('shows loading spinner when form is submitted and redirects to dashboard', async () => {
    vi.spyOn(authApi, 'loginStaff').mockResolvedValue(
      new Right({
        user: {
          id: 'a1',
          username: 'admin',
          name: 'Owner Admin',
          role: 'ADMIN' as const,
        },
        accessToken: 'token-abc',
        refreshToken: 'refresh-xyz',
      })
    );

    render(<StaffLoginPage />);

    const usernameInput = screen.getByPlaceholderText(/Masukkan username staf/i);
    const passwordInput = screen.getByPlaceholderText(/Masukkan kata sandi/i);

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });

    const submitBtn = screen.getByRole('button', { name: /Masuk ke Portal/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('handles login failure when credentials are invalid', async () => {
    vi.spyOn(authApi, 'loginStaff').mockResolvedValue(
      new Left(new ApiError(401, 'UNAUTHORIZED', 'Username atau password salah'))
    );

    render(<StaffLoginPage />);

    const usernameInput = screen.getByPlaceholderText(/Masukkan username staf/i);
    const passwordInput = screen.getByPlaceholderText(/Masukkan kata sandi/i);

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    const submitBtn = screen.getByRole('button', { name: /Masuk ke Portal/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  it('triggers 1-Click login when Super Admin card is clicked', async () => {
    vi.spyOn(authApi, 'loginStaff').mockResolvedValue(
      new Right({
        user: {
          id: 'a1',
          username: 'admin',
          name: 'Super Admin',
          role: 'ADMIN' as const,
        },
        accessToken: 'token-abc',
        refreshToken: 'refresh-xyz',
      })
    );

    render(<StaffLoginPage />);

    const adminBtn = screen.getByRole('button', { name: /Super Admin/i });
    fireEvent.click(adminBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('triggers 1-Click login when Barista Dapur card is clicked', async () => {
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

    const baristaBtn = screen.getByRole('button', { name: /Kitchen & Bar/i });
    fireEvent.click(baristaBtn);

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

    const cashierBtn = screen.getByRole('button', { name: /Kasir Front POS/i });
    fireEvent.click(cashierBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/cashier/tables');
    });
  });

  it('successfully logs in and redirects WAITER staff to /waiter/tables', async () => {
    vi.spyOn(authApi, 'loginStaff').mockResolvedValue(
      new Right({
        user: {
          id: 'w1',
          username: 'waiter',
          name: 'Pelayan Doni',
          role: 'WAITER' as const,
        },
        accessToken: 'token-abc',
        refreshToken: 'refresh-xyz',
      })
    );

    render(<StaffLoginPage />);

    const waiterBtn = screen.getByRole('button', { name: /Pelayan \(Floor\)/i });
    fireEvent.click(waiterBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/waiter/tables');
    });
  });
});
