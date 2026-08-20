import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TableFormModal } from './table-form-modal';
import { TableQrModal } from './table-qr-modal';
import { createQueryWrapper } from '../../test/test-utils';
import { TableData } from '@/lib/validations/table.schema';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockTable: TableData = {
  id: 'table-1',
  tableNumber: 'T-01',
  capacity: 4,
  status: 'VACANT',
  activeGuestName: null,
  currentSessionId: null,
  qrCodeUrl: 'http://localhost:3000/scan?table=T-01',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('Table Modals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TableFormModal', () => {
    it('renders in Create mode with empty initial fields', () => {
      const wrapper = createQueryWrapper();
      render(
        <TableFormModal
          isOpen={true}
          onClose={vi.fn()}
          tableToEdit={null}
        />,
        { wrapper }
      );

      expect(screen.getByText('Tambah Meja Baru')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Contoh: T-01, 01, VIP-1')).toHaveValue('');
    });

    it('renders in Edit mode with pre-filled table data', () => {
      const wrapper = createQueryWrapper();
      render(
        <TableFormModal
          isOpen={true}
          onClose={vi.fn()}
          tableToEdit={mockTable}
        />,
        { wrapper }
      );

      expect(screen.getByText('Edit Meja T-01')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Contoh: T-01, 01, VIP-1')).toHaveValue('T-01');
    });

    it('submits form successfully and closes modal', async () => {
      const onClose = vi.fn();
      const wrapper = createQueryWrapper();
      render(
        <TableFormModal
          isOpen={true}
          onClose={onClose}
          tableToEdit={null}
        />,
        { wrapper }
      );

      const tableNumberInput = screen.getByPlaceholderText('Contoh: T-01, 01, VIP-1');
      fireEvent.change(tableNumberInput, { target: { value: 'T-05' } });

      const submitBtn = screen.getByRole('button', { name: /Tambah Meja/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('TableQrModal', () => {
    it('renders QR Sticker template with table number and cafe brand', () => {
      render(
        <TableQrModal
          isOpen={true}
          onClose={vi.fn()}
          table={mockTable}
        />
      );

      expect(screen.getByText('Stiker QR Meja T-01')).toBeInTheDocument();
      expect(screen.getByText('MEJA T-01')).toBeInTheDocument();
      expect(screen.getByText('Kumpul Cafe & Resto')).toBeInTheDocument();
      expect(screen.getByText('Pindai untuk Pesan Menu')).toBeInTheDocument();
    });

    it('triggers print dialog when Cetak Stiker Meja is clicked', () => {
      window.print = vi.fn();

      render(
        <TableQrModal
          isOpen={true}
          onClose={vi.fn()}
          table={mockTable}
        />
      );

      const printBtn = screen.getByRole('button', { name: /Cetak Stiker Meja/i });
      fireEvent.click(printBtn);

      expect(window.print).toHaveBeenCalled();
    });

    it('triggers PNG download when Download PNG is clicked', () => {
      // Mock HTMLCanvasElement toDataURL
      HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,fake');

      render(
        <TableQrModal
          isOpen={true}
          onClose={vi.fn()}
          table={mockTable}
        />
      );

      const downloadBtn = screen.getByRole('button', { name: /Download PNG/i });
      fireEvent.click(downloadBtn);

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('berhasil diunduh')
      );
    });
  });
});
