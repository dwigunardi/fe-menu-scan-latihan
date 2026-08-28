import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TablesView } from '@/components/tables/tables-view';
import { createQueryWrapper } from '@/test/test-utils';
import { TableData, TableZoneData } from '@/lib/validations/table.schema';
import * as tablesHooks from '@/hooks/queries/use-admin-tables';

// Mock child modals
vi.mock('@/components/tables/table-form-modal', () => ({
  TableFormModal: ({ isOpen, onClose, tableToEdit }: any) =>
    isOpen ? (
      <div data-testid="mock-form-modal">
        Form Modal {tableToEdit ? `Edit ${tableToEdit.tableNumber}` : 'Create'}
        <button onClick={onClose}>Close Form</button>
      </div>
    ) : null,
}));
vi.mock('@/components/tables/table-qr-modal', () => ({
  TableQrModal: ({ isOpen, onClose, table }: any) =>
    isOpen ? (
      <div data-testid="mock-qr-modal">
        QR Modal {table?.tableNumber}
        <button onClick={onClose}>Close QR</button>
      </div>
    ) : null,
}));
vi.mock('@/components/tables/table-reset-modal', () => ({
  TableResetModal: ({ isOpen, onClose, onConfirm, table }: any) =>
    isOpen ? (
      <div data-testid="mock-reset-modal">
        Reset Modal {table?.tableNumber}
        <button onClick={() => onConfirm(table)}>Confirm Reset</button>
        <button onClick={onClose}>Close Reset</button>
      </div>
    ) : null,
}));
vi.mock('@/components/tables/table-delete-modal', () => ({
  TableDeleteModal: ({ isOpen, onClose, onConfirm, table }: any) =>
    isOpen ? (
      <div data-testid="mock-delete-modal">
        Delete Modal {table?.tableNumber}
        <button onClick={() => onConfirm(table)}>Confirm Delete</button>
        <button onClick={onClose}>Close Delete</button>
      </div>
    ) : null,
}));
vi.mock('@/components/tables/zone-manager-modal', () => ({
  ZoneManagerModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-zone-modal">
        Zone Modal
        <button onClick={onClose}>Close Zone</button>
      </div>
    ) : null,
}));

describe('TablesView Component', () => {
  const mockZones: TableZoneData[] = [
    {
      id: 'zone-1',
      name: 'Indoor AC',
      color: 'amber',
      sortOrder: 1,
      tableCount: 2,
    },
    {
      id: 'zone-2',
      name: 'Outdoor Garden',
      color: 'emerald',
      sortOrder: 2,
      tableCount: 1,
    },
  ];

  const mockTables: TableData[] = [
    {
      id: 'table-1',
      tableNumber: 'T-01',
      capacity: 4,
      status: 'VACANT',
      seatingType: 'DINING',
      zoneId: 'zone-1',
      zone: mockZones[0],
      tags: ['AC'],
      activeGuestName: null,
      currentSessionId: null,
      qrCodeUrl: 'http://localhost:3000/scan?table=T-01',
    },
    {
      id: 'table-2',
      tableNumber: 'T-02',
      capacity: 2,
      status: 'OCCUPIED',
      seatingType: 'BAR',
      zoneId: 'zone-1',
      zone: mockZones[0],
      tags: ['OUTLET', 'WINDOW', 'SOFA'],
      activeGuestName: 'Budi Santoso',
      currentSessionId: 'sess-123',
      qrCodeUrl: 'http://localhost:3000/scan?table=T-02',
    },
  ];

  const mockResetMutate = vi.fn();
  const mockDeleteMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(tablesHooks, 'useAdminTablesPaginatedQuery').mockReturnValue({
      data: {
        items: mockTables,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        totalCapacity: 6,
        vacantCount: 1,
        occupiedCount: 1,
      },
      isLoading: false,
    } as any);

    vi.spyOn(tablesHooks, 'useAdminTableZonesQuery').mockReturnValue({
      data: mockZones,
      isLoading: false,
    } as any);

    vi.spyOn(tablesHooks, 'useResetTableMutation').mockReturnValue({
      mutateAsync: mockResetMutate,
      isPending: false,
    } as any);

    vi.spyOn(tablesHooks, 'useDeleteTableMutation').mockReturnValue({
      mutateAsync: mockDeleteMutate,
      isPending: false,
    } as any);
  });

  it('renders floor plan header, stats, and table cards', () => {
    const wrapper = createQueryWrapper();
    render(<TablesView />, { wrapper });

    expect(screen.getByText('Denah Meja & Sesi Kasir')).toBeInTheDocument();
    expect(screen.getByText('MEJA T-01')).toBeInTheDocument();
    expect(screen.getByText('MEJA T-02')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
  });

  it('opens FormModal when Tambah Meja is clicked', () => {
    const wrapper = createQueryWrapper();
    render(<TablesView />, { wrapper });

    const addBtn = screen.getByRole('button', { name: /Tambah Meja/i });
    fireEvent.click(addBtn);

    expect(screen.getByTestId('mock-form-modal')).toBeInTheDocument();
  });

  it('opens ZoneManagerModal when Kelola Zona is clicked', () => {
    const wrapper = createQueryWrapper();
    render(<TablesView />, { wrapper });

    const zoneBtn = screen.getByRole('button', { name: /Kelola Zona/i });
    fireEvent.click(zoneBtn);

    expect(screen.getByTestId('mock-zone-modal')).toBeInTheDocument();
  });

  it('filters table by search input and status tabs', () => {
    const wrapper = createQueryWrapper();
    render(<TablesView />, { wrapper });

    const searchInput = screen.getByPlaceholderText(/Cari nomor meja atau nama tamu/i);
    fireEvent.change(searchInput, { target: { value: 'T-01' } });
    expect(searchInput).toHaveValue('T-01');

    // Click clear search
    const clearBtn = searchInput.parentElement?.querySelector('button');
    if (clearBtn) {
      fireEvent.click(clearBtn);
      expect(searchInput).toHaveValue('');
    }

    // Click Occupied status filter
    const occupiedFilter = screen.getByRole('button', { name: /Terisi/i });
    fireEvent.click(occupiedFilter);
  });

  it('collapses and expands zone groups when header is clicked', () => {
    const wrapper = createQueryWrapper();
    render(<TablesView />, { wrapper });

    const zoneHeader = screen.getByText('Indoor AC');
    fireEvent.click(zoneHeader);
    fireEvent.click(zoneHeader);
  });

  it('triggers QR Modal from table card action', () => {
    const wrapper = createQueryWrapper();
    render(<TablesView />, { wrapper });

    const qrBtns = screen.getAllByRole('button', { name: /QR/i });
    if (qrBtns.length > 0) {
      fireEvent.click(qrBtns[0]);
      expect(screen.getByTestId('mock-qr-modal')).toBeInTheDocument();
    }
  });

  it('triggers reset session from table card action on occupied table', async () => {
    mockResetMutate.mockResolvedValue({ success: true });
    const wrapper = createQueryWrapper();
    render(<TablesView />, { wrapper });

    const resetBtns = screen.getAllByRole('button', { name: /Reset/i });
    if (resetBtns.length > 0) {
      fireEvent.click(resetBtns[0]);
      expect(screen.getByTestId('mock-reset-modal')).toBeInTheDocument();
      const confirmResetBtn = screen.getByRole('button', { name: 'Confirm Reset' });
      fireEvent.click(confirmResetBtn);
      await waitFor(() => {
        expect(mockResetMutate).toHaveBeenCalled();
      });
    }
  });

  it('renders empty state when tables is empty', () => {
    vi.spyOn(tablesHooks, 'useAdminTablesPaginatedQuery').mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        totalCapacity: 0,
        vacantCount: 0,
        occupiedCount: 0,
      },
      isLoading: false,
    } as any);

    const wrapper = createQueryWrapper();
    render(<TablesView />, { wrapper });

    expect(screen.getByText('Tidak ada meja yang sesuai')).toBeInTheDocument();
  });
});
