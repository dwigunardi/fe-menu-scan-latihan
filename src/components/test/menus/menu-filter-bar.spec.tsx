import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuFilterBar } from '@/components/menus/menu-filter-bar';
import { CategoryData } from '@/lib/validations/admin-menu.schema';

describe('MenuFilterBar Component', () => {
  const mockCategories: CategoryData[] = [
    {
      id: 'cat-1',
      name: 'Coffee',
      sortOrder: 1,
      _count: { menuItems: 5 },
      createdAt: '2022-01-01',
      updatedAt: '2022-01-01',
    },
    {
      id: 'cat-2',
      name: 'Pastry',
      sortOrder: 2,
      _count: { menuItems: 3 },
      createdAt: '2022-01-01',
      updatedAt: '2022-01-01',
    }
  ];

  it('renders search input and responds to typing', () => {
    const onSearchChange = vi.fn();
    render(
      <MenuFilterBar
        searchInput=""
        onSearchChange={onSearchChange}
        sortBy="name"
        onSortByChange={vi.fn()}
        sortOrder="asc"
        onToggleSortOrder={vi.fn()}
        categories={mockCategories}
        selectedCategory="ALL"
        onSelectCategory={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Cari menu/i);
    fireEvent.change(searchInput, { target: { value: 'Latte' } });

    expect(onSearchChange).toHaveBeenCalledWith('Latte');
  });

  it('triggers onSelectCategory when category badge is clicked', () => {
    const onSelectCategory = vi.fn();
    render(
      <MenuFilterBar
        searchInput=""
        onSearchChange={vi.fn()}
        sortBy="name"
        onSortByChange={vi.fn()}
        sortOrder="asc"
        onToggleSortOrder={vi.fn()}
        categories={mockCategories}
        selectedCategory="ALL"
        onSelectCategory={onSelectCategory}
      />
    );

    const coffeeBadge = screen.getByText('Coffee');
    fireEvent.click(coffeeBadge);

    expect(onSelectCategory).toHaveBeenCalledWith('cat-1');

    const allBadge = screen.getByText(/Semua Menu/i);
    fireEvent.click(allBadge);

    expect(onSelectCategory).toHaveBeenCalledWith('ALL');
  });

  it('renders sort directions and toggles sort order for different sort keys', () => {
    const onToggleSortOrder = vi.fn();
    const { rerender } = render(
      <MenuFilterBar
        searchInput=""
        onSearchChange={vi.fn()}
        sortBy="name"
        sortOrder="asc"
        onSortByChange={vi.fn()}
        onToggleSortOrder={onToggleSortOrder}
        categories={mockCategories}
        selectedCategory="ALL"
        onSelectCategory={vi.fn()}
      />
    );

    expect(screen.getByText('A → Z')).toBeInTheDocument();
    const sortToggleBtn = screen.getByRole('button', { name: /A → Z/i });
    fireEvent.click(sortToggleBtn);
    expect(onToggleSortOrder).toHaveBeenCalled();

    // Rerender with 'price' sort
    rerender(
      <MenuFilterBar
        searchInput=""
        onSearchChange={vi.fn()}
        sortBy="price"
        sortOrder="desc"
        onSortByChange={vi.fn()}
        onToggleSortOrder={onToggleSortOrder}
        categories={mockCategories}
        selectedCategory="ALL"
        onSelectCategory={vi.fn()}
      />
    );
    expect(screen.getByText('Termahal')).toBeInTheDocument();

    // Rerender with 'rating' sort
    rerender(
      <MenuFilterBar
        searchInput=""
        onSearchChange={vi.fn()}
        sortBy="rating"
        sortOrder="asc"
        onSortByChange={vi.fn()}
        onToggleSortOrder={onToggleSortOrder}
        categories={mockCategories}
        selectedCategory="ALL"
        onSelectCategory={vi.fn()}
      />
    );
    expect(screen.getByText('Terendah')).toBeInTheDocument();

    // Rerender with 'createdAt' sort
    rerender(
      <MenuFilterBar
        searchInput=""
        onSearchChange={vi.fn()}
        sortBy="createdAt"
        sortOrder="asc"
        onSortByChange={vi.fn()}
        onToggleSortOrder={onToggleSortOrder}
        categories={mockCategories}
        selectedCategory="ALL"
        onSelectCategory={vi.fn()}
      />
    );
    expect(screen.getByText('Terlama')).toBeInTheDocument();

    // Rerender with 'isAvailable' sort
    rerender(
      <MenuFilterBar
        searchInput=""
        onSearchChange={vi.fn()}
        sortBy="isAvailable"
        sortOrder="asc"
        onSortByChange={vi.fn()}
        onToggleSortOrder={onToggleSortOrder}
        categories={mockCategories}
        selectedCategory="ALL"
        onSelectCategory={vi.fn()}
      />
    );
    expect(screen.getByText('Habis Dulu')).toBeInTheDocument();
  });
});
