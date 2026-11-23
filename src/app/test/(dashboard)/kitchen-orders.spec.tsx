import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import KitchenOrdersPage from '@/app/(dashboard)/kitchen/orders/page';
import { createQueryWrapper } from '@/test/test-utils';
import { useAuthStore } from '@/store/use-auth-store';
import * as adminOrdersApi from '@/lib/api/admin-orders-api';
import { Right } from '@/lib/api/either';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

describe('KitchenOrdersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '2', username: 'kitchen', name: 'Chef Juna', role: 'KITCHEN' },
      'test-token'
    );
  });

  it('renders KDS Kanban board and metrics for kitchen staff', async () => {
    vi.spyOn(adminOrdersApi, 'getAdminOrders').mockResolvedValue(
      new Right({
        items: [
          {
            id: 'ord-1',
            orderNumber: '#ORD-101',
            tableId: 't1',
            tableNumber: '01',
            customerName: 'Guest 1',
            totalAmount: 45000,
            status: 'PENDING' as const,
            createdAt: '2026-08-20T10:00:00Z',
            updatedAt: '2026-08-20T10:00:00Z',
            orderItems: [
              {
                id: 'oi-1',
                menuItemId: 'mi-1',
                menuName: 'Iced Latte',
                quantity: 1,
                price: 35000,
                subtotal: 35000,
                selectedVariants: [],
              },
            ],
          },
        ],
        meta: {
          page: 1,
          limit: 100,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      })
    );

    const wrapper = createQueryWrapper();
    render(<KitchenOrdersPage />, { wrapper });

    expect(screen.getByText('Kitchen Display System (KDS)')).toBeInTheDocument();
    expect(screen.getByText('Pesanan Masuk')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('#ORD-101').length).toBeGreaterThan(0);
    });
  });
});
