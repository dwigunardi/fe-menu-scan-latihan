import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommonSidebar } from '@/components/common/common-sidebar';
import { useAuthStore } from '@/store/use-auth-store';
import { TooltipProvider } from '@/components/ui/tooltip';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
}));

describe('CommonSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('renders admin navigation items when user role is ADMIN', () => {
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin Manager', role: 'ADMIN' },
      'test-token'
    );

    render(
      <TooltipProvider>
        <CommonSidebar />
      </TooltipProvider>
    );

    expect(screen.getByText('Dashboard Omset')).toBeInTheDocument();
    expect(screen.getByText('Katalog Menu')).toBeInTheDocument();
    expect(screen.getByText('Kategori Menu')).toBeInTheDocument();
    expect(screen.getByText('Denah Meja & Kasir')).toBeInTheDocument();
    expect(screen.getByText('Log Pesanan Admin')).toBeInTheDocument();
  });

  it('renders kitchen navigation items when user role is KITCHEN', () => {
    useAuthStore.getState().setAuth(
      { id: '2', username: 'kitchen', name: 'Chef Juna', role: 'KITCHEN' },
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
      { id: '3', username: 'cashier', name: 'Kasir Utama', role: 'CASHIER' },
      'test-token'
    );

    render(
      <TooltipProvider>
        <CommonSidebar />
      </TooltipProvider>
    );

    expect(screen.getByText('Denah Meja & Kasir')).toBeInTheDocument();
    expect(screen.getByText('Monitor Antrean KDS')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Omset')).not.toBeInTheDocument();
  });
});
