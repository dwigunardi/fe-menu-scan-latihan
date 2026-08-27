import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BannerForm } from '@/components/banners/banner-form';
import { BannerImageUploader } from '@/components/banners/banner-image-uploader';
import { PromoCarousel } from '@/components/banners/promo-carousel';
import { BannerData } from '@/lib/validations/banner.schema';
import * as bannerHooks from '@/hooks/queries/use-admin-banners';
import * as mediaApi from '@/lib/api/media-api';
import { right } from '@/lib/api/either';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/api/media-api', () => ({
  uploadMediaImage: vi.fn(),
}));

const mockBanners: BannerData[] = [
  {
    id: 'b-1',
    title: 'Diskon Kopi 50%',
    description: 'Promo spesial akhir pekan kopi susu gula aren',
    imageUrl: '/banners/banner-coffee.jpg',
    targetUrl: '/menu?category=coffee',
    sortOrder: 1,
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'b-2',
    title: 'Cashback QRIS 30%',
    description: 'Bayar pakai QRIS hemat 30%',
    imageUrl: '/banners/banner-qris.jpg',
    targetUrl: '/menu',
    sortOrder: 2,
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

describe('Banner Components', () => {
  const mockCreateMutate = vi.fn();
  const mockUpdateMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(bannerHooks, 'useCreateBannerMutation').mockReturnValue({
      mutateAsync: mockCreateMutate,
      isPending: false,
    } as any);

    vi.spyOn(bannerHooks, 'useUpdateBannerMutation').mockReturnValue({
      mutateAsync: mockUpdateMutate,
      isPending: false,
    } as any);

    vi.spyOn(bannerHooks, 'usePublicBannersQuery').mockReturnValue({
      data: mockBanners,
      isLoading: false,
    } as any);

    vi.mocked(mediaApi.uploadMediaImage).mockResolvedValue(
      right({
        url: '/banners/banner-coffee.jpg', filename: 'banner.jpg', size: 1000, mimeType: 'image/jpeg',
        width: 1920, height: 1080
      })
    );
  });

  describe('BannerForm', () => {
    it('renders form in create mode and submits new banner', async () => {
      mockCreateMutate.mockResolvedValue({});

      render(<BannerForm mode="create" />);

      // Select preset
      const presetTab = screen.getByRole('button', { name: /Contoh Preset/i });
      fireEvent.click(presetTab);

      const presetBtn = screen.getByText('☕ Buy 1 Get 1 Kopi');
      fireEvent.click(presetBtn);

      const titleInput = screen.getByPlaceholderText(/Contoh: Buy 1 Get 1 Signature Espresso Blend/i);
      fireEvent.change(titleInput, { target: { value: 'Super Promo Kemerdekaan' } });

      const descInput = screen.getByPlaceholderText(/Berlaku setiap Senin/i);
      fireEvent.change(descInput, { target: { value: 'Diskon 50% seluruh menu makanan' } });

      const submitBtn = screen.getByRole('button', { name: /Terbitkan Banner/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Super Promo Kemerdekaan',
            imageUrl: expect.stringContaining('banner-coffee.jpg'),
          })
        );
        expect(mockPush).toHaveBeenCalledWith('/admin/banners');
      });
    });

    it('renders form in edit mode with initial data and updates banner', async () => {
      mockUpdateMutate.mockResolvedValue({});

      render(<BannerForm mode="edit" initialData={mockBanners[0]} />);

      expect(screen.getByDisplayValue('Diskon Kopi 50%')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Promo spesial akhir pekan kopi susu gula aren')).toBeInTheDocument();

      const titleInput = screen.getByDisplayValue('Diskon Kopi 50%');
      fireEvent.change(titleInput, { target: { value: 'Diskon Kopi 70% Dahsyat' } });

      const submitBtn = screen.getByRole('button', { name: /Simpan Perubahan/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockUpdateMutate).toHaveBeenCalledWith({
          id: 'b-1',
          payload: expect.objectContaining({
            title: 'Diskon Kopi 70% Dahsyat',
          }),
        });
        expect(mockPush).toHaveBeenCalledWith('/admin/banners');
      });
    });
  });

  describe('BannerImageUploader', () => {
    it('switches between Upload, Contoh Preset, and Paste URL tabs', () => {
      const onChange = vi.fn();
      render(
        <BannerImageUploader
          value="/banners/banner-coffee.jpg"
          onChange={onChange}
        />
      );

      const presetTab = screen.getByRole('button', { name: /Contoh Preset/i });
      fireEvent.click(presetTab);
      expect(screen.getByText('☕ Buy 1 Get 1 Kopi')).toBeInTheDocument();

      const urlTab = screen.getByRole('button', { name: /Paste URL/i });
      fireEvent.click(urlTab);

      expect(screen.getByPlaceholderText(/https:\/\/images.unsplash.com/i)).toBeInTheDocument();
    });
  });

  describe('PromoCarousel', () => {
    it('renders promo carousel slides and navigates with next and prev buttons', () => {
      render(<PromoCarousel initialBanners={mockBanners} />);

      expect(screen.getByText('Diskon Kopi 50%')).toBeInTheDocument();

      const nextBtn = screen.getByRole('button', { name: /Next Banner/i });
      fireEvent.click(nextBtn);

      expect(screen.getByText('Cashback QRIS 30%')).toBeInTheDocument();

      const prevBtn = screen.getByRole('button', { name: /Previous Banner/i });
      fireEvent.click(prevBtn);

      expect(screen.getByText('Diskon Kopi 50%')).toBeInTheDocument();
    });

    it('renders null if banner list is empty', () => {
      const { container } = render(<PromoCarousel initialBanners={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
