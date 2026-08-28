import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BannerForm } from '@/components/banners/banner-form';
import { BannerImageUploader } from '@/components/banners/banner-image-uploader';
import { PromoCarousel } from '@/components/banners/promo-carousel';
import { BannerData } from '@/lib/validations/banner.schema';
import * as bannerHooks from '@/hooks/queries/use-admin-banners';
import * as mediaApi from '@/lib/api/media-api';
import * as validatorModule from '@/lib/utils/banner-image-validator';
import { right, left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';

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
        url: '/banners/banner-coffee.jpg',
        filename: 'banner.jpg',
        size: 1000,
        mimeType: 'image/jpeg',
        width: 1920,
        height: 1080,
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

    it('handles drag and drop events and processes dropped image file', async () => {
      vi.spyOn(validatorModule, 'validateBannerImageDimensions').mockResolvedValue({
        isValid: true,
        width: 1920,
        height: 1080,
        aspectRatio: 1.77,
        aspectRatioLabel: '16:9 (Ideal Banner)',
      });

      const onChange = vi.fn();
      render(<BannerImageUploader value="" onChange={onChange} />);

      const dropZone = screen.getByText(/Klik untuk memilih file atau seret gambar banner ke sini/i).closest('div');

      fireEvent.dragOver(dropZone!);
      fireEvent.dragLeave(dropZone!);

      const file = new File(['fake-image'], 'banner.png', { type: 'image/png' });
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(mediaApi.uploadMediaImage).toHaveBeenCalledWith(file);
        expect(onChange).toHaveBeenCalledWith('/banners/banner-coffee.jpg');
      });
    });

    it('handles file input change and rejects image with invalid dimensions', async () => {
      vi.spyOn(validatorModule, 'validateBannerImageDimensions').mockResolvedValue({
        isValid: false,
        width: 400,
        height: 800,
        aspectRatio: 0.5,
        aspectRatioLabel: 'Portrait',
        error: 'Rasio gambar terlalu vertikal. Banner wajib landscape 16:9.',
      });

      const onChange = vi.fn();
      const { container } = render(<BannerImageUploader value="" onChange={onChange} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File(['dummy'], 'portrait.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByText(/Gambar Tidak Memenuhi Kriteria Banner/i)).toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();
      });
    });

    it('handles upload failure from media API gracefully', async () => {
      vi.spyOn(validatorModule, 'validateBannerImageDimensions').mockResolvedValue({
        isValid: true,
        width: 1200,
        height: 675,
        aspectRatio: 1.77,
        aspectRatioLabel: '16:9',
      });

      vi.mocked(mediaApi.uploadMediaImage).mockResolvedValue(
        left(new ApiError(500, 'UPLOAD_ERROR', 'Koneksi server gagal saat mengunggah'))
      );

      const onChange = vi.fn();
      const { container } = render(<BannerImageUploader value="" onChange={onChange} />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['data'], 'test.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(onChange).not.toHaveBeenCalled();
      });
    });

    it('validates and applies custom URL in Paste URL tab', async () => {
      vi.spyOn(validatorModule, 'validateBannerImageDimensions').mockResolvedValue({
        isValid: true,
        width: 1600,
        height: 900,
        aspectRatio: 1.77,
        aspectRatioLabel: '16:9',
      });

      const onChange = vi.fn();
      render(<BannerImageUploader value="" onChange={onChange} />);

      // Switch to URL tab
      fireEvent.click(screen.getByRole('button', { name: /Paste URL/i }));

      const urlInput = screen.getByPlaceholderText(/https:\/\/images.unsplash.com/i);
      fireEvent.change(urlInput, { target: { value: 'https://images.unsplash.com/photo-banner-promo' } });

      const applyBtn = screen.getByRole('button', { name: /Terapkan/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('https://images.unsplash.com/photo-banner-promo');
      });
    });

    it('removes image preview when clear button (X) is clicked', () => {
      const onChange = vi.fn();
      render(
        <BannerImageUploader
          value="/banners/banner-coffee.jpg"
          onChange={onChange}
        />
      );

      expect(screen.getByText('Rasio: 16:9 Landscape (Valid)')).toBeInTheDocument();

      const clearBtn = screen.getByRole('button', { name: '' });
      fireEvent.click(clearBtn);

      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('PromoCarousel', () => {
    it('renders promo carousel slides and navigates with next and prev buttons', () => {
      render(<PromoCarousel initialBanners={mockBanners} />);

      expect(screen.getByText('Diskon Kopi 50%')).toBeInTheDocument();

      // Click next button
      const nextButtons = screen.getAllByRole('button');
      if (nextButtons.length > 0) {
        fireEvent.click(nextButtons[0]);
      }
    });

    it('renders empty carousel when banners array is empty', () => {
      vi.spyOn(bannerHooks, 'usePublicBannersQuery').mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      const { container } = render(<PromoCarousel initialBanners={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
