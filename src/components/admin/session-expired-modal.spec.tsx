import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionExpiredModal } from './session-expired-modal';
import { useAuthStore } from '@/store/use-auth-store';
import { createQueryWrapper } from '@/test/test-utils';
import { toast } from 'sonner';

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

describe('SessionExpiredModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('does not render when isReauthModalOpen is false', () => {
    const wrapper = createQueryWrapper();
    render(<SessionExpiredModal />, { wrapper });

    expect(screen.queryByText(/Sesi Staf Berakhir/i)).not.toBeInTheDocument();
  });

  it('renders modal with active user info when isReauthModalOpen is true', () => {
    useAuthStore.getState().setAuth(
      {
        id: 'u1',
        name: 'Budi Santoso',
        email: 'admin@menuscan.com',
        role: 'ADMIN',
      },
      'token-123'
    );
    useAuthStore.getState().openReauthModal();

    const wrapper = createQueryWrapper();
    render(<SessionExpiredModal />, { wrapper });

    expect(screen.getByText('Sesi Staf Berakhir')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText(/admin@menuscan.com \(ADMIN\)/i)).toBeInTheDocument();
  });

  it('toggles password visibility when eye icon is clicked', () => {
    useAuthStore.getState().openReauthModal();

    const wrapper = createQueryWrapper();
    render(<SessionExpiredModal />, { wrapper });

    const passwordInput = screen.getByPlaceholderText('Masukkan kata sandi...');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = passwordInput.nextElementSibling as HTMLButtonElement;
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'text');
      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  it('successfully relogins and closes modal on valid password submission', async () => {
    useAuthStore.getState().setAuth(
      {
        id: 'u1',
        name: 'Budi Santoso',
        email: 'admin@menuscan.com',
        role: 'ADMIN',
      },
      'token-123'
    );
    useAuthStore.getState().openReauthModal();

    const wrapper = createQueryWrapper();
    render(<SessionExpiredModal />, { wrapper });

    const passwordInput = screen.getByPlaceholderText('Masukkan kata sandi...');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: /Lanjutkan Sesi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isReauthModalOpen).toBe(false);
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Sesi berhasil diperpanjang')
      );
    });
  });

  it('handles relogin failure when password is wrong', async () => {
    useAuthStore.getState().setAuth(
      {
        id: 'u1',
        name: 'Budi Santoso',
        email: 'admin@menuscan.com',
        role: 'ADMIN',
      },
      'token-123'
    );
    useAuthStore.getState().openReauthModal();

    const wrapper = createQueryWrapper();
    render(<SessionExpiredModal />, { wrapper });

    const passwordInput = screen.getByPlaceholderText('Masukkan kata sandi...');
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    const submitBtn = screen.getByRole('button', { name: /Lanjutkan Sesi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isReauthModalOpen).toBe(true);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('logs out and redirects to login when Ganti Akun is clicked', () => {
    useAuthStore.getState().openReauthModal();

    const wrapper = createQueryWrapper();
    render(<SessionExpiredModal />, { wrapper });

    const logoutBtn = screen.getByRole('button', { name: /Ganti Akun/i });
    fireEvent.click(logoutBtn);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isReauthModalOpen).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith('/admin/login');
  });
});
