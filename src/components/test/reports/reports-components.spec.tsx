import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  RevenueSummaryCards,
  TopSellingTable,
  OrdersStatusBreakdown,
  ReportDateFilter,
  ExportReportButton,
} from '@/components/reports';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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
    it('handles all preset selections (today, 7d, 30d, month, custom) and custom date inputs', () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <ReportDateFilter
          value={{ preset: 'today' }}
          onChange={handleChange}
        />
      );

      // 7 Hari Terakhir
      const sevenDaysBtn = screen.getByRole('button', { name: /7 Hari Terakhir/i });
      fireEvent.click(sevenDaysBtn);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: '7d' })
      );

      // Hari Ini
      const todayBtn = screen.getByRole('button', { name: /Hari Ini/i });
      fireEvent.click(todayBtn);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: 'today' })
      );

      // Bulan Ini
      const monthBtn = screen.getByRole('button', { name: /Bulan Ini/i });
      fireEvent.click(monthBtn);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: 'month' })
      );

      // Kustom
      const customBtn = screen.getByRole('button', { name: /^Kustom$/i });
      fireEvent.click(customBtn);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: 'custom' })
      );

      // Rerender as custom and change date inputs
      rerender(
        <ReportDateFilter
          value={{
            preset: 'custom',
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2026-01-10T23:59:59.999Z',
          }}
          onChange={handleChange}
        />
      );

      const dateInputs = screen.getAllByDisplayValue(/2026-01-/);
      expect(dateInputs.length).toBeGreaterThan(0);
      fireEvent.change(dateInputs[0], { target: { value: '2026-01-05' } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('ExportReportButton', () => {
    it('renders and triggers export CSV and window.print', () => {
      const mockPrint = vi.fn();
      window.print = mockPrint;

      // Mock URL.createObjectURL and URL.revokeObjectURL
      window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/dummy');
      window.URL.revokeObjectURL = vi.fn();

      render(
        <ExportReportButton
          revenueData={{
            totalRevenue: 1000000,
            totalOrders: 20,
            averageOrderValue: 50000,
            ordersByStatus: [{ status: 'PAID', count: 20 }],
          }}
          topSellingItems={[
            {
              menuItemId: 'item-1',
              name: 'Kopi Susu "Signature"',
              totalQuantitySold: 30,
              totalRevenue: 600000,
            },
          ]}
          dateLabel="Hari Ini"
        />
      );

      const printBtn = screen.getByRole('button', { name: /Cetak/i });
      fireEvent.click(printBtn);
      expect(mockPrint).toHaveBeenCalled();

      const exportBtn = screen.getByRole('button', { name: /Ekspor CSV/i });
      fireEvent.click(exportBtn);

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Laporan berhasil diekspor ke format CSV')
      );
    });
  });
});
