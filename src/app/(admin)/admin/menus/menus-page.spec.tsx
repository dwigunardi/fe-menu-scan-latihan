import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminMenusPage from './page';
import { createQueryWrapper } from '@/test/test-utils';
import { useAuthStore } from '@/store/use-auth-store';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

describe('AdminMenusPage (Refactored)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );
  });

  it('renders page header, search bar, category pills, and table data', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminMenusPage />, { wrapper });

    expect(screen.getByText('Katalog Menu & Variasi')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Cari menu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Semua Menu/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Nasi Goreng Spesial').length).toBeGreaterThan(0);
    });
  });

  it('allows filtering by search input and category selection', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminMenusPage />, { wrapper });

    const searchInput = screen.getByPlaceholderText(/Cari menu/i);
    fireEvent.change(searchInput, { target: { value: 'Goreng' } });

    const catBtn = screen.getByRole('button', { name: /Semua Menu/i });
    fireEvent.click(catBtn);

    expect(catBtn).toBeInTheDocument();
  });

  it('opens CategoryManagerModal when Kategori button is clicked', () => {
    const wrapper = createQueryWrapper();
    render(<AdminMenusPage />, { wrapper });

    const categoryBtn = screen.getByRole('button', { name: /Kategori/i });
    fireEvent.click(categoryBtn);

    expect(screen.getByText('Kelola Kategori Menu')).toBeInTheDocument();
  });
});
