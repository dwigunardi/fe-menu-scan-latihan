import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ShiftSummaryCard,
  ShiftHistoryTable,
  OpenShiftModal,
  CloseShiftModal,
  ZReportReceiptModal,
} from '@/components/shifts';
import { ShiftItem } from '@/lib/validations/shift.schema';

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Shifts Domain UI Components', () => {
  const mockShift: ShiftItem = {
    id: '11111111-1111-1111-1111-111111111111',
    branchId: 'default-branch',
    staffId: 'staff-1',
    staffName: 'Budi Kasir',
    openingCash: 200000,
    expectedCash: 350000,
    actualCash: 350000,
    cashVariance: 0,
    totalCashOrders: 3,
    totalQrisOrders: 5,
    totalCashRevenue: 150000,
    totalQrisRevenue: 250000,
    totalRevenue: 400000,
    status: 'OPEN',
    notes: 'Pecahan 10rb',
    openedAt: '2026-08-25T08:00:00.000Z',
    closedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ShiftSummaryCard', () => {
    it('renders empty state prompt when no active shift', () => {
      const onOpen = vi.fn();
      render(
        <ShiftSummaryCard
          currentShift={null}
          isLoading={false}
          onOpenShiftClick={onOpen}
          onCloseShiftClick={vi.fn()}
        />
      );

      expect(screen.getByText('Belum Ada Shift Kasir yang Aktif')).toBeInTheDocument();
      const openBtn = screen.getByRole('button', { name: /Buka Shift Kasir Baru/i });
      fireEvent.click(openBtn);
      expect(onOpen).toHaveBeenCalled();
    });

    it('renders active shift metrics when shift is open', () => {
      const onClose = vi.fn();
      render(
        <ShiftSummaryCard
          currentShift={mockShift}
          isLoading={false}
          onOpenShiftClick={vi.fn()}
          onCloseShiftClick={onClose}
        />
      );

      expect(screen.getByText('Shift Kasir Aktif')).toBeInTheDocument();
      expect(screen.getByText(/Budi Kasir/)).toBeInTheDocument();
      const closeBtn = screen.getByRole('button', { name: /Tutup Shift & Z-Report/i });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('ShiftHistoryTable', () => {
    it('renders shift rows with variance badges and allows viewing Z-report', () => {
      const onViewZ = vi.fn();
      const closedShift: ShiftItem = {
        ...mockShift,
        status: 'CLOSED',
        closedAt: '2026-08-25T16:00:00.000Z',
      };

      render(
        <ShiftHistoryTable
          shifts={[closedShift]}
          isLoading={false}
          onViewZReport={onViewZ}
        />
      );

      expect(screen.getByText('Budi Kasir')).toBeInTheDocument();
      expect(screen.getByText('Klop (Rp 0)')).toBeInTheDocument();

      const viewBtn = screen.getByRole('button', { name: /Struk Z/i });
      fireEvent.click(viewBtn);
      expect(onViewZ).toHaveBeenCalledWith(closedShift);
    });

    it('renders empty message when no history records', () => {
      render(
        <ShiftHistoryTable
          shifts={[]}
          isLoading={false}
          onViewZReport={vi.fn()}
        />
      );

      expect(screen.getByText('Belum ada riwayat shift yang tersimpan')).toBeInTheDocument();
    });
  });

  describe('OpenShiftModal', () => {
    it('renders opening cash input and quick presets', () => {
      renderWithQuery(
        <OpenShiftModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Buka Shift Kasir')).toBeInTheDocument();
      expect(screen.getByText(/Kas Modal Awal/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Buka Shift Sekarang/i })).toBeInTheDocument();
    });
  });

  describe('CloseShiftModal', () => {
    it('renders expected cash summary and auto calculates variance', () => {
      renderWithQuery(
        <CloseShiftModal
          isOpen={true}
          onClose={vi.fn()}
          shift={mockShift}
          onShiftClosed={vi.fn()}
        />
      );

      expect(screen.getByText('Tutup Shift & Rekonsiliasi Kas')).toBeInTheDocument();
      expect(screen.getByText('Total Kas Harapan di Laci:')).toBeInTheDocument();
      expect(screen.getByText('Kas Sempurna / Klop')).toBeInTheDocument();
    });
  });

  describe('ZReportReceiptModal', () => {
    it('renders thermal receipt details and print button', () => {
      const closedShift: ShiftItem = {
        ...mockShift,
        status: 'CLOSED',
        closedAt: '2026-08-25T16:00:00.000Z',
      };

      render(
        <ZReportReceiptModal
          isOpen={true}
          onClose={vi.fn()}
          shift={closedShift}
        />
      );

      expect(screen.getByText('KUMPUL CAFE')).toBeInTheDocument();
      expect(screen.getByText('Z-REPORT (TUTUP SHIFT)')).toBeInTheDocument();
      expect(screen.getByText(/TOTAL OMSET SHIFT/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cetak Struk Z-Report/i })).toBeInTheDocument();
    });
  });
});
