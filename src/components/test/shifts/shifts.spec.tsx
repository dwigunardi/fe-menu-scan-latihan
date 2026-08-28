import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ShiftSummaryCard,
  ShiftHistoryTable,
  OpenShiftModal,
  CloseShiftModal,
  ZReportReceiptModal,
} from '@/components/shifts';
import { ShiftItem } from '@/lib/validations/shift.schema';
import * as shiftHooks from '@/hooks/queries/use-admin-shifts';

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

  const mockOpenMutate = vi.fn();
  const mockCloseMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(shiftHooks, 'useOpenShiftMutation').mockReturnValue({
      mutateAsync: mockOpenMutate,
      isPending: false,
    } as any);

    vi.spyOn(shiftHooks, 'useCloseShiftMutation').mockReturnValue({
      mutateAsync: mockCloseMutate,
      isPending: false,
    } as any);
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
    it('renders opening cash input and quick presets, and submits form successfully', async () => {
      mockOpenMutate.mockResolvedValue(mockShift);
      const onClose = vi.fn();
      const onSuccess = vi.fn();

      renderWithQuery(
        <OpenShiftModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      expect(screen.getByText('Buka Shift Kasir')).toBeInTheDocument();

      // Click preset
      const presetBtns = screen.getAllByRole('button');
      const preset500k = presetBtns.find((b) => b.textContent?.includes('500.000'));
      if (preset500k) {
        fireEvent.click(preset500k);
      }

      // Custom cash input
      const cashInput = screen.getByPlaceholderText('200.000');
      fireEvent.change(cashInput, { target: { value: '300000' } });

      // Enter notes
      const notesInput = screen.getByPlaceholderText(/Contoh: Tambahan uang receh/i);
      fireEvent.change(notesInput, { target: { value: 'Pecahan lengkap 5rb dan 10rb' } });

      const submitBtn = screen.getByRole('button', { name: /Buka Shift Sekarang/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOpenMutate).toHaveBeenCalledWith({
          openingCash: 300000,
          notes: 'Pecahan lengkap 5rb dan 10rb',
        });
        expect(onClose).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('CloseShiftModal', () => {
    it('renders expected cash summary, handles actual cash variance, and submits reconciliation', async () => {
      const closedShiftResult: ShiftItem = {
        ...mockShift,
        actualCash: 360000,
        cashVariance: 10000,
        status: 'CLOSED',
        closedAt: '2026-08-25T16:00:00.000Z',
      };
      mockCloseMutate.mockResolvedValue(closedShiftResult);
      const onShiftClosed = vi.fn();

      renderWithQuery(
        <CloseShiftModal
          isOpen={true}
          onClose={vi.fn()}
          shift={mockShift}
          onShiftClosed={onShiftClosed}
        />
      );

      expect(screen.getByText('Tutup Shift & Rekonsiliasi Kas')).toBeInTheDocument();
      expect(screen.getByText('Total Kas Harapan di Laci:')).toBeInTheDocument();

      // Input actual cash with surplus
      const cashInput = screen.getByDisplayValue('350.000');
      fireEvent.change(cashInput, { target: { value: '360000' } });

      expect(screen.getByText(/Kas Lebih \(Overage\)/i)).toBeInTheDocument();

      // Input actual cash with deficit
      fireEvent.change(cashInput, { target: { value: '340000' } });
      expect(screen.getByText(/Kas Kurang \(Shortage\)/i)).toBeInTheDocument();

      // Add notes
      const notesInput = screen.getByPlaceholderText(/Catatan kendala atau rincian selisih/i);
      fireEvent.change(notesInput, { target: { value: 'Kurang uang receh 10rb untuk tips' } });

      const submitBtn = screen.getByRole('button', { name: /Tutup Shift & Cetak Z-Report/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCloseMutate).toHaveBeenCalledWith({
          shiftId: mockShift.id,
          payload: {
            actualCash: 340000,
            notes: 'Kurang uang receh 10rb untuk tips',
          },
        });
        expect(onShiftClosed).toHaveBeenCalledWith(closedShiftResult);
      });
    });
  });

  describe('ZReportReceiptModal', () => {
    it('returns null when shift is not provided', () => {
      const { container } = render(
        <ZReportReceiptModal isOpen={true} onClose={vi.fn()} shift={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders thermal receipt details, variance status, and triggers print', () => {
      window.print = vi.fn();
      const closedShift: ShiftItem = {
        ...mockShift,
        actualCash: 340000,
        cashVariance: -10000,
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
      expect(screen.getByText(/SELISIH \(VARIANCE\):/i)).toBeInTheDocument();

      const printBtn = screen.getByRole('button', { name: /Cetak Struk Z-Report/i });
      fireEvent.click(printBtn);

      expect(window.print).toHaveBeenCalled();
    });
  });
});
