import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TableFormModal } from './table-form-modal';
import { TableQrModal } from './table-qr-modal';
import { TableResetModal } from './table-reset-modal';
import { TableDeleteModal } from './table-delete-modal';
import { ZoneManagerModal } from './zone-manager-modal';
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
  seatingType: 'DINING',
  tags: [],
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
    it('renders in Create mode with empty initial fields and default capacity 4', () => {
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
      expect(screen.getByPlaceholderText('Contoh: 01, T-01, VIP-1')).toHaveValue('');
      expect(screen.getByPlaceholderText('Contoh: 4')).toHaveValue(4);
    });

    it('allows clearing capacity input and typing new number without leading zero bug', () => {
      const wrapper = createQueryWrapper();
      render(
        <TableFormModal
          isOpen={true}
          onClose={vi.fn()}
          tableToEdit={null}
        />,
        { wrapper }
      );

      const capacityInput = screen.getByPlaceholderText('Contoh: 4');
      
      // User deletes the 4
      fireEvent.change(capacityInput, { target: { value: '' } });
      expect(capacityInput).toHaveValue(null);

      // User types 2
      fireEvent.change(capacityInput, { target: { value: '2' } });
      expect(capacityInput).toHaveValue(2);
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
      expect(screen.getByPlaceholderText('Contoh: 01, T-01, VIP-1')).toHaveValue('T-01');
      expect(screen.getByPlaceholderText('Contoh: 4')).toHaveValue(4);
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

      const tableNumberInput = screen.getByPlaceholderText('Contoh: 01, T-01, VIP-1');
      fireEvent.change(tableNumberInput, { target: { value: 'T-02' } });

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

  describe('ZoneManagerModal', () => {
    it('renders zone manager with list of active zones', async () => {
      const wrapper = createQueryWrapper();
      render(
        <ZoneManagerModal
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper }
      );

      expect(screen.getByText('Kelola Zona & Area Kafe')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Indoor (AC Non-Smoking)')).toBeInTheDocument();
      });
    });

    it('allows typing new zone name and submitting form', async () => {
      const wrapper = createQueryWrapper();
      render(
        <ZoneManagerModal
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper }
      );

      const nameInput = screen.getByPlaceholderText('Misal: Outdoor Garden, VIP Room');
      fireEvent.change(nameInput, { target: { value: 'Rooftop Lounge' } });

      const submitBtn = screen.getByRole('button', { name: /Tambah Zona/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('berhasil ditambahkan')
        );
      });
    });
  });
});
