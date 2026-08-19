import { describe, it, expect } from 'vitest';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getAdminMenus,
  createAdminMenu,
  updateAdminMenu,
  toggleMenuAvailability,
  deleteAdminMenu,
} from './admin-menus-api';

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
        expect(result.value.every((m) => m.categoryId === 'cat-1')).toBe(true);
      }
    });

    it('creates a menu item successfully', async () => {
      const result = await createAdminMenu({
        name: 'Kopi Susu Gula Aren',
        description: 'Espresso dengan susu dan aren',
        price: 22000,
        promoPrice: null,
        imageUrl: null,
        isAvailable: true,
        isBestSeller: false,
        isRecommended: false,
        categoryId: 'cat-2',
        variantGroups: [],
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Kopi Susu Gula Aren');
        expect(result.value.price).toBe(22000);
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
});
