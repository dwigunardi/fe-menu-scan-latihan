import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommonHeader } from '@/components/common/common-header';
import { useAuthStore } from '@/store/use-auth-store';
import { TooltipProvider } from '@/components/ui/tooltip';

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

const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
  }),
}));

describe('CommonHeader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('renders portal breadcrumb and user details', () => {
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Chef Gordon', role: 'ADMIN' },
      'test-token'
    );

    render(
      <TooltipProvider>
        <CommonHeader breadcrumb="KDS Monitor" />
      </TooltipProvider>
    );

    expect(screen.getByText('KDS Monitor')).toBeInTheDocument();
    expect(screen.getByText('Chef Gordon')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('opens confirmation modal on Keluar button click and cancels logout when Batal is clicked', () => {
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Chef Gordon', role: 'ADMIN' },
      'test-token'
    );

    render(
      <TooltipProvider>
        <CommonHeader />
      </TooltipProvider>
    );

    const logoutBtn = screen.getByRole('button', { name: /Keluar/i });
    fireEvent.click(logoutBtn);

    // Modal should be open
    expect(screen.getByText('Konfirmasi Keluar Akun')).toBeInTheDocument();

    // Click Batal
    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('confirms logout and redirects to /login when Ya, Keluar Akun is clicked', () => {
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Chef Gordon', role: 'ADMIN' },
      'test-token'
    );

    render(
      <TooltipProvider>
        <CommonHeader />
      </TooltipProvider>
    );

    const logoutBtn = screen.getByRole('button', { name: /Keluar/i });
    fireEvent.click(logoutBtn);

    const confirmBtn = screen.getByRole('button', { name: /Ya, Keluar Akun/i });
    fireEvent.click(confirmBtn);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
