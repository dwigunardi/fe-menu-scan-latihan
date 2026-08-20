import { describe, it, expect } from 'vitest';
import {
  PaginationMetaSchema,
  createPaginatedResponseSchema,
} from './pagination.schema';
import { StaffUserSchema, LoginResponseSchema } from './auth.schema';
import {
  AdminMenuItemSchema,
  CategorySchema,
  MenuFormSchema,
} from './admin-menu.schema';
import { z } from 'zod';

describe('Zod Validation Schemas Contract', () => {
  describe('Pagination Schemas', () => {
    it('validates PaginationMetaSchema successfully', () => {
      const validMeta = {
        page: 1,
        limit: 10,
        totalItems: 45,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: false,
      };

      const result = PaginationMetaSchema.safeParse(validMeta);
      expect(result.success).toBe(true);
    });

    it('creates and validates PaginatedResponseSchema', () => {
      const ItemSchema = z.object({ id: z.string(), name: z.string() });
      const PaginatedItemsSchema = createPaginatedResponseSchema(ItemSchema);

      const validPayload = {
        items: [{ id: '1', name: 'Item 1' }],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      const result = PaginatedItemsSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('Auth Schemas', () => {
    it('validates StaffUserSchema and LoginResponseSchema', () => {
      const validStaff = {
        id: 'u1',
        name: 'Budi Kasir',
        email: 'budi@cafe.com',
        role: 'KASIR',
      };

      const validLogin = {
        accessToken: 'jwt-token-xyz',
        user: validStaff,
      };

      expect(StaffUserSchema.safeParse(validStaff).success).toBe(true);
      expect(LoginResponseSchema.safeParse(validLogin).success).toBe(true);
    });
  });

  describe('Admin Menu Schemas', () => {
    it('validates AdminMenuItemSchema', () => {
      const validMenu = {
        id: 'm1',
        name: 'Kopi Tubruk',
        price: 15000,
        isAvailable: true,
        isBestSeller: false,
        isRecommended: false,
        categoryId: 'c1',
      };

      const result = AdminMenuItemSchema.safeParse(validMenu);
      expect(result.success).toBe(true);
    });

    it('validates CategorySchema', () => {
      const validCategory = {
        id: 'c1',
        name: 'Minuman Kopi',
        sortOrder: 1,
      };

      expect(CategorySchema.safeParse(validCategory).success).toBe(true);
    });
  });
});
