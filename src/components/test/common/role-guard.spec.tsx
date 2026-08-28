import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleGuard } from '@/components/common/role-guard';
import { useAuthStore, ROLE } from '@/store/use-auth-store';

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
      { id: '1', username: 'admin', name: 'Admin', role: ROLE.ADMIN },
      'test-token'
    );

    render(
      <RoleGuard allowedRoles={[ROLE.ADMIN]}>
        <div data-testid="allowed-content">Admin Secret Area</div>
      </RoleGuard>
    );

    expect(screen.getByTestId('allowed-content')).toBeInTheDocument();
  });

  it('returns null when user is not authenticated or not hydrated', () => {
    const { container } = render(
      <RoleGuard allowedRoles={[ROLE.ADMIN]}>
        <div>Hidden Content</div>
      </RoleGuard>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders Access Denied banner and redirects kitchen staff to /kitchen/orders', () => {
    useAuthStore.getState().setAuth(
      { id: '2', username: 'kitchen', name: 'Kitchen Staff', role: ROLE.KITCHEN },
      'test-token'
    );

    render(
      <RoleGuard allowedRoles={[ROLE.ADMIN]}>
        <div>Admin Secret Area</div>
      </RoleGuard>
    );

    expect(screen.getByText('Akses Dibatasi')).toBeInTheDocument();
    expect(screen.getByText(/KITCHEN/i)).toBeInTheDocument();

    const returnBtn = screen.getByRole('button', { name: /Kembali ke Workstation/i });
    fireEvent.click(returnBtn);
    expect(mockReplace).toHaveBeenCalledWith('/kitchen/orders');
  });

  it('redirects cashier and waiter to their respective workstations', () => {
    // Cashier
    useAuthStore.getState().setAuth(
      { id: '3', username: 'cashier', name: 'Cashier Staff', role: ROLE.CASHIER },
      'test-token'
    );

    const { unmount } = render(
      <RoleGuard allowedRoles={[ROLE.ADMIN]}>
        <div>Admin Secret Area</div>
      </RoleGuard>
    );

    const returnBtnCashier = screen.getByRole('button', { name: /Kembali ke Workstation/i });
    fireEvent.click(returnBtnCashier);
    expect(mockReplace).toHaveBeenCalledWith('/cashier/tables');
    unmount();

    // Waiter
    useAuthStore.getState().setAuth(
      { id: '4', username: 'waiter', name: 'Waiter Staff', role: ROLE.WAITER },
      'test-token'
    );

    render(
      <RoleGuard allowedRoles={[ROLE.ADMIN]}>
        <div>Admin Secret Area</div>
      </RoleGuard>
    );

    const returnBtnWaiter = screen.getByRole('button', { name: /Kembali ke Workstation/i });
    fireEvent.click(returnBtnWaiter);
    expect(mockReplace).toHaveBeenCalledWith('/waiter/tables');
  });

  it('redirects to custom fallbackUrl when provided', () => {
    useAuthStore.getState().setAuth(
      { id: '5', username: 'guest', name: 'Staff', role: ROLE.KITCHEN },
      'test-token'
    );

    render(
      <RoleGuard allowedRoles={[ROLE.ADMIN]} fallbackUrl="/custom-unauthorized">
        <div>Admin Area</div>
      </RoleGuard>
    );

    expect(mockReplace).toHaveBeenCalledWith('/custom-unauthorized');
  });
});
