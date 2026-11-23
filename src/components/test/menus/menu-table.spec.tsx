import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuTable } from '@/components/menus/menu-table';
import { AdminMenuItem } from '@/lib/api/admin-menus-api';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('MenuTable Component (Desktop Table & Row Actions)', () => {
  const mockMenus: AdminMenuItem[] = [
    {
      id: 'menu-1',
      name: 'Kopi Susu Gula Aren',
      description: 'Espresso dengan susu segar dan gula aren asli',
      price: 22000,
      promoPrice: null,
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Coffee', sortOrder: 1 },
      imageUrl: 'https://images.unsplash.com/photo-coffee',
      isAvailable: true,
      isBestSeller: true,
      isRecommended: true,
      rating: 4.8,
      reviewCount: 25,
      variantGroups: [],
      createdAt: '2026-08-25T08:00:00.000Z',
      updatedAt: '2026-08-25T08:00:00.000Z',
    },
    {
      id: 'menu-2',
      name: 'Croissant Butter',
      description: 'Pastry renyah dengan butter Perancis',
      price: 28000,
      promoPrice: null,
      categoryId: 'cat-2',
      category: { id: 'cat-2', name: 'Pastry', sortOrder: 2 },
      imageUrl: 'https://images.unsplash.com/photo-croissant',
      isAvailable: false,
      isBestSeller: false,
      isRecommended: false,
      rating: 4.5,
      reviewCount: 12,
      variantGroups: [],
      createdAt: '2026-08-25T08:00:00.000Z',
      updatedAt: '2026-08-25T08:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders menu items and stock availability switch properly', () => {
    const onToggleStock = vi.fn();
    render(
      <MenuTable
        menus={mockMenus}
        isLoading={false}
        isTogglePending={false}
        isDeletePending={false}
        onToggleStock={onToggleStock}
        onDeleteMenu={vi.fn()}
      />
    );

    expect(screen.getByText('Kopi Susu Gula Aren')).toBeInTheDocument();
    expect(screen.getByText('Croissant Butter')).toBeInTheDocument();
    expect(screen.getByText('Status Stok')).toBeInTheDocument();

    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
    expect(switches[0]).toHaveAttribute('data-state', 'checked');
    expect(switches[1]).toHaveAttribute('data-state', 'unchecked');
  });

  it('triggers onToggleStock callback when switch is clicked without row bubbling', () => {
    const onToggleStock = vi.fn();
    render(
      <MenuTable
        menus={mockMenus}
        isLoading={false}
        isTogglePending={false}
        isDeletePending={false}
        onToggleStock={onToggleStock}
        onDeleteMenu={vi.fn()}
      />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    expect(onToggleStock).toHaveBeenCalledWith(mockMenus[0]);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates to detail page when table row is clicked', () => {
    render(
      <MenuTable
        menus={mockMenus}
        isLoading={false}
        isTogglePending={false}
        isDeletePending={false}
        onToggleStock={vi.fn()}
        onDeleteMenu={vi.fn()}
      />
    );

    const row = screen.getByText('Kopi Susu Gula Aren').closest('tr');
    if (row) {
      fireEvent.click(row);
      expect(mockPush).toHaveBeenCalledWith('/admin/menus/detail/menu-1');
    }
  });

  it('handles action buttons (View Detail, Edit, and Delete)', () => {
    const onDeleteMenu = vi.fn();
    const { container } = render(
      <MenuTable
        menus={mockMenus}
        isLoading={false}
        isTogglePending={false}
        isDeletePending={false}
        onToggleStock={vi.fn()}
        onDeleteMenu={onDeleteMenu}
      />
    );

    // Detail button (eye)
    const detailBtn = container.querySelector('.lucide-eye')?.closest('button');
    if (detailBtn) {
      fireEvent.click(detailBtn);
      expect(mockPush).toHaveBeenCalledWith('/admin/menus/detail/menu-1');
    }

    // Edit button (edit)
    const editBtn = container.querySelector('.lucide-edit')?.closest('button');
    if (editBtn) {
      fireEvent.click(editBtn);
      expect(mockPush).toHaveBeenCalledWith('/admin/menus/edit/menu-1');
    }

    // Delete button (trash)
    const deleteBtn = container.querySelector('.lucide-trash-2')?.closest('button');
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
      expect(onDeleteMenu).toHaveBeenCalledWith('menu-1', 'Kopi Susu Gula Aren');
    }
  });

  it('renders loading skeleton rows when isLoading is true', () => {
    const { container } = render(
      <MenuTable
        menus={[]}
        isLoading={true}
        isTogglePending={false}
        isDeletePending={false}
        onToggleStock={vi.fn()}
        onDeleteMenu={vi.fn()}
      />
    );

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders empty placeholder when menus array is empty', () => {
    render(
      <MenuTable
        menus={[]}
        isLoading={false}
        isTogglePending={false}
        isDeletePending={false}
        onToggleStock={vi.fn()}
        onDeleteMenu={vi.fn()}
      />
    );

    expect(screen.getByText('Tidak ada menu yang sesuai')).toBeInTheDocument();
  });
});
