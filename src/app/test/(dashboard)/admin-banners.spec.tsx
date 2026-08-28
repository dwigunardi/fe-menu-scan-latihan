import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminBannersPage from '@/app/(dashboard)/admin/banners/page';
import CreateBannerPage from '@/app/(dashboard)/admin/banners/create/page';
import { createQueryWrapper } from '@/test/test-utils';
import { useAuthStore } from '@/store/use-auth-store';
import * as bannerHooks from '@/hooks/queries/use-admin-banners';
import { BannerData } from '@/lib/validations/banner.schema';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/admin/banners',
}));

const mockBannersList: BannerData[] = [
  {
    id: 'ban-1',
    title: 'Diskon Kopi 50% Weekend',
    description: 'Promo akhir pekan',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
    targetUrl: '/menu',
    sortOrder: 1,
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'ban-2',
    title: 'Sarapan Lezat Croissant',
    description: 'Promo pagi hemat',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
    targetUrl: '/menu?cat=pastry',
    sortOrder: 2,
    isActive: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

describe('Admin Banners Pages', () => {
  const mockToggleMutate = vi.fn();
  const mockDeleteMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '1', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );

    vi.spyOn(bannerHooks, 'useAdminBannersQuery').mockReturnValue({
      data: mockBannersList,
      isLoading: false,
    } as any);

    vi.spyOn(bannerHooks, 'useToggleBannerStatusMutation').mockReturnValue({
      mutateAsync: mockToggleMutate,
      isPending: false,
    } as any);

    vi.spyOn(bannerHooks, 'useDeleteBannerMutation').mockReturnValue({
      mutateAsync: mockDeleteMutate,
      isPending: false,
    } as any);
  });

  describe('AdminBannersPage (List & Management)', () => {
    it('renders page header, KPI stats, and banner cards', async () => {
      render(<AdminBannersPage />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText('Banner Promo Kafe')).toBeInTheDocument();
      expect(screen.getByText('Tambah Banner Baru')).toBeInTheDocument();

      expect(screen.getAllByText('Diskon Kopi 50% Weekend').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Sarapan Lezat Croissant').length).toBeGreaterThan(0);
      expect(screen.getByText('Total Banner')).toBeInTheDocument();
      expect(screen.getByText('Tayang Aktif')).toBeInTheDocument();
    });

    it('filters banners by search query and status filter buttons (All, Active, Inactive)', async () => {
      render(<AdminBannersPage />, {
        wrapper: createQueryWrapper(),
      });

      const searchInput = screen.getByPlaceholderText(/Cari judul promo/i);
      fireEvent.change(searchInput, { target: { value: 'Croissant' } });
      expect(screen.getByText('/menu?cat=pastry')).toBeInTheDocument();
      expect(screen.queryByText('/menu')).not.toBeInTheDocument();

      // Reset search
      fireEvent.change(searchInput, { target: { value: '' } });

      // Click Tayang filter
      const activeFilterBtn = screen.getByRole('button', { name: /Tayang/i });
      fireEvent.click(activeFilterBtn);
      expect(screen.getByText('/menu')).toBeInTheDocument();
      expect(screen.queryByText('/menu?cat=pastry')).not.toBeInTheDocument();

      // Click Draft filter
      const draftFilterBtn = screen.getByRole('button', { name: /Draft/i });
      fireEvent.click(draftFilterBtn);
      expect(screen.getByText('/menu?cat=pastry')).toBeInTheDocument();
      expect(screen.queryByText('/menu')).not.toBeInTheDocument();

      // Click Semua filter
      const allFilterBtn = screen.getByRole('button', { name: /Semua/i });
      fireEvent.click(allFilterBtn);
      expect(screen.getByText('/menu')).toBeInTheDocument();
      expect(screen.getByText('/menu?cat=pastry')).toBeInTheDocument();
    });

    it('toggles banner status switch button', async () => {
      mockToggleMutate.mockResolvedValue({ success: true });
      render(<AdminBannersPage />, {
        wrapper: createQueryWrapper(),
      });

      const toggleBtn = screen.getByRole('button', { name: /^Aktif$/ });
      fireEvent.click(toggleBtn);
      await waitFor(() => {
        expect(mockToggleMutate).toHaveBeenCalledWith({ id: 'ban-1', isActive: false });
      });
    });

    it('handles delete confirmation modal flow (confirm and cancel)', async () => {
      mockDeleteMutate.mockResolvedValue({ success: true });
      render(<AdminBannersPage />, {
        wrapper: createQueryWrapper(),
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Hapus Banner/i });
      expect(deleteButtons.length).toBeGreaterThan(0);

      // Open delete dialog
      fireEvent.click(deleteButtons[0]);
      expect(screen.getByText('Hapus Banner Promo?')).toBeInTheDocument();

      // Cancel delete
      const cancelBtn = screen.getByRole('button', { name: 'Batal' });
      fireEvent.click(cancelBtn);
      expect(screen.queryByText('Hapus Banner Promo?')).not.toBeInTheDocument();

      // Re-open and confirm delete
      fireEvent.click(deleteButtons[0]);
      const confirmBtn = screen.getByRole('button', { name: /Ya, Hapus Banner/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockDeleteMutate).toHaveBeenCalledWith({
          id: 'ban-1',
          title: 'Diskon Kopi 50% Weekend',
        });
      });
    });

    it('renders empty state when no banners match search or when list is empty', () => {
      vi.spyOn(bannerHooks, 'useAdminBannersQuery').mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      render(<AdminBannersPage />, {
        wrapper: createQueryWrapper(),
      });

      expect(screen.getByText('Belum Ada Banner Promo')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tambah Banner Sekarang/i })).toBeInTheDocument();
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
