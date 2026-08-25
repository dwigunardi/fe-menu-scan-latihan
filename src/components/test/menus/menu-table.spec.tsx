import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuTable } from '@/components/menus/menu-table';
import { AdminMenuItem } from '@/lib/api/admin-menus-api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('MenuTable Component (Quick Sold-Out Switch)', () => {
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

  it('triggers onToggleStock callback when switch is clicked', () => {
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
  });
});
