import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAdminBanners,
  getPublicBanners,
  getAdminBannerById,
  createAdminBanner,
  updateAdminBanner,
  toggleAdminBannerStatus,
  deleteAdminBanner,
} from '@/lib/api/admin-banners-api';
import { useAuthStore } from '@/store/use-auth-store';

describe('Admin Banners API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '1', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );
  });

  it('fetches all banners for admin with getAdminBanners', async () => {
    const result = await getAdminBanners();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.length).toBeGreaterThan(0);
      expect(result.value[0].title).toBeDefined();
    }
  });

  it('fetches active public banners with getPublicBanners', async () => {
    const result = await getPublicBanners();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.every((b) => b.isActive)).toBe(true);
    }
  });

  it('fetches a banner detail by ID with getAdminBannerById', async () => {
    const result = await getAdminBannerById('ban-1');
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.id).toBe('ban-1');
    }
  });

  it('creates a new promo banner with createAdminBanner', async () => {
    const newBannerPayload = {
      title: 'Diskon Akhir Bulan 70%',
      description: 'Khusus pesanan via scan QR',
      imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=675&fit=crop',
      targetUrl: '/menu',
      sortOrder: 5,
      isActive: true,
    };

    const result = await createAdminBanner(newBannerPayload);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.title).toBe('Diskon Akhir Bulan 70%');
      expect(result.value.id).toBeDefined();
    }
  });

  it('updates an existing promo banner with updateAdminBanner', async () => {
    const result = await updateAdminBanner('ban-1', {
      title: 'Diskon Kopi 60% Weekend Update',
    });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.title).toBe('Diskon Kopi 60% Weekend Update');
    }
  });

  it('toggles banner active status with toggleAdminBannerStatus', async () => {
    const result = await toggleAdminBannerStatus('ban-1', false);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.isActive).toBe(false);
    }
  });

  it('deletes a promo banner with deleteAdminBanner', async () => {
    const result = await deleteAdminBanner('ban-2');
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.success).toBe(true);
      expect(result.value.id).toBe('ban-2');
    }
  });
});
