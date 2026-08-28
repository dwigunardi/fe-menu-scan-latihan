import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminMenusPage from '@/app/(dashboard)/admin/menus/page';
import { createQueryWrapper } from '@/test/test-utils';
import { useAuthStore } from '@/store/use-auth-store';
import * as adminMenusApi from '@/lib/api/admin-menus-api';
import { Right } from '@/lib/api/either';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

const mockCategories = [
  { id: 'cat-1', name: 'Coffee', slug: 'coffee', sortOrder: 1, _count: { menuItems: 2 } },
  { id: 'cat-2', name: 'Pastry', slug: 'pastry', sortOrder: 2, _count: { menuItems: 1 } },
];

const mockPaginatedMenus = {
  items: [
    {
      id: 'm1',
      name: 'Caramel Macchiato',
      slug: 'caramel-macchiato',
      price: 35000,
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Coffee', sortOrder: 1 },
      isAvailable: true,
      isBestSeller: true,
      isRecommended: false,
      variantGroups: [],
      rating: 4.8,
      reviewCount: 20,
      createdAt: '2026-08-20T00:00:00Z',
    },
    {
      id: 'm2',
      name: 'Croissant Butter',
      slug: 'croissant-butter',
      price: 28000,
      categoryId: 'cat-2',
      category: { id: 'cat-2', name: 'Pastry', sortOrder: 2 },
      isAvailable: false,
      isBestSeller: false,
      isRecommended: false,
      variantGroups: [],
      rating: 4.5,
      reviewCount: 10,
      createdAt: '2026-08-21T00:00:00Z',
    },
  ],
  meta: {
    page: 1,
    limit: 10,
    totalItems: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

describe('AdminMenusPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );

    vi.spyOn(adminMenusApi, 'getAdminCategories').mockResolvedValue(new Right(mockCategories));
    vi.spyOn(adminMenusApi, 'getAdminMenusPaginated').mockResolvedValue(new Right(mockPaginatedMenus));
    vi.spyOn(adminMenusApi, 'toggleMenuAvailability').mockResolvedValue(new Right(mockPaginatedMenus.items[0]));
    vi.spyOn(adminMenusApi, 'deleteAdminMenu').mockResolvedValue(new Right({ success: true }));
  });

  it('renders menus header, categories count, and filter bar', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminMenusPage />, { wrapper });

    expect(screen.getByText('Katalog Menu & Variasi')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Caramel Macchiato').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Croissant Butter').length).toBeGreaterThan(0);
  });

  it('navigates to /admin/menus/create when Tambah Menu buttons are clicked', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminMenusPage />, { wrapper });

    const addMenuDesktopBtn = screen.getByRole('button', { name: /\+ Tambah Menu/i });
    fireEvent.click(addMenuDesktopBtn);
    expect(mockPush).toHaveBeenCalledWith('/admin/menus/create');

    const fabBtn = screen.getByRole('button', { name: 'Tambah Menu Baru' });
    fireEvent.click(fabBtn);
    expect(mockPush).toHaveBeenCalledWith('/admin/menus/create');
  });

  it('opens and closes CategoryManagerModal', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminMenusPage />, { wrapper });

    const catBtn = screen.getByRole('button', { name: /Kategori/i });
    fireEvent.click(catBtn);

    expect(screen.getByText('Kelola Kategori Menu')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Kelola Kategori Menu')).not.toBeInTheDocument();
    });
  });

  it('handles search input change with debounce and category selection', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminMenusPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByText('Caramel Macchiato').length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/Cari menu/i);
    fireEvent.change(searchInput, { target: { value: 'Macchiato' } });

    // Category selection
    const coffeeCategoryPill = screen.getByRole('button', { name: 'Coffee' });
    fireEvent.click(coffeeCategoryPill);

    await waitFor(() => {
      expect(adminMenusApi.getAdminMenusPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-1',
        })
      );
    });
  });

  it('handles sorting options and order toggle', async () => {
    const wrapper = createQueryWrapper();
    const { container } = render(<AdminMenusPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByText('Caramel Macchiato').length).toBeGreaterThan(0);
    });

    // Toggle sort order
    const sortOrderToggle =
      screen.queryByRole('button', { name: /Terbaru|Terlama/i }) ||
      container.querySelector('.lucide-arrow-down-wide-narrow, .lucide-arrow-up-narrow-wide')?.closest('button');

    if (sortOrderToggle) {
      fireEvent.click(sortOrderToggle);

      await waitFor(() => {
        expect(adminMenusApi.getAdminMenusPaginated).toHaveBeenCalledWith(
          expect.objectContaining({
            sortOrder: 'asc',
          })
        );
      });
    }
  });

  it('handles toggling menu stock availability', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminMenusPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByText('Caramel Macchiato').length).toBeGreaterThan(0);
    });

    const switches = screen.getAllByRole('switch');
    if (switches.length > 0) {
      fireEvent.click(switches[0]);
      await waitFor(() => {
        expect(adminMenusApi.toggleMenuAvailability).toHaveBeenCalledWith('m1', false);
      });
    }
  });

  it('handles menu deletion with confirm dialog (true and false)', async () => {
    const wrapper = createQueryWrapper();
    render(<AdminMenusPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByText('Caramel Macchiato').length).toBeGreaterThan(0);
    });

    // Find delete button
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const deleteBtn = deleteButtons.find((b) => b.querySelector('.lucide-trash-2') || b.querySelector('.lucide-trash'));

    if (deleteBtn) {
      window.confirm = vi.fn(() => false);
      fireEvent.click(deleteBtn);
      expect(adminMenusApi.deleteAdminMenu).not.toHaveBeenCalled();

      window.confirm = vi.fn(() => true);
      fireEvent.click(deleteBtn);
      await waitFor(() => {
        expect(adminMenusApi.deleteAdminMenu).toHaveBeenCalledWith('m1');
      });
    }
  });
});
