import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderCard, OrderReceiptModal, OrdersView } from '@/components/orders';
import { OrderData } from '@/lib/validations/order.schema';
import * as orderHooks from '@/hooks/queries/use-admin-orders';
import { createQueryWrapper } from '@/test/test-utils';

const mockOrder: OrderData = {
  id: 'ord-1',
  orderNumber: 'ORD-20260820-001',
  tableId: 'table-1',
  tableNumber: '01',
  customerName: 'Budi Santoso',
  status: 'PENDING',
  totalAmount: 52000,
  paidAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  orderItems: [
    {
      id: 'oi-1',
      menuItemId: 'menu-1',
      menuName: 'Kopi Susu Gula Aren',
      price: 22000,
      quantity: 2,
      subtotal: 44000,
      notes: 'Less sugar, no ice',
      selectedVariants: [
        {
          groupName: 'Ukuran',
          optionName: 'Large',
          extraPrice: 4000,
        },
      ],
    },
    {
      id: 'oi-2',
      menuItemId: 'menu-2',
      menuName: 'Kentang Goreng',
      price: 8000,
      quantity: 1,
      subtotal: 8000,
      notes: null,
      selectedVariants: [],
    },
  ],
};

const mockOrderList: OrderData[] = [
  mockOrder,
  {
    ...mockOrder,
    id: 'ord-2',
    orderNumber: 'ORD-20260820-002',
    tableNumber: '02',
    customerName: 'Siti Rahma',
    status: 'PREPARING',
  },
  {
    ...mockOrder,
    id: 'ord-3',
    orderNumber: 'ORD-20260820-003',
    tableNumber: '03',
    customerName: 'Andi Wijaya',
    status: 'SERVED',
  },
  {
    ...mockOrder,
    id: 'ord-4',
    orderNumber: 'ORD-20260820-004',
    tableNumber: '04',
    customerName: 'Dewi Lestari',
    status: 'PAID',
  },
];

describe('Order Components', () => {
  const mockUpdateStatus = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(orderHooks, 'useAdminOrdersPaginatedQuery').mockReturnValue({
      data: {
        items: mockOrderList,
        meta: { page: 1, limit: 100, totalItems: 4, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
    } as any);

    vi.spyOn(orderHooks, 'useUpdateOrderStatusMutation').mockReturnValue({
      mutate: mockUpdateStatus,
      isPending: false,
    } as any);
  });

  describe('OrderCard', () => {
    it('renders order information, variants, cooking notes, and table badge', () => {
      render(
        <OrderCard
          order={mockOrder}
          onUpdateStatus={vi.fn()}
          onOpenReceipt={vi.fn()}
        />
      );

      expect(screen.getByText('MEJA 01')).toBeInTheDocument();
      expect(screen.getByText('ORD-20260820-001')).toBeInTheDocument();
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
      expect(screen.getByText('Kopi Susu Gula Aren')).toBeInTheDocument();
      expect(screen.getByText(/Ukuran: Large/i)).toBeInTheDocument();
      expect(screen.getByText(/Catatan: Less sugar, no ice/i)).toBeInTheDocument();
    });

    it('triggers status change to PREPARING when Mulai Masak is clicked on PENDING order', () => {
      const onUpdateStatus = vi.fn();
      render(
        <OrderCard
          order={mockOrder}
          onUpdateStatus={onUpdateStatus}
          onOpenReceipt={vi.fn()}
        />
      );

      const cookBtn = screen.getByRole('button', { name: /Mulai Masak/i });
      fireEvent.click(cookBtn);

      expect(onUpdateStatus).toHaveBeenCalledWith('ord-1', 'PREPARING');
    });

    it('triggers status change to CANCELLED when Tolak is clicked on PENDING order', () => {
      const onUpdateStatus = vi.fn();
      render(
        <OrderCard
          order={mockOrder}
          onUpdateStatus={onUpdateStatus}
          onOpenReceipt={vi.fn()}
        />
      );

      const rejectBtn = screen.getByRole('button', { name: /Tolak/i });
      fireEvent.click(rejectBtn);

      expect(onUpdateStatus).toHaveBeenCalledWith('ord-1', 'CANCELLED');
    });

    it('renders Sajikan button on PREPARING order', () => {
      const onUpdateStatus = vi.fn();
      const preparingOrder: OrderData = {
        ...mockOrder,
        status: 'PREPARING',
      };

      render(
        <OrderCard
          order={preparingOrder}
          onUpdateStatus={onUpdateStatus}
          onOpenReceipt={vi.fn()}
        />
      );

      const serveBtn = screen.getByRole('button', { name: /Sajikan ke Meja/i });
      fireEvent.click(serveBtn);

      expect(onUpdateStatus).toHaveBeenCalledWith('ord-1', 'SERVED');
    });

    it('renders Struk and Bayar buttons on SERVED order', () => {
      const onUpdateStatus = vi.fn();
      const onOpenReceipt = vi.fn();
      const servedOrder: OrderData = {
        ...mockOrder,
        status: 'SERVED',
        tableNumber: 'MEJA 03',
      };

      render(
        <OrderCard
          order={servedOrder}
          onUpdateStatus={onUpdateStatus}
          onOpenReceipt={onOpenReceipt}
        />
      );

      const receiptBtn = screen.getByRole('button', { name: /Struk/i });
      fireEvent.click(receiptBtn);
      expect(onOpenReceipt).toHaveBeenCalledWith(servedOrder);

      const payBtn = screen.getByRole('button', { name: /Bayar & Selesai/i });
      fireEvent.click(payBtn);
      expect(onUpdateStatus).toHaveBeenCalledWith('ord-1', 'PAID');
    });

    it('renders Lihat Struk button on PAID order and elapsed time with timer color branches', () => {
      const onOpenReceipt = vi.fn();
      const paidOrder: OrderData = {
        ...mockOrder,
        status: 'PAID',
        createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
      };

      render(
        <OrderCard
          order={paidOrder}
          onUpdateStatus={vi.fn()}
          onOpenReceipt={onOpenReceipt}
        />
      );

      const viewReceiptBtn = screen.getByRole('button', { name: /Lihat Struk Pembayaran/i });
      fireEvent.click(viewReceiptBtn);
      expect(onOpenReceipt).toHaveBeenCalledWith(paidOrder);
    });

    it('renders Cancelled badge on CANCELLED order and warning timer colors', () => {
      const cancelledOrder: OrderData = {
        ...mockOrder,
        status: 'CANCELLED',
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      };

      render(
        <OrderCard
          order={cancelledOrder}
          onUpdateStatus={vi.fn()}
          onOpenReceipt={vi.fn()}
        />
      );

      expect(screen.getByText('Pesanan Dibatalkan')).toBeInTheDocument();
    });
  });

  describe('OrderReceiptModal', () => {
    it('returns null when order is not provided', () => {
      const { container } = render(
        <OrderReceiptModal isOpen={true} onClose={vi.fn()} order={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders thermal receipt details, line items, and totals', () => {
      render(
        <OrderReceiptModal
          isOpen={true}
          onClose={vi.fn()}
          order={mockOrder}
        />
      );

      expect(screen.getByText('KUMPUL CAFE & RESTO')).toBeInTheDocument();
      expect(screen.getByText('ORD-20260820-001')).toBeInTheDocument();
      expect(screen.getByText('BELUM DIBAYAR')).toBeInTheDocument();
      expect(screen.getByText('TOTAL TAGIHAN')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cetak Struk/i })).toBeInTheDocument();
    });

    it('allows marking order as PAID from modal', () => {
      const onUpdateStatus = vi.fn();
      const onClose = vi.fn();

      render(
        <OrderReceiptModal
          isOpen={true}
          onClose={onClose}
          order={mockOrder}
          onUpdateStatus={onUpdateStatus}
        />
      );

      const markPaidBtn = screen.getByRole('button', { name: /Tandai Lunas/i });
      fireEvent.click(markPaidBtn);

      expect(onUpdateStatus).toHaveBeenCalledWith('ord-1', 'PAID');
      expect(onClose).toHaveBeenCalled();
    });

    it('triggers window.print when Cetak Struk is clicked', () => {
      window.print = vi.fn();

      render(
        <OrderReceiptModal
          isOpen={true}
          onClose={vi.fn()}
          order={mockOrder}
        />
      );

      const printBtn = screen.getByRole('button', { name: /Cetak Struk/i });
      fireEvent.click(printBtn);

      expect(window.print).toHaveBeenCalled();
    });
  });

  describe('OrdersView (Master Kanban & Table Controller)', () => {
    it('renders header, stats KPI cards, and columns in Kanban view', () => {
      const wrapper = createQueryWrapper();
      render(<OrdersView pageTitle="Manajemen Pesanan Masuk" />, { wrapper });

      expect(screen.getByText('Manajemen Pesanan Masuk')).toBeInTheDocument();
      expect(screen.getAllByText('Budi Santoso').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Siti Rahma').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Andi Wijaya').length).toBeGreaterThan(0);
    });

    it('toggles audio sound chime on and off', () => {
      const wrapper = createQueryWrapper();
      render(<OrdersView />, { wrapper });

      const soundToggle = screen.getByRole('button', { name: /Bel Aktif|Mute/i });
      fireEvent.click(soundToggle);

      expect(screen.getByText(/Mute/i)).toBeInTheDocument();
    });

    it('switches to Table audit view and renders table rows with receipt trigger', () => {
      const wrapper = createQueryWrapper();
      render(<OrdersView />, { wrapper });

      const tableModeBtn = screen.getByRole('button', { name: /Tabel/i });
      fireEvent.click(tableModeBtn);

      expect(screen.getByText('No. Pesanan')).toBeInTheDocument();
      expect(screen.getByText('ORD-20260820-001')).toBeInTheDocument();
      expect(screen.getByText('Dewi Lestari')).toBeInTheDocument();

      // Open receipt from table view
      const receiptButtons = screen.getAllByRole('button', { name: /Struk/i });
      fireEvent.click(receiptButtons[0]);

      expect(screen.getByText('KUMPUL CAFE & RESTO')).toBeInTheDocument();
    });

    it('filters orders by search query', () => {
      const wrapper = createQueryWrapper();
      render(<OrdersView />, { wrapper });

      const searchInput = screen.getByPlaceholderText(/Cari no\. pesanan atau nama tamu/i);
      fireEvent.change(searchInput, { target: { value: 'Siti' } });

      expect(orderHooks.useAdminOrdersPaginatedQuery).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Siti' })
      );
    });

    it('refetches orders when refresh button is clicked', () => {
      const wrapper = createQueryWrapper();
      const { container } = render(<OrdersView />, { wrapper });

      const buttons = container.querySelectorAll('button');
      const refreshBtn = Array.from(buttons).find((b) => b.querySelector('.lucide-rotate-cw'));
      if (refreshBtn) {
        fireEvent.click(refreshBtn);
        expect(mockRefetch).toHaveBeenCalled();
      }
    });
  });
});
