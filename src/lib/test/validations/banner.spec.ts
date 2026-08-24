import { describe, it, expect } from 'vitest';
import { BannerSchema, BannerFormSchema } from '@/lib/validations/banner.schema';

describe('Banner Validation Schemas', () => {
  it('validates valid banner object with BannerSchema', () => {
    const validBanner = {
      id: 'ban-1',
      title: 'Diskon Kopi 50% Weekend',
      description: 'Dapatkan diskon 50% untuk setiap pembelian kedua',
      imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=675&fit=crop',
      targetUrl: '/menu?category=cat-coffee',
      isActive: true,
      sortOrder: 1,
      createdAt: '2026-08-20T10:00:00Z',
    };

    const result = BannerSchema.safeParse(validBanner);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Diskon Kopi 50% Weekend');
      expect(result.data.sortOrder).toBe(1);
    }
  });

  it('validates valid banner form input with BannerFormSchema', () => {
    const validForm = {
      title: 'Promo Spesial Croissant',
      description: 'Beli 2 gratis 1 setiap pagi',
      imageUrl: '/uploads/menus/banner-123.webp',
      targetUrl: '/menu',
      sortOrder: 2,
      isActive: true,
    };

    const result = BannerFormSchema.safeParse(validForm);
    expect(result.success).toBe(true);
  });

  it('fails validation when title is less than 3 characters', () => {
    const invalidForm = {
      title: 'Hi',
      imageUrl: '/uploads/menus/banner-123.webp',
      sortOrder: 0,
      isActive: true,
    };

    const result = BannerFormSchema.safeParse(invalidForm);
    expect(result.success).toBe(false);
  });

  it('fails validation when imageUrl is missing or empty', () => {
    const invalidForm = {
      title: 'Promo Diskon Heboh',
      imageUrl: '',
      sortOrder: 0,
      isActive: true,
    };

    const result = BannerFormSchema.safeParse(invalidForm);
    expect(result.success).toBe(false);
  });
});
