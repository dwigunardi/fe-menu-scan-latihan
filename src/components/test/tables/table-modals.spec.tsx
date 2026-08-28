import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TableFormModal,
  TableQrModal,
  TableResetModal,
  TableDeleteModal,
  ZoneManagerModal,
} from '@/components/tables';
import { createQueryWrapper } from '@/test/test-utils';
import { TableData, TableZoneData } from '@/lib/validations/table.schema';
import { toast } from 'sonner';
import * as tablesApi from '@/lib/api/admin-tables-api';
import { right } from '@/lib/api/either';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api/admin-tables-api', () => ({
  getAdminTables: vi.fn(),
  getAdminTablesPaginated: vi.fn(),
  getAdminTableZones: vi.fn(),
  createAdminTable: vi.fn(),
  updateAdminTable: vi.fn(),
  resetAdminTable: vi.fn(),
  deleteAdminTable: vi.fn(),
  createAdminTableZone: vi.fn(),
  updateAdminTableZone: vi.fn(),
  deleteAdminTableZone: vi.fn(),
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

const mockZones: TableZoneData[] = [
  {
    id: 'zone-1',
    name: 'Indoor (AC Non-Smoking)',
    description: 'Lantai 1 Utama',
    color: 'amber',
    sortOrder: 1,
    tableCount: 8,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'zone-2',
    name: 'Outdoor Garden',
    description: 'Area taman luar',
    color: 'emerald',
    sortOrder: 2,
    tableCount: 4,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

describe('Table Modals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tablesApi.getAdminTableZones).mockResolvedValue(right(mockZones));
    vi.mocked(tablesApi.createAdminTable).mockResolvedValue(right(mockTable));
    vi.mocked(tablesApi.updateAdminTable).mockResolvedValue(right(mockTable));
    vi.mocked(tablesApi.createAdminTableZone).mockResolvedValue(right(mockZones[0]));
    vi.mocked(tablesApi.updateAdminTableZone).mockResolvedValue(right(mockZones[0]));
    vi.mocked(tablesApi.deleteAdminTableZone).mockResolvedValue(right({ success: true }));
  });

  describe('TableFormModal', () => {
    it('renders in Create mode with empty initial fields and default capacity 4', async () => {
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

    it('allows clearing capacity input and typing new number without leading zero bug', async () => {
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

    it('renders in Edit mode with pre-filled table data', async () => {
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

  describe('TableResetModal', () => {
    it('returns null when table is null', () => {
      const { container } = render(
        <TableResetModal
          isOpen={true}
          onClose={vi.fn()}
          table={null}
          onConfirm={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders confirmation text with table number and triggers confirm callback', async () => {
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(
        <TableResetModal
          isOpen={true}
          onClose={onClose}
          table={{ ...mockTable, tableNumber: 'MEJA 05', activeGuestName: 'Dwi', currentSessionId: 'sess-123' }}
          onConfirm={onConfirm}
        />
      );

      expect(screen.getByText(/Reset Sesi MEJA 05\?/i)).toBeInTheDocument();
      expect(screen.getByText('Dwi')).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /Ya, Kosongkan Meja/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('renders loading state when isPending is true', () => {
      render(
        <TableResetModal
          isOpen={true}
          onClose={vi.fn()}
          table={mockTable}
          onConfirm={vi.fn()}
          isPending={true}
        />
      );

      expect(screen.getByText('Mereset...')).toBeInTheDocument();
    });
  });

  describe('TableDeleteModal', () => {
    it('returns null when table is null', () => {
      const { container } = render(
        <TableDeleteModal
          isOpen={true}
          onClose={vi.fn()}
          table={null}
          onConfirm={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders delete warning and triggers delete confirmation callback', async () => {
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(
        <TableDeleteModal
          isOpen={true}
          onClose={onClose}
          table={{ ...mockTable, tableNumber: 'MEJA VIP' }}
          onConfirm={onConfirm}
        />
      );

      expect(screen.getByText(/Hapus MEJA VIP\?/i)).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', { name: /Hapus Meja/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('renders loading state when isPending is true', () => {
      render(
        <TableDeleteModal
          isOpen={true}
          onClose={vi.fn()}
          table={mockTable}
          onConfirm={vi.fn()}
          isPending={true}
        />
      );

      expect(screen.getByText('Menghapus...')).toBeInTheDocument();
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
      expect(await screen.findByText('Indoor (AC Non-Smoking)')).toBeInTheDocument();
    });

    it('allows typing new zone name and description, choosing color, and submitting form', async () => {
      const wrapper = createQueryWrapper();
      render(
        <ZoneManagerModal
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper }
      );

      expect(await screen.findByText('Indoor (AC Non-Smoking)')).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText('Misal: Outdoor Garden, VIP Room');
      fireEvent.change(nameInput, { target: { value: 'Rooftop Lounge' } });

      const descInput = screen.getByPlaceholderText('Misal: Area merokok, asri');
      fireEvent.change(descInput, { target: { value: 'Area santai lantai 3' } });

      const submitBtn = screen.getByRole('button', { name: /Tambah Zona/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(tablesApi.createAdminTableZone).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Rooftop Lounge',
            description: 'Area santai lantai 3',
          })
        );
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('berhasil ditambahkan')
        );
      });
    });

    it('handles editing an existing zone, submitting updates, and canceling edit', async () => {
      const wrapper = createQueryWrapper();
      render(
        <ZoneManagerModal
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper }
      );

      const zoneText = await screen.findByText('Indoor (AC Non-Smoking)');
      const zoneContainer = zoneText.closest('div.border') || zoneText.parentElement?.parentElement?.parentElement;
      const buttons = zoneContainer?.querySelectorAll('button') || [];
      const editBtn = Array.from(buttons).find((b) => b.querySelector('svg'));

      if (editBtn) {
        fireEvent.click(editBtn);
        expect(await screen.findByText(/Simpan Perubahan/i)).toBeInTheDocument();

        // Update name and submit
        const nameInput = screen.getByPlaceholderText('Misal: Outdoor Garden, VIP Room');
        fireEvent.change(nameInput, { target: { value: 'Indoor AC VIP Updated' } });

        const saveBtn = screen.getByRole('button', { name: /Simpan Perubahan/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(tablesApi.updateAdminTableZone).toHaveBeenCalledWith(
            'zone-1',
            expect.objectContaining({ name: 'Indoor AC VIP Updated' })
          );
        });

        // Re-open edit and cancel
        fireEvent.click(editBtn);
        const cancelEditBtn = await screen.findByRole('button', { name: /Batal Edit/i });
        fireEvent.click(cancelEditBtn);
        expect(screen.getByRole('button', { name: /Tambah Zona/i })).toBeInTheDocument();
      }
    });

    it('handles deleting a zone with confirm true and false', async () => {
      const wrapper = createQueryWrapper();
      render(
        <ZoneManagerModal
          isOpen={true}
          onClose={vi.fn()}
        />,
        { wrapper }
      );

      const zoneText = await screen.findByText('Indoor (AC Non-Smoking)');
      const zoneContainer = zoneText.closest('div.border') || zoneText.parentElement?.parentElement?.parentElement;
      const buttons = zoneContainer?.querySelectorAll('button') || [];
      const deleteBtn = Array.from(buttons).reverse().find((b) => b.querySelector('svg'));

      if (deleteBtn) {
        // Mock window.confirm
        window.confirm = vi.fn(() => false);
        fireEvent.click(deleteBtn);
        expect(tablesApi.deleteAdminTableZone).not.toHaveBeenCalled();

        window.confirm = vi.fn(() => true);
        fireEvent.click(deleteBtn);
        await waitFor(() => {
          expect(tablesApi.deleteAdminTableZone).toHaveBeenCalledWith('zone-1');
        });
      }
    });

    it('triggers onClose when Tutup button is clicked', () => {
      const onClose = vi.fn();
      const wrapper = createQueryWrapper();
      render(
        <ZoneManagerModal
          isOpen={true}
          onClose={onClose}
        />,
        { wrapper }
      );

      const closeBtn = screen.getByRole('button', { name: 'Tutup' });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
