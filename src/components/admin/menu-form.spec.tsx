import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MenuForm } from './menu-form';
import { renderWithProviders } from '../../test/test-utils';
import { CategoryData } from '@/lib/validations/admin-menu.schema';
import { toast } from 'sonner';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:5000/api/v1';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MenuForm Component', () => {
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
  });

  it('renders form in Create mode and displays live customer card preview', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MenuForm categories={mockCategories} mode="create" />
    );

    expect(screen.getByText('Tambah Menu Baru')).toBeInTheDocument();
    expect(screen.getByText('Pratinjau Tampilan Pelanggan')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nama Menu/i);
    await user.type(nameInput, 'Nasi Bakar Cumi');

    // Live preview should immediately reflect the typed name
    expect(screen.getByRole('heading', { name: 'Nasi Bakar Cumi' })).toBeInTheDocument();
  });

  it('reflects promo price in live preview when promoPrice is lower than price', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MenuForm categories={mockCategories} mode="create" />
    );

    const priceInput = screen.getByLabelText(/Harga Normal/i);
    await user.clear(priceInput);
    await user.type(priceInput, '30000');

    const promoInput = screen.getByLabelText(/Harga Promo/i);
    await user.type(promoInput, '25000');

    expect(screen.getByText(/Rp 25.000/i)).toBeInTheDocument();
  });

  it('switches to Variants tab and allows adding, editing, and removing variant groups & options', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MenuForm categories={mockCategories} mode="create" />
    );

    // Switch to Variants tab
    const variantsTab = screen.getByRole('tab', { name: /Variasi & Topping/i });
    await user.click(variantsTab);

    // Click quick default group creation
    const defaultGroupBtn = await screen.findByRole('button', { name: /\+ Buat Grup Ukuran Default/i });
    await user.click(defaultGroupBtn);

    expect(screen.getByDisplayValue('Ukuran Cup')).toBeInTheDocument();

    // Add an option to the group
    const addOptionBtn = screen.getByRole('button', { name: /Tambah Opsi/i });
    await user.click(addOptionBtn);

    // Remove the group
    const removeGroupBtn = screen.getByRole('button', { name: /Hapus Grup/i });
    await user.click(removeGroupBtn);

    expect(screen.queryByDisplayValue('Ukuran Cup')).not.toBeInTheDocument();
  }, 15000);

  it('navigates back to /admin/menus when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MenuForm categories={mockCategories} mode="create" />
    );

    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    await user.click(cancelBtn);

    expect(mockPush).toHaveBeenCalledWith('/admin/menus');
  });

  it('submits successfully in Create mode and navigates to /admin/menus', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MenuForm categories={mockCategories} mode="create" />
    );

    const nameInput = screen.getByLabelText(/Nama Menu/i);
    await user.type(nameInput, 'Kopi Susu Caramel');

    const submitBtn = screen.getByRole('button', { name: /Terbitkan Menu/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Kopi Susu Caramel')
      );
      expect(mockPush).toHaveBeenCalledWith('/admin/menus');
    });
  });

  it('handles API error when create submission fails', async () => {
    server.use(
      http.post(`${API_BASE}/admin/menus`, () => {
        return HttpResponse.json({ message: 'Server database failure' }, { status: 500 });
      })
    );

    const user = userEvent.setup();

    renderWithProviders(
      <MenuForm categories={mockCategories} mode="create" />
    );

    const nameInput = screen.getByLabelText(/Nama Menu/i);
    await user.type(nameInput, 'Menu Gagal');

    const submitBtn = screen.getByRole('button', { name: /Terbitkan Menu/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('renders with initial values in Edit mode and updates menu on submit', async () => {
    const user = userEvent.setup();

    const initialMenu = {
      id: 'menu-1',
      name: 'Nasi Goreng Spesial',
      description: 'Nasi goreng lezat',
      price: 35000,
      promoPrice: null,
      imageUrl: '',
      rating: 4.8,
      reviewCount: 10,
      isAvailable: true,
      isBestSeller: true,
      isRecommended: false,
      categoryId: 'cat-1',
      variantGroups: [],
    };

    renderWithProviders(
      <MenuForm initialData={initialMenu} categories={mockCategories} mode="edit" />
    );

    expect(screen.getByText('Edit Menu: Nasi Goreng Spesial')).toBeInTheDocument();

    const priceInput = screen.getByLabelText(/Harga Normal/i);
    await user.clear(priceInput);
    await user.type(priceInput, '38000');

    const submitBtn = screen.getByRole('button', { name: /Simpan Perubahan/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil diperbarui')
      );
      expect(mockPush).toHaveBeenCalledWith('/admin/menus');
    });
  });

  it('handles API error when update submission fails', async () => {
    server.use(
      http.put(`${API_BASE}/admin/menus/:id`, () => {
        return HttpResponse.json({ message: 'Update failed' }, { status: 500 });
      })
    );

    const user = userEvent.setup();

    const initialMenu = {
      id: 'menu-1',
      name: 'Nasi Goreng Spesial',
      description: 'Nasi goreng lezat',
      price: 35000,
      promoPrice: null,
      imageUrl: '',
      rating: 4.8,
      reviewCount: 10,
      isAvailable: true,
      isBestSeller: true,
      isRecommended: false,
      categoryId: 'cat-1',
      variantGroups: [],
    };

    renderWithProviders(
      <MenuForm initialData={initialMenu} categories={mockCategories} mode="edit" />
    );

    const submitBtn = screen.getByRole('button', { name: /Simpan Perubahan/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
