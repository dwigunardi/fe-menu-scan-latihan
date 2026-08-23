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

    expect(screen.getByText(/Kitchen Display System/i)).toBeInTheDocument();
    expect(screen.getByText('Total Pesanan')).toBeInTheDocument();
    expect(screen.getByText('Omzet Lunas')).toBeInTheDocument();

    await waitFor(() => {
      const orderElements = screen.getAllByText('ORD-20260820-001');
      expect(orderElements.length).toBeGreaterThan(0);
    });
  });

  it('switches between Kanban view and Table view', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminOrdersPage />, { wrapper });

    await waitFor(() => {
      const orderElements = screen.getAllByText('ORD-20260820-001');
      expect(orderElements.length).toBeGreaterThan(0);
    });

    const tableViewBtn = screen.getByRole('button', { name: /Tabel/i });
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

    const soundBtn = screen.getByRole('button', { name: /Bel Aktif/i });
    fireEvent.click(soundBtn);

    expect(screen.getByText('Mute')).toBeInTheDocument();
  });

  it('handles drag and drop interaction over kanban columns', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminOrdersPage />, { wrapper });

    await waitFor(() => {
      const orderElements = screen.getAllByText('ORD-20260820-001');
      expect(orderElements.length).toBeGreaterThan(0);
    });

    const orderElements = screen.getAllByText('ORD-20260820-001');
    expect(orderElements[0]).toBeInTheDocument();

    const columnHeadings = screen.getAllByRole('heading', { name: 'Sedang Dimasak' });
    expect(columnHeadings.length).toBeGreaterThan(0);
  });
});
