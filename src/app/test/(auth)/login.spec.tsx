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

  it('renders login form and 1-Click Quick Demo Login presets', () => {
    render(<StaffLoginPage />);

    expect(screen.getByText('Portal Staf Kumpul Cafe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Masukkan username staf/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Masukkan kata sandi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Masuk ke Portal/i })).toBeInTheDocument();
    expect(screen.getByText('1-Click Quick Demo Login')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Kasir Meja')).toBeInTheDocument();
    expect(screen.getByText('Barista Dapur')).toBeInTheDocument();
    expect(screen.getByText('Pelayan')).toBeInTheDocument();
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

    const baristaBtn = screen.getByRole('button', { name: /Barista Dapur/i });
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

    const cashierBtn = screen.getByRole('button', { name: /Kasir Meja/i });
    fireEvent.click(cashierBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/cashier/tables');
    });
  });
});
