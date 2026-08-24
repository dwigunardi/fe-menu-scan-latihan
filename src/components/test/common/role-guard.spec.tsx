import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleGuard } from '@/components/common/role-guard';
import { useAuthStore } from '@/store/use-auth-store';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

describe('RoleGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('renders children when user role matches allowed roles', () => {
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );

    render(
      <RoleGuard allowedRoles={['ADMIN']}>
        <div data-testid="allowed-content">Admin Secret Area</div>
      </RoleGuard>
    );

    expect(screen.getByTestId('allowed-content')).toBeInTheDocument();
  });

  it('renders Access Denied banner when user role is not authorized', () => {
    useAuthStore.getState().setAuth(
      { id: '2', username: 'kitchen', name: 'Kitchen Staff', role: 'KITCHEN' },
      'test-token'
    );

    render(
      <RoleGuard allowedRoles={['ADMIN']}>
        <div data-testid="allowed-content">Admin Secret Area</div>
      </RoleGuard>
    );

    expect(screen.queryByTestId('allowed-content')).not.toBeInTheDocument();
    expect(screen.getByText('Akses Dibatasi')).toBeInTheDocument();
    expect(screen.getByText(/KITCHEN/i)).toBeInTheDocument();

    const returnBtn = screen.getByRole('button', { name: /Kembali ke Workstation/i });
    fireEvent.click(returnBtn);
    expect(mockReplace).toHaveBeenCalledWith('/kitchen/orders');
  });
});
