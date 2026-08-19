import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryManagerModal } from './category-manager-modal';
import { renderWithProviders } from '../../test/test-utils';
import { CategoryData } from '@/lib/validations/admin-menu.schema';

describe('CategoryManagerModal', () => {
  const mockCategories: CategoryData[] = [
    {
      id: 'cat-1',
      name: 'Makanan Utama',
      slug: 'makanan-utama',
      sortOrder: 1,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'cat-2',
      name: 'Minuman Segar',
      slug: 'minuman-segar',
      sortOrder: 2,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn();
  });

  it('renders modal title and list of existing categories when open', () => {
    renderWithProviders(
      <CategoryManagerModal
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('Kelola Kategori Menu')).toBeInTheDocument();
    expect(screen.getByText('Makanan Utama')).toBeInTheDocument();
    expect(screen.getByText('Minuman Segar')).toBeInTheDocument();
    expect(screen.getByText(/Daftar Kategori \(2\)/i)).toBeInTheDocument();
  });

  it('disables submit button when input is empty', () => {
    renderWithProviders(
      <CategoryManagerModal
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /tambah/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button and allows submission when typing category name', async () => {
    const user = userEvent.setup();
    const handleRefresh = vi.fn();

    renderWithProviders(
      <CategoryManagerModal
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        onRefresh={handleRefresh}
      />
    );

    const input = screen.getByPlaceholderText(/Nama Kategori Baru/i);
    const submitBtn = screen.getByRole('button', { name: /tambah/i });

    await user.type(input, 'Snack Ringan');
    expect(submitBtn).toBeEnabled();

    await user.click(submitBtn);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('does nothing when user cancels category deletion dialog', async () => {
    const user = userEvent.setup();
    const handleRefresh = vi.fn();
    window.confirm = vi.fn(() => false);

    renderWithProviders(
      <CategoryManagerModal
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        onRefresh={handleRefresh}
      />
    );

    const deleteButtons = screen.getAllByTitle('Hapus Kategori');
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Makanan Utama'));
    expect(handleRefresh).not.toHaveBeenCalled();
  });

  it('deletes category and calls onRefresh when user confirms deletion', async () => {
    const user = userEvent.setup();
    const handleRefresh = vi.fn();
    window.confirm = vi.fn(() => true);

    renderWithProviders(
      <CategoryManagerModal
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        onRefresh={handleRefresh}
      />
    );

    const deleteButtons = screen.getAllByTitle('Hapus Kategori');
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(handleRefresh).toHaveBeenCalled();
    });
  });
});
