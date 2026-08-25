import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  RevenueSummaryCards,
  TopSellingTable,
  OrdersStatusBreakdown,
  ReportDateFilter,
  ExportReportButton,
} from '@/components/reports';

describe('Reports UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RevenueSummaryCards', () => {
    it('renders formatted revenue, total orders, and average order value', () => {
      render(
        <RevenueSummaryCards
          data={{
            totalRevenue: 500000,
            totalOrders: 10,
            averageOrderValue: 50000,
            ordersByStatus: [{ status: 'PAID', count: 10 }],
          }}
        />
      );

      expect(screen.getByText(/Total Pendapatan/i)).toBeInTheDocument();
      expect(screen.getByText(/Rp\s*500\.000/i)).toBeInTheDocument();
      expect(screen.getByText(/10/i)).toBeInTheDocument();
      expect(screen.getByText(/Rp\s*50\.000/i)).toBeInTheDocument();
    });

    it('renders skeleton placeholders when isLoading is true', () => {
      const { container } = render(<RevenueSummaryCards isLoading={true} />);
      expect(container.querySelectorAll('.animate-pulse').length).toBe(3);
    });
  });

  describe('TopSellingTable', () => {
    const mockTopSelling = [
      {
        menuItemId: 'm-1',
        name: 'Matcha Oat Latte',
        totalQuantitySold: 15,
        totalRevenue: 450000,
      },
      {
        menuItemId: 'm-2',
        name: 'Nasi Goreng Spesial',
        totalQuantitySold: 8,
        totalRevenue: 240000,
      },
    ];

    it('renders ranked top selling items with quantities and revenues', () => {
      render(<TopSellingTable items={mockTopSelling} />);

      expect(screen.getByText('Matcha Oat Latte')).toBeInTheDocument();
      expect(screen.getByText('Nasi Goreng Spesial')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText(/Rp\s*450\.000/i)).toBeInTheDocument();
    });

    it('renders empty state when no items exist', () => {
      render(<TopSellingTable items={[]} />);
      expect(
        screen.getByText(/Belum ada data penjualan pada periode ini/i)
      ).toBeInTheDocument();
    });
  });

  describe('OrdersStatusBreakdown', () => {
    it('renders order counts by status properly', () => {
      render(
        <OrdersStatusBreakdown
          ordersByStatus={[
            { status: 'PAID', count: 8 },
            { status: 'CANCELLED', count: 2 },
          ]}
        />
      );

      expect(screen.getByText(/Lunas \/ Selesai/i)).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText(/Dibatalkan/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('ReportDateFilter', () => {
    it('handles preset selection and emits new date range', () => {
      const handleChange = vi.fn();
      render(
        <ReportDateFilter
          value={{ preset: 'today' }}
          onChange={handleChange}
        />
      );

      const sevenDaysBtn = screen.getByRole('button', { name: /7 Hari Terakhir/i });
      fireEvent.click(sevenDaysBtn);

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          preset: '7d',
          startDate: expect.any(String),
          endDate: expect.any(String),
        })
      );
    });
  });

  describe('ExportReportButton', () => {
    it('renders print and export buttons', () => {
      render(
        <ExportReportButton
          revenueData={{
            totalRevenue: 100000,
            totalOrders: 2,
            averageOrderValue: 50000,
            ordersByStatus: [],
          }}
          topSellingItems={[]}
        />
      );

      expect(screen.getByRole('button', { name: /Cetak/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Ekspor CSV/i })).toBeInTheDocument();
    });
  });
});
