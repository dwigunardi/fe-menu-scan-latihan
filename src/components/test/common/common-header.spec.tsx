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

  it('logs out and redirects to /login on Keluar button click', () => {
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

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
