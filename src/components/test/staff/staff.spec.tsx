import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StaffTable, StaffFormModal, StaffPinModal } from '@/components/staff';
import { StaffItem } from '@/lib/validations/staff.schema';
import { ROLE } from '@/lib/constants/roles';

describe('Staff Domain Components', () => {
  const mockStaff: StaffItem[] = [
    {
      id: 'staff-1',
      name: 'Ahmad Syahripudin',
      email: 'ahmad@kumpulcafe.com',
      phone: '+6281234567890',
      role: ROLE.KITCHEN,
      pinCodeSet: true,
      dailyShiftHours: 8,
      isActive: true,
      avatarUrl: null,
      isEmailVerified: true,
      isPhoneVerified: true,
      joinedAt: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'staff-2',
      name: 'Siti Rahmawati',
      email: 'siti@kumpulcafe.com',
      phone: '+6281298765432',
      role: ROLE.CASHIER,
      pinCodeSet: false,
      dailyShiftHours: 8,
      isActive: false,
      avatarUrl: null,
      isEmailVerified: false,
      isPhoneVerified: false,
      joinedAt: '2026-02-15T08:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StaffTable', () => {
    it('renders staff list with names, roles, and WhatsApp contact properly', () => {
      render(
        <StaffTable
          staff={mockStaff}
          isLoading={false}
          onEditStaff={vi.fn()}
          onChangePin={vi.fn()}
          onToggleStatus={vi.fn()}
          onDeleteStaff={vi.fn()}
        />
      );

      expect(screen.getAllByText('Ahmad Syahripudin').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('ahmad@kumpulcafe.com').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Kitchen & Barista').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('+6281234567890').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('PIN Aktif').length).toBeGreaterThanOrEqual(1);

      expect(screen.getAllByText('Siti Rahmawati').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Kasir Front POS').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Belum Ada').length).toBeGreaterThanOrEqual(1);
    });

    it('renders loading state properly with table skeletons', () => {
      const { container } = render(
        <StaffTable
          staff={[]}
          isLoading={true}
          onEditStaff={vi.fn()}
          onChangePin={vi.fn()}
          onToggleStatus={vi.fn()}
          onDeleteStaff={vi.fn()}
        />
      );

      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('renders empty state when staff array is empty', () => {
      render(
        <StaffTable
          staff={[]}
          isLoading={false}
          onEditStaff={vi.fn()}
          onChangePin={vi.fn()}
          onToggleStatus={vi.fn()}
          onDeleteStaff={vi.fn()}
        />
      );

      expect(screen.getByText('Tidak Ada Karyawan Ditemukan')).toBeInTheDocument();
    });

    it('triggers action callbacks (edit, change pin, toggle status, delete)', () => {
      const onEditStaff = vi.fn();
      const onChangePin = vi.fn();
      const onToggleStatus = vi.fn();
      const onDeleteStaff = vi.fn();

      render(
        <StaffTable
          staff={mockStaff}
          isLoading={false}
          onEditStaff={onEditStaff}
          onChangePin={onChangePin}
          onToggleStatus={onToggleStatus}
          onDeleteStaff={onDeleteStaff}
        />
      );

      const editButtons = screen.getAllByTitle('Edit Profil');
      fireEvent.click(editButtons[0]);
      expect(onEditStaff).toHaveBeenCalledWith(mockStaff[0]);

      const pinButtons = screen.getAllByTitle('Ubah PIN 4-Digit');
      fireEvent.click(pinButtons[0]);
      expect(onChangePin).toHaveBeenCalledWith(mockStaff[0]);

      const deleteButtons = screen.getAllByTitle('Hapus Akun');
      fireEvent.click(deleteButtons[0]);
      expect(onDeleteStaff).toHaveBeenCalledWith(mockStaff[0]);
    });
  });

  describe('StaffFormModal', () => {
    it('renders in Create mode and allows submission', async () => {
      const onSubmitCreate = vi.fn();
      render(
        <StaffFormModal
          isOpen={true}
          onClose={vi.fn()}
          staffToEdit={null}
          onSubmitCreate={onSubmitCreate}
          onSubmitUpdate={vi.fn()}
          isSubmitting={false}
        />
      );

      expect(screen.getByText('Tambah Karyawan Baru')).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText('Contoh: Ahmad Syahripudin'), {
        target: { value: 'Budi Hartono' },
      });
      fireEvent.change(screen.getByPlaceholderText('ahmad@kumpulcafe.com'), {
        target: { value: 'budi@kumpulcafe.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('081234567890'), {
        target: { value: '081299998888' },
      });
      fireEvent.change(screen.getByPlaceholderText('Min. 6 karakter'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText('Contoh: 1234'), {
        target: { value: '1234' },
      });

      fireEvent.click(screen.getByText('Daftarkan Karyawan'));

      await waitFor(() => {
        expect(onSubmitCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Budi Hartono',
            email: 'budi@kumpulcafe.com',
            phone: '081299998888',
            password: 'password123',
            pinCode: '1234',
          })
        );
      });
    });

    it('renders in Edit mode and populates existing staff data', async () => {
      const onSubmitUpdate = vi.fn();
      render(
        <StaffFormModal
          isOpen={true}
          onClose={vi.fn()}
          staffToEdit={mockStaff[0]}
          onSubmitCreate={vi.fn()}
          onSubmitUpdate={onSubmitUpdate}
          isSubmitting={false}
        />
      );

      expect(screen.getByText('Edit Data Karyawan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Ahmad Syahripudin')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ahmad@kumpulcafe.com')).toBeInTheDocument();

      fireEvent.change(screen.getByDisplayValue('Ahmad Syahripudin'), {
        target: { value: 'Ahmad Syahripudin (Chef)' },
      });

      fireEvent.click(screen.getByText('Simpan Perubahan'));

      await waitFor(() => {
        expect(onSubmitUpdate).toHaveBeenCalledWith(
          'staff-1',
          expect.objectContaining({
            name: 'Ahmad Syahripudin (Chef)',
          })
        );
      });
    });
  });

  describe('StaffPinModal', () => {
    it('renders staff info and submits valid 4-digit PIN', async () => {
      const onSubmitPin = vi.fn();
      render(
        <StaffPinModal
          isOpen={true}
          onClose={vi.fn()}
          staff={mockStaff[0]}
          onSubmitPin={onSubmitPin}
          isSubmitting={false}
        />
      );

      expect(screen.getByText('Ubah PIN 4-Digit Staf')).toBeInTheDocument();
      expect(screen.getByText('Ahmad Syahripudin')).toBeInTheDocument();

      const pinInput = screen.getByPlaceholderText('••••');
      fireEvent.change(pinInput, { target: { value: '5678' } });

      fireEvent.click(screen.getByText('Simpan PIN Baru'));

      await waitFor(() => {
        expect(onSubmitPin).toHaveBeenCalledWith('staff-1', '5678');
      });
    });
  });
});
