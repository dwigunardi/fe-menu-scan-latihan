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
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:5000/api/v1';

describe('Admin Banners API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '1', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );
  });

  it('fetches all banners for admin with getAdminBanners (with and without query params)', async () => {
    const result = await getAdminBanners();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.length).toBeGreaterThan(0);
      expect(result.value[0].title).toBeDefined();
    }

    const filteredResult = await getAdminBanners({ search: 'kopi', isActive: true });
    expect(filteredResult.isRight()).toBe(true);
  });

  it('fetches active public banners with getPublicBanners', async () => {
    const result = await getPublicBanners();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.every((b) => b.isActive)).toBe(true);
    }
  });

  it('handles wrapped banner list response object { items: [...] }', async () => {
    server.use(
      http.get(`${API_BASE}/admin/banners`, () => {
        return HttpResponse.json({
          items: [
            {
              id: 'ban-wrapped-1',
              title: 'Wrapped Banner',
              description: 'Wrapped test',
              imageUrl: 'https://example.com/banner.jpg',
              targetUrl: '/menu',
              sortOrder: 1,
              isActive: true,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        });
      })
    );

    const result = await getAdminBanners();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value[0].title).toBe('Wrapped Banner');
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

  it('deletes a promo banner with deleteAdminBanner successfully', async () => {
    const result = await deleteAdminBanner('ban-2');
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.success).toBe(true);
      expect(result.value.id).toBe('ban-2');
    }
  });

  it('returns ApiError when deleteAdminBanner encounters error', async () => {
    server.use(
      http.delete(`${API_BASE}/admin/banners/:id`, () => {
        return HttpResponse.json({ message: 'Banner not found' }, { status: 404 });
      })
    );

    const result = await deleteAdminBanner('invalid-id');
    expect(result.isLeft()).toBe(true);
  });
});
