import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateBannerImageDimensions,
  getAspectRatioLabel,
} from '@/lib/utils/banner-image-validator';

describe('Banner Image Validator Utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAspectRatioLabel', () => {
    it('returns appropriate human readable labels for aspect ratios', () => {
      expect(getAspectRatioLabel(1.78)).toBe('16:9 (Ideal Banner)');
      expect(getAspectRatioLabel(2.33)).toBe('21:9 (Ultrawide)');
      expect(getAspectRatioLabel(1.6)).toBe('16:10 (Landscape)');
      expect(getAspectRatioLabel(1.33)).toBe('4:3 (Landscape Standar)');
      expect(getAspectRatioLabel(1.0)).toBe('1:1 (Kotak / Square)');
      expect(getAspectRatioLabel(0.56)).toBe('Portrait / Vertikal');
    });
  });

  describe('validateBannerImageDimensions', () => {
    it('validates a standard 16:9 landscape image (1200x675) as valid', async () => {
      // Mock Image constructor
      const originalImage = global.Image;
      class MockImage {
        naturalWidth = 1200;
        naturalHeight = 675;
        width = 1200;
        height = 675;
        onload: () => void = () => {};
        onerror: () => void = () => {};
        set src(_val: string) {
          setTimeout(() => this.onload(), 0);
        }
      }
      global.Image = MockImage as any;

      const result = await validateBannerImageDimensions('https://example.com/banner.jpg');
      expect(result.isValid).toBe(true);
      expect(result.aspectRatio).toBe(1.78);
      expect(result.aspectRatioLabel).toContain('16:9');

      global.Image = originalImage;
    });

    it('rejects a 1:1 square image (800x800) with clear explanation', async () => {
      const originalImage = global.Image;
      class MockSquareImage {
        naturalWidth = 800;
        naturalHeight = 800;
        onload: () => void = () => {};
        set src(_val: string) {
          setTimeout(() => this.onload(), 0);
        }
      }
      global.Image = MockSquareImage as any;

      const result = await validateBannerImageDimensions('https://example.com/square.jpg');
      expect(result.isValid).toBe(false);
      expect(result.aspectRatio).toBe(1);
      expect(result.error).toContain('kotak');

      global.Image = originalImage;
    });

    it('rejects a portrait image (600x900) with orientation warning', async () => {
      const originalImage = global.Image;
      class MockPortraitImage {
        naturalWidth = 600;
        naturalHeight = 900;
        onload: () => void = () => {};
        set src(_val: string) {
          setTimeout(() => this.onload(), 0);
        }
      }
      global.Image = MockPortraitImage as any;

      const result = await validateBannerImageDimensions('https://example.com/portrait.jpg');
      expect(result.isValid).toBe(false);
      expect(result.aspectRatio).toBe(0.67);
      expect(result.error).toContain('portrait');

      global.Image = originalImage;
    });

    it('rejects an image with resolution below minimum (400x200)', async () => {
      const originalImage = global.Image;
      class MockSmallImage {
        naturalWidth = 400;
        naturalHeight = 200;
        onload: () => void = () => {};
        set src(_val: string) {
          setTimeout(() => this.onload(), 0);
        }
      }
      global.Image = MockSmallImage as any;

      const result = await validateBannerImageDimensions('https://example.com/small.jpg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('terlalu kecil');

      global.Image = originalImage;
    });

    it('handles image loading error gracefully', async () => {
      const originalImage = global.Image;
      class MockBrokenImage {
        onload: () => void = () => {};
        onerror: () => void = () => {};
        set src(_val: string) {
          setTimeout(() => this.onerror(), 0);
        }
      }
      global.Image = MockBrokenImage as any;

      const result = await validateBannerImageDimensions('https://example.com/broken.jpg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('tidak dapat diakses');

      global.Image = originalImage;
    });
  });
});
