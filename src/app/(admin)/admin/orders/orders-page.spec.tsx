import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminOrdersPage from './page';
import { createQueryWrapper } from '@/test/test-utils';
import { useAuthStore } from '@/store/use-auth-store';

describe('AdminOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );
  });

  it('renders KPI metric cards and orders in Kanban view by default', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminOrdersPage />, { wrapper });

    expect(screen.getByText('Kitchen Display & Pesanan')).toBeInTheDocument();
    expect(screen.getByText('Total Pesanan')).toBeInTheDocument();
    expect(screen.getByText('Omzet Lunas')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ORD-20260820-001')).toBeInTheDocument();
    });
  });

  it('switches between Kanban view and Table view', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminOrdersPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('ORD-20260820-001')).toBeInTheDocument();
    });

    const tableViewBtn = screen.getByRole('button', { name: /Tabel Riwayat/i });
    fireEvent.click(tableViewBtn);

    expect(screen.getByText('Menu Pesanan')).toBeInTheDocument();
  });

  it('filters by status and searches order', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminOrdersPage />, { wrapper });

    const searchInput = screen.getByPlaceholderText(/Cari no. pesanan/i);
    fireEvent.change(searchInput, { target: { value: 'Budi' } });

    const pendingFilterBtn = screen.getByRole('button', { name: 'Masuk' });
    fireEvent.click(pendingFilterBtn);

    expect(pendingFilterBtn).toHaveClass('bg-amber-600');
  });

  it('toggles audio chime sound state', () => {
    const wrapper = createQueryWrapper();
    render(<AdminOrdersPage />, { wrapper });

    const soundBtn = screen.getByTitle('Suara Bel Aktif');
    fireEvent.click(soundBtn);

    expect(screen.getByText('Bisu')).toBeInTheDocument();
  });
});
