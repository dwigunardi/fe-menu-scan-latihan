import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthGuard } from '@/components/common/auth-guard';
import { useAuthStore } from '@/store/use-auth-store';

const mockReplace = vi.fn();
let currentPathname = '/admin/dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
  usePathname: () => currentPathname,
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
    currentPathname = '/admin/dashboard';
  });

  it('redirects to /login when user is not authenticated', () => {
    render(
      <AuthGuard>
        <div data-testid="protected-content">Dashboard Protected</div>
      </AuthGuard>
    );

    expect(mockReplace).toHaveBeenCalledWith('/login');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText(/Memverifikasi Akses Staf/i)).toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );

    render(
      <AuthGuard>
        <div data-testid="protected-content">Dashboard Protected</div>
      </AuthGuard>
    );

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('allows access without redirection when already on /login', () => {
    currentPathname = '/login';

    render(
      <AuthGuard>
        <div data-testid="login-content">Login Form</div>
      </AuthGuard>
    );

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByTestId('login-content')).toBeInTheDocument();
  });
});
