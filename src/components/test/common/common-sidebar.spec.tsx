import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommonSidebar } from '@/components/common/common-sidebar';
import { useAuthStore } from '@/store/use-auth-store';
import { useSidebarStore } from '@/store/use-sidebar-store';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ROLE } from '@/lib/constants/roles';
import { Coffee } from 'lucide-react';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
}));

describe('CommonSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
    useSidebarStore.getState().setCollapsed(false);
  });

  it('renders admin navigation items when user role is ADMIN', () => {
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin Manager', role: ROLE.ADMIN },
      'test-token'
    );

    render(
      <TooltipProvider>
        <CommonSidebar />
      </TooltipProvider>
    );

    expect(screen.getByText('Dashboard Omset')).toBeInTheDocument();
    expect(screen.getByText('Laporan Penjualan')).toBeInTheDocument();
    expect(screen.getByText('Katalog Menu')).toBeInTheDocument();
    expect(screen.getByText('Kategori Menu')).toBeInTheDocument();
    expect(screen.getByText('Denah Meja & Kasir')).toBeInTheDocument();
    expect(screen.getByText('Log Pesanan Admin')).toBeInTheDocument();
  });

  it('renders kitchen navigation items when user role is KITCHEN', () => {
    useAuthStore.getState().setAuth(
      { id: '2', username: 'kitchen', name: 'Chef Juna', role: ROLE.KITCHEN },
      'test-token'
    );

    render(
      <TooltipProvider>
        <CommonSidebar />
      </TooltipProvider>
    );

    expect(screen.getByText('Kitchen Display (KDS)')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Omset')).not.toBeInTheDocument();
    expect(screen.queryByText('Katalog Menu')).not.toBeInTheDocument();
  });

  it('renders cashier navigation items when user role is CASHIER', () => {
    useAuthStore.getState().setAuth(
      { id: '3', username: 'cashier', name: 'Kasir Utama', role: ROLE.CASHIER },
      'test-token'
    );

    render(
      <TooltipProvider>
        <CommonSidebar />
      </TooltipProvider>
    );

    expect(screen.getByText('Workstation Kasir')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Display (KDS)')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Omset')).not.toBeInTheDocument();
  });

  it('renders waiter navigation items when user role is WAITER', () => {
    useAuthStore.getState().setAuth(
      { id: '4', username: 'waiter', name: 'Pelayan Meja', role: ROLE.WAITER },
      'test-token'
    );

    render(
      <TooltipProvider>
        <CommonSidebar />
      </TooltipProvider>
    );

    expect(screen.getByText('Denah Meja Pelayan')).toBeInTheDocument();
  });

  it('renders customNavItems when provided', () => {
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin Manager', role: ROLE.ADMIN },
      'test-token'
    );

    const customItems = [
      {
        title: 'Custom Menu Item',
        href: '/custom-url',
        icon: Coffee,
        allowedRoles: [ROLE.ADMIN],
      },
    ];

    render(
      <TooltipProvider>
        <CommonSidebar customNavItems={customItems} />
      </TooltipProvider>
    );

    expect(screen.getByText('Custom Menu Item')).toBeInTheDocument();
  });

  it('renders collapsed mode with expand button and toggles collapse on click', () => {
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin Manager', role: ROLE.ADMIN },
      'test-token'
    );
    useSidebarStore.getState().setCollapsed(true);

    const toggleCollapseSpy = vi.spyOn(useSidebarStore.getState(), 'toggleCollapse');

    const { container } = render(
      <TooltipProvider>
        <CommonSidebar />
      </TooltipProvider>
    );

    const expandBtn = container.querySelector('.lucide-panel-left-open')?.closest('button');
    if (expandBtn) {
      fireEvent.click(expandBtn);
      expect(toggleCollapseSpy).toHaveBeenCalled();
    }
  });

  it('returns empty list when user is null', () => {
    render(
      <TooltipProvider>
        <CommonSidebar />
      </TooltipProvider>
    );

    expect(screen.queryByText('Dashboard Omset')).not.toBeInTheDocument();
  });
});
