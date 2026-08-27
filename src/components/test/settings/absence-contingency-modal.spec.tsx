import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AbsenceContingencyModal } from '@/components/settings/absence-contingency-modal';
import * as staffHooks from '@/hooks/queries/use-admin-staff';
import * as settingsHooks from '@/hooks/queries/use-admin-settings';
import { ROLE } from '@/lib/constants/roles';
import { STORE_MODE } from '@/lib/constants/branch-settings';
import { toast } from 'sonner';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AbsenceContingencyModal Component', () => {
  const mockStaffList = [
    {
      id: 'staff-1',
      name: 'Ahmad Barista',
      role: ROLE.KITCHEN,
      isActive: true,
    },
    {
      id: 'staff-2',
      name: 'Rudi Waiter',
      role: ROLE.WAITER,
      isActive: true,
    },
    {
      id: 'staff-3',
      name: 'Admin Boss',
      role: ROLE.ADMIN,
      isActive: true,
    },
  ];

  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(staffHooks, 'useAdminStaffPaginatedQuery').mockReturnValue({
      data: { items: mockStaffList, total: 3, page: 1, limit: 100, totalPages: 1 },
      isLoading: false,
    } as any);

    vi.spyOn(settingsHooks, 'useUpdateStoreStatusMutation').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  it('renders modal header, warning text, and 3 contingency options', () => {
    render(
      <AbsenceContingencyModal
        isOpen={true}
        onClose={vi.fn()}
        openTime="08:00"
        lateGracePeriod={15}
      />
    );

    expect(screen.getByText('Peringatan Operasional: Kasir Belum Hadir')).toBeInTheDocument();
    expect(screen.getByText(/Opsi A: Tunjuk Staf Pengganti/i)).toBeInTheDocument();
    expect(screen.getByText(/Opsi B: Buka Mode Mandiri \(QRIS Only\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Opsi C: Tutup Kafe Hari Ini/i)).toBeInTheDocument();
  });

  it('shows error toast if user executes acting cashier without selecting staff', () => {
    render(
      <AbsenceContingencyModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const executeBtn = screen.getByRole('button', { name: /Eksekusi Tindakan/i });
    fireEvent.click(executeBtn);

    expect(toast.error).toHaveBeenCalledWith('Pilih staf pengganti terlebih dahulu.');
  });

  it('switches to QRIS Only option and triggers store status mutation', async () => {
    const onClose = vi.fn();
    mockMutateAsync.mockResolvedValue({});

    render(
      <AbsenceContingencyModal
        isOpen={true}
        onClose={onClose}
      />
    );

    const qrisOptionCard = screen.getByText(/Opsi B: Buka Mode Mandiri \(QRIS Only\)/i);
    fireEvent.click(qrisOptionCard);

    const executeBtn = screen.getByRole('button', { name: /Eksekusi Tindakan/i });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        isStoreOpen: true,
        storeMode: STORE_MODE.QRIS_ONLY,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('switches to Emergency Close option with custom message and triggers store status mutation', async () => {
    const onClose = vi.fn();
    mockMutateAsync.mockResolvedValue({});

    render(
      <AbsenceContingencyModal
        isOpen={true}
        onClose={onClose}
      />
    );

    const closeOptionCard = screen.getByText(/Opsi C: Tutup Kafe Hari Ini/i);
    fireEvent.click(closeOptionCard);

    const textarea = screen.getByPlaceholderText(/Kafe tutup sementara hari ini/i);
    fireEvent.change(textarea, { target: { value: 'Mati Lampu Total' } });

    const executeBtn = screen.getByRole('button', { name: /Eksekusi Tindakan/i });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        isStoreOpen: false,
        storeMode: STORE_MODE.EMERGENCY_CLOSED,
        emergencyReason: 'Mati Lampu Total',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
