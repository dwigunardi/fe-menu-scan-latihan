import { describe, it, expect } from 'vitest';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getAdminMenus,
  getAdminMenusPaginated,
  getAdminMenuDetail,
  createAdminMenu,
  updateAdminMenu,
  toggleMenuAvailability,
  deleteAdminMenu,
  uploadAdminMenuImage,
  formatImageUrl,
} from '@/lib/api/admin-menus-api';

describe('admin-menus-api', () => {
  describe('Categories API', () => {
    it('fetches all categories successfully', async () => {
      const result = await getAdminCategories();
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0].name).toBe('Makanan Utama');
      }
    });

    it('creates a new category successfully', async () => {
      const result = await createAdminCategory({ name: 'Snack & Dessert', sortOrder: 3 });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Snack & Dessert');
        expect(result.value.id).toBeDefined();
      }
    });

    it('updates a category successfully', async () => {
      const result = await updateAdminCategory('cat-1', { name: 'Makanan Berat' });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Makanan Berat');
      }
    });

    it('deletes a category successfully', async () => {
      const result = await deleteAdminCategory('cat-1');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.success).toBe(true);
      }
    });
  });

  describe('Menus API', () => {
    it('fetches all menus without category filter', async () => {
      const result = await getAdminMenus();
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.length).toBe(2);
      }
    });

    it('fetches menus filtered by categoryId', async () => {
      const result = await getAdminMenus('cat-1');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.length).toBe(1);
        expect(result.value[0].categoryId).toBe('cat-1');
      }
    });

    it('fetches paginated menus with all query parameters (page, limit, search, isAvailable, sortBy, sortOrder)', async () => {
      const result = await getAdminMenusPaginated({
        page: 1,
        limit: 10,
        categoryId: 'cat-1',
        search: 'Goreng',
        isAvailable: true,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toBeDefined();
        expect(result.value.meta).toBeDefined();
        expect(result.value.meta.page).toBe(1);
        expect(result.value.meta.limit).toBe(10);
      }
    });

    it('fetches single menu detail by ID successfully', async () => {
      const result = await getAdminMenuDetail('menu-1');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.id).toBe('menu-1');
        expect(result.value.name).toBe('Nasi Goreng Spesial');
      }
    });

    it('creates a menu item successfully', async () => {
      const result = await createAdminMenu({
        name: 'Ayam Geprek Sambal Bawang',
        description: 'Ayam goreng renyah dengan ulekan cabai rawit pedas',
        price: 25000,
        promoPrice: null,
        categoryId: 'cat-1',
        imageUrl: 'https://images.unsplash.com/photo-ayam-geprek',
        isAvailable: true,
        isBestSeller: true,
        isRecommended: true,
        variantGroups: [],
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Ayam Geprek Sambal Bawang');
      }
    });

    it('updates a menu item successfully', async () => {
      const result = await updateAdminMenu('menu-1', { price: 38000 });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.price).toBe(38000);
      }
    });

    it('toggles menu availability status successfully', async () => {
      const result = await toggleMenuAvailability('menu-1', false);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isAvailable).toBe(false);
      }
    });

    it('deletes a menu item successfully', async () => {
      const result = await deleteAdminMenu('menu-1');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.success).toBe(true);
      }
    });
  });

  describe('Uploads & Image Formatting API', () => {
    it('uploads a menu image and returns webp URL metadata', async () => {
      const dummyFile = new File(['fake-image-bytes'], 'test-photo.jpg', { type: 'image/jpeg' });
      const result = await uploadAdminMenuImage(dummyFile);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.url).toContain('/uploads/menus/');
        expect(result.value.mimeType).toBe('image/webp');
      }
    });

    it('formats relative image URLs correctly', () => {
      expect(formatImageUrl('/uploads/menus/sample.webp')).toContain('/uploads/menus/sample.webp');
      expect(formatImageUrl('https://images.unsplash.com/photo-123')).toBe('https://images.unsplash.com/photo-123');
      expect(formatImageUrl('')).toBe('');
      expect(formatImageUrl(null)).toBe('');
    });
  });
});
