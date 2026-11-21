import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KioskLockGuard } from '@/components/kiosk/kiosk-lock-guard';
import { useKioskLockStore } from '@/store/use-kiosk-lock-store';
import { useAuthStore, ROLE, UserRole } from '@/store/use-auth-store';

const mockReplace = vi.fn();
let mockPathname = '/cashier/tables';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => mockPathname,
}));

function signInAs(role: UserRole) {
  useAuthStore.getState().setAuth({ id: 'user-1', name: 'Staf', role }, 'token');
}

function renderGuard() {
  render(
    <KioskLockGuard>
      <p>Halaman POS</p>
    </KioskLockGuard>
  );
}

describe('KioskLockGuard', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPathname = '/cashier/tables';
    signInAs(ROLE.CASHIER);
    useKioskLockStore.setState({ isLocked: false });
  });

  it('renders the page normally when the kiosk is not locked', () => {
    renderGuard();

    expect(screen.getByText('Halaman POS')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('sends a locked device back to the kiosk and hides the page', () => {
    useKioskLockStore.setState({ isLocked: true });

    renderGuard();

    expect(screen.queryByText('Halaman POS')).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/cashier/kiosk');
  });

  it('lets a locked device stay on the kiosk page', () => {
    useKioskLockStore.setState({ isLocked: true });
    mockPathname = '/cashier/kiosk';

    renderGuard();

    expect(screen.getByText('Halaman POS')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not trap roles that cannot open the kiosk', () => {
    useKioskLockStore.setState({ isLocked: true });
    signInAs(ROLE.KITCHEN);
    mockPathname = '/kitchen/orders';

    renderGuard();

    expect(screen.getByText('Halaman POS')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
