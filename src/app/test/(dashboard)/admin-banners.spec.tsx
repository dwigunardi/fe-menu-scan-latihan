import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminBannersPage from '@/app/(dashboard)/admin/banners/page';
import CreateBannerPage from '@/app/(dashboard)/admin/banners/create/page';
import { createQueryWrapper } from '@/test/test-utils';
import { useAuthStore } from '@/store/use-auth-store';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/admin/banners',
}));

describe('Admin Banners Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '1', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );
  });

  describe('AdminBannersPage (List & Management)', () => {
    it('renders page header, KPI stats, and banner cards', async () => {
      render(<AdminBannersPage />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText('Banner Promo Kafe')).toBeInTheDocument();
      expect(screen.getByText('Tambah Banner Baru')).toBeInTheDocument();

      // Wait for banner items from mockBanners to appear
      await waitFor(() => {
        expect(screen.getAllByText('Diskon Kopi 50% Weekend').length).toBeGreaterThan(0);
      });

      expect(screen.getAllByText('Sarapan Lezat Croissant').length).toBeGreaterThan(0);
      expect(screen.getByText('Total Banner')).toBeInTheDocument();
      expect(screen.getByText('Tayang Aktif')).toBeInTheDocument();
    });

    it('filters banners by search query', async () => {
      render(<AdminBannersPage />, {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(screen.getAllByText('Diskon Kopi 50% Weekend').length).toBeGreaterThan(0);
      });

      const searchInput = screen.getByPlaceholderText(/Cari judul promo/i);
      fireEvent.change(searchInput, { target: { value: 'Croissant' } });

      expect(screen.getAllByText('Sarapan Lezat Croissant').length).toBeGreaterThan(0);
      expect(screen.queryByText('Cashback 30% QRIS')).not.toBeInTheDocument();
    });

    it('triggers delete confirmation dialog when delete button is clicked', async () => {
      render(<AdminBannersPage />, {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => {
        expect(screen.getAllByText('Diskon Kopi 50% Weekend').length).toBeGreaterThan(0);
      });

      // Find all delete buttons
      const deleteButtons = screen.getAllByRole('button', { name: /Hapus Banner/i });
      expect(deleteButtons.length).toBeGreaterThan(0);

      fireEvent.click(deleteButtons[0]);

      // Confirmation dialog should open
      await waitFor(() => {
        expect(screen.getByText('Hapus Banner Promo?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Ya, Hapus Banner/i })).toBeInTheDocument();
      });
    });
  });

  describe('CreateBannerPage', () => {
    it('renders create banner form with preset sample buttons', () => {
      render(<CreateBannerPage />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText('Terbitkan Banner Promo Baru')).toBeInTheDocument();
      expect(screen.getByText(/Gambar Banner Promo/i)).toBeInTheDocument();
      expect(screen.getByText(/Live Customer Mobile Preview/i)).toBeInTheDocument();
    });
  });
});
