import { describe, it, expect, beforeEach } from 'vitest';
import { getAdminOrders, updateAdminOrderStatus } from './admin-orders-api';
import { useAuthStore } from '@/store/use-auth-store';

describe('admin-orders-api', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );
  });

  describe('getAdminOrders', () => {
    it('fetches paginated orders successfully', async () => {
      const result = await getAdminOrders();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toBeDefined();
        expect(result.value.items.length).toBeGreaterThan(0);
        expect(result.value.items[0].orderNumber).toBe('ORD-20260820-001');
        expect(result.value.items[0].orderItems.length).toBe(2);
      }
    });

    it('filters orders by status', async () => {
      const result = await getAdminOrders({ status: 'PENDING' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items.every((o) => o.status === 'PENDING')).toBe(true);
      }
    });

    it('searches orders by orderNumber or customerName', async () => {
      const result = await getAdminOrders({ search: 'Budi' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items.some((o) => o.customerName.includes('Budi'))).toBe(true);
      }
    });

    it('passes all optional query parameters correctly', async () => {
      const result = await getAdminOrders({
        page: 1,
        limit: 10,
        status: 'ALL',
        tableId: 'table-1',
        search: 'ORD',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        sortBy: 'totalAmount',
        sortOrder: 'desc',
      });

      expect(result.isRight()).toBe(true);
    });
  });

  describe('updateAdminOrderStatus', () => {
    it('updates order status to PREPARING', async () => {
      const result = await updateAdminOrderStatus('ord-1', 'PREPARING');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.status).toBe('PREPARING');
      }
    });

    it('updates order status to PAID and sets paidAt', async () => {
      const result = await updateAdminOrderStatus('ord-1', 'PAID');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.status).toBe('PAID');
        expect(result.value.paidAt).toBeDefined();
      }
    });
  });
});
