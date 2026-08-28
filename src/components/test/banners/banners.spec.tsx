import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

    it('rejects invalid custom URL in Paste URL tab', async () => {
      vi.spyOn(validatorModule, 'validateBannerImageDimensions').mockResolvedValue({
        isValid: false,
        width: 100,
        height: 100,
        aspectRatio: 1,
        aspectRatioLabel: 'Square',
        error: 'Rasio gambar tidak sesuai. Banner harus 16:9.',
      });

      const onChange = vi.fn();
      render(<BannerImageUploader value="" onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: /Paste URL/i }));

      const urlInput = screen.getByPlaceholderText(/https:\/\/images.unsplash.com/i);
      fireEvent.change(urlInput, { target: { value: 'https://example.com/square.jpg' } });

      const applyBtn = screen.getByRole('button', { name: /Terapkan/i });
      fireEvent.click(applyBtn);

      await waitFor(() => {
        expect(onChange).not.toHaveBeenCalled();
      });
    });

    it('handles selecting preset with onPresetSelect callback and dropzone click', () => {
      const onChange = vi.fn();
      const onPresetSelect = vi.fn();
      render(
        <BannerImageUploader
          value=""
          onChange={onChange}
          onPresetSelect={onPresetSelect}
        />
      );

      // Select preset
      fireEvent.click(screen.getByRole('button', { name: /Contoh Preset/i }));
      fireEvent.click(screen.getByText('☕ Buy 1 Get 1 Kopi'));
      expect(onChange).toHaveBeenCalled();
      expect(onPresetSelect).toHaveBeenCalled();

      // Dropzone click in upload tab
      fireEvent.click(screen.getByRole('button', { name: /Upload File/i }));
      const dropzone = screen.getByText(/Klik untuk memilih file/i).closest('div');
      if (dropzone) {
        fireEvent.click(dropzone);
      }
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
    it('renders promo carousel slides and navigates with next, prev, and dot buttons', () => {
      render(<PromoCarousel initialBanners={mockBanners} />);

      expect(screen.getByText('Diskon Kopi 50%')).toBeInTheDocument();

      // Click next button
      const nextBtn = screen.getByRole('button', { name: 'Next Banner' });
      fireEvent.click(nextBtn);
      expect(screen.getByText('Cashback QRIS 30%')).toBeInTheDocument();

      // Click prev button
      const prevBtn = screen.getByRole('button', { name: 'Previous Banner' });
      fireEvent.click(prevBtn);
      expect(screen.getByText('Diskon Kopi 50%')).toBeInTheDocument();

      // Click slide indicator dot
      const dot2 = screen.getByRole('button', { name: 'Slide 2' });
      fireEvent.click(dot2);
      expect(screen.getByText('Cashback QRIS 30%')).toBeInTheDocument();
    });

    it('pauses and resumes on mouseEnter and mouseLeave, and advances with autoPlay timer', () => {
      vi.useFakeTimers();
      render(<PromoCarousel initialBanners={mockBanners} autoPlayInterval={3000} />);

      expect(screen.getByText('Diskon Kopi 50%')).toBeInTheDocument();

      // Mouse enter pauses auto-play
      const carouselContainer = screen.getByText('Diskon Kopi 50%').closest('div.group');
      if (carouselContainer) {
        fireEvent.mouseEnter(carouselContainer);
        act(() => {
          vi.advanceTimersByTime(3500);
        });
        // Should still be slide 1
        expect(screen.getByText('Diskon Kopi 50%')).toBeInTheDocument();

        // Mouse leave resumes
        fireEvent.mouseLeave(carouselContainer);
        act(() => {
          vi.advanceTimersByTime(3500);
        });
        expect(screen.getByText('Cashback QRIS 30%')).toBeInTheDocument();
      }
      vi.useRealTimers();
    });

    it('handles touch swipe gestures (left swipe next, right swipe prev)', () => {
      render(<PromoCarousel initialBanners={mockBanners} />);

      const carouselContainer = screen.getByText('Diskon Kopi 50%').closest('div.group');
      if (carouselContainer) {
        // Swipe left (distance > 50 -> next slide)
        fireEvent.touchStart(carouselContainer, { targetTouches: [{ clientX: 200 }] });
        fireEvent.touchMove(carouselContainer, { targetTouches: [{ clientX: 100 }] });
        fireEvent.touchEnd(carouselContainer);
        expect(screen.getByText('Cashback QRIS 30%')).toBeInTheDocument();

        // Swipe right (distance < -50 -> prev slide)
        fireEvent.touchStart(carouselContainer, { targetTouches: [{ clientX: 100 }] });
        fireEvent.touchMove(carouselContainer, { targetTouches: [{ clientX: 200 }] });
        fireEvent.touchEnd(carouselContainer);
        expect(screen.getByText('Diskon Kopi 50%')).toBeInTheDocument();

        // Insufficient swipe (no change)
        fireEvent.touchStart(carouselContainer, { targetTouches: [{ clientX: 100 }] });
        fireEvent.touchEnd(carouselContainer);
        expect(screen.getByText('Diskon Kopi 50%')).toBeInTheDocument();
      }
    });

    it('renders single banner without navigation arrows or dots', () => {
      render(<PromoCarousel initialBanners={[mockBanners[0]]} />);

      expect(screen.getByText('Diskon Kopi 50%')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Next Banner' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Previous Banner' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Slide 1' })).not.toBeInTheDocument();
    });

    it('renders loading skeleton when fetching public banners', () => {
      vi.spyOn(bannerHooks, 'usePublicBannersQuery').mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      const { container } = render(<PromoCarousel />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
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
