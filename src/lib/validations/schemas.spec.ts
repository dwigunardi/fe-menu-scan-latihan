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
import { TableSchema, TableFormSchema } from './table.schema';
import { OrderSchema, OrderItemSchema, SelectedVariantSnapshotSchema } from './order.schema';
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

  describe('Table Schemas', () => {
    it('validates TableSchema with numeric coercion and default status', () => {
      const validTable = {
        id: 't-1',
        tableNumber: 'T-01',
        capacity: '4',
        status: 'VACANT',
      };

      const result = TableSchema.safeParse(validTable);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacity).toBe(4);
        expect(result.data.status).toBe('VACANT');
      }
    });

    it('falls back to number field or default when tableNumber is missing', () => {
      const tableWithNumber = {
        id: 't-2',
        number: '02',
        capacity: 2,
      };

      const res1 = TableSchema.safeParse(tableWithNumber);
      expect(res1.success).toBe(true);
      if (res1.success) {
        expect(res1.data.tableNumber).toBe('02');
      }

      const tableWithNoNumber = {
        id: 't-3',
        capacity: 4,
      };

      const res2 = TableSchema.safeParse(tableWithNoNumber);
      expect(res2.success).toBe(true);
      if (res2.success) {
        expect(res2.data.tableNumber).toBe('01');
      }

      const resInvalid = TableSchema.safeParse(null);
      expect(resInvalid.success).toBe(false);
    });

    it('validates TableFormSchema', () => {
      const validForm = {
        tableNumber: 'VIP-1',
        capacity: 6,
      };

      const result = TableFormSchema.safeParse(validForm);
      expect(result.success).toBe(true);
    });
  });

  describe('Order Schemas', () => {
    it('validates OrderSchema with nested items and variants snapshot mapping', () => {
      const rawOrder = {
        id: 'o-1',
        orderNumber: 'ORD-123',
        tableId: 't-1',
        table: { id: 't-1', number: '04' },
        customerName: 'Budi',
        status: 'PENDING',
        totalAmount: '50000',
        orderItems: [
          {
            id: 'oi-1',
            menuItemId: 'm-1',
            menuNameSnapshot: 'Caramel Macchiato',
            priceSnapshot: 25000,
            quantity: 2,
            subtotal: 50000,
            notes: 'Less ice',
            selectedVariants: [
              {
                groupNameSnapshot: 'Size',
                optionNameSnapshot: 'Large',
                extraPriceSnapshot: 5000,
              },
            ],
          },
        ],
      };

      const result = OrderSchema.safeParse(rawOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAmount).toBe(50000);
        expect(result.data.tableNumber).toBe('04');
        expect(result.data.orderItems[0].menuName).toBe('Caramel Macchiato');
        expect(result.data.orderItems[0].selectedVariants[0].groupName).toBe('Size');
      }
    });

    it('handles variant snapshot preprocessing and non-object fallback', () => {
      const rawVariant = {
        groupNameSnapshot: 'Suhu',
        optionNameSnapshot: 'Dingin',
        extraPriceSnapshot: 0,
      };

      const result = SelectedVariantSnapshotSchema.safeParse(rawVariant);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupName).toBe('Suhu');
        expect(result.data.optionName).toBe('Dingin');
      }

      expect(SelectedVariantSnapshotSchema.safeParse(null).success).toBe(false);
      expect(OrderItemSchema.safeParse(null).success).toBe(false);
      expect(OrderSchema.safeParse(null).success).toBe(false);
    });
  });
});
