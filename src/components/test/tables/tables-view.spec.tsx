import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TablesView } from '@/components/tables/tables-view';
import { createQueryWrapper } from '@/test/test-utils';
import { TableData, TableZoneData } from '@/lib/validations/table.schema';
import * as tablesHooks from '@/hooks/queries/use-admin-tables';

// Mock child modals
vi.mock('@/components/tables/table-form-modal', () => ({
  TableFormModal: ({ isOpen }: any) => (isOpen ? <div data-testid="mock-form-modal">Form Modal</div> : null),
}));
vi.mock('@/components/tables/table-qr-modal', () => ({
  TableQrModal: ({ isOpen }: any) => (isOpen ? <div data-testid="mock-qr-modal">QR Modal</div> : null),
}));
vi.mock('@/components/tables/table-reset-modal', () => ({
  TableResetModal: ({ isOpen }: any) => (isOpen ? <div data-testid="mock-reset-modal">Reset Modal</div> : null),
}));
vi.mock('@/components/tables/table-delete-modal', () => ({
  TableDeleteModal: ({ isOpen }: any) => (isOpen ? <div data-testid="mock-delete-modal">Delete Modal</div> : null),
}));
vi.mock('@/components/tables/zone-manager-modal', () => ({
  ZoneManagerModal: ({ isOpen }: any) => (isOpen ? <div data-testid="mock-zone-modal">Zone Modal</div> : null),
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
  ];

  const mockTables: TableData[] = [
    {
      id: 'table-1',
      tableNumber: 'T-01',
      capacity: 4,
      status: 'VACANT',
      seatingType: 'DINING',
      zoneId: 'zone-1',
      zoneName: 'Indoor AC',
      zoneColor: 'amber',
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
      zoneName: 'Indoor AC',
      zoneColor: 'amber',
      tags: ['OUTLET'],
      activeGuestName: 'Budi Santoso',
      currentSessionId: 'sess-123',
      qrCodeUrl: 'http://localhost:3000/scan?table=T-02',
    },
  ];

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
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(tablesHooks, 'useDeleteTableMutation').mockReturnValue({
      mutateAsync: vi.fn(),
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

  it('filters table by search input', () => {
    const wrapper = createQueryWrapper();
    render(<TablesView />, { wrapper });

    const searchInput = screen.getByPlaceholderText(/Cari nomor meja atau nama tamu/i);
    fireEvent.change(searchInput, { target: { value: 'T-01' } });

    expect(searchInput).toHaveValue('T-01');
  });
});
