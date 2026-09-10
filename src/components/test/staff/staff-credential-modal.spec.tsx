import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StaffCredentialModal } from '@/components/staff/staff-credential-modal';
import { StaffItem } from '@/lib/validations/staff.schema';
import { ROLE } from '@/lib/constants/roles';

describe('StaffCredentialModal', () => {
  const mockStaff: StaffItem = {
    id: 'staff-99',
    employeeId: 'KC-009',
    name: 'Dimas Pratama',
    email: 'dimas@kumpulcafe.com',
    phone: '081234567890',
    role: ROLE.CASHIER,
    pinCodeSet: false,
    needsOnboarding: true,
    dailyShiftHours: 8,
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders staff credential details properly', () => {
    render(
      <StaffCredentialModal
        isOpen={true}
        onClose={vi.fn()}
        staff={mockStaff}
        temporaryPassword="Kumpul#2026"
      />
    );

    expect(screen.getByText(/Karyawan Berhasil Didaftarkan!/i)).toBeInTheDocument();
    expect(screen.getByText('Dimas Pratama')).toBeInTheDocument();
    expect(screen.getByText(/NIK: KC-009/i)).toBeInTheDocument();
    expect(screen.getByText('dimas@kumpulcafe.com')).toBeInTheDocument();
    expect(screen.getByText(/Menunggu Aktivasi Onboarding/i)).toBeInTheDocument();
  });

  it('toggles password visibility when eye icon button is clicked', () => {
    render(
      <StaffCredentialModal
        isOpen={true}
        onClose={vi.fn()}
        staff={mockStaff}
        temporaryPassword="Kumpul#2026"
      />
    );

    expect(screen.getByText('••••••••')).toBeInTheDocument();
    expect(screen.queryByText('Kumpul#2026')).not.toBeInTheDocument();

    const toggleBtn = screen.getByTitle('Tampilkan');
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Kumpul#2026')).toBeInTheDocument();
  });

  it('copies credential text to clipboard', async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

    render(
      <StaffCredentialModal
        isOpen={true}
        onClose={vi.fn()}
        staff={mockStaff}
        temporaryPassword="Kumpul#2026"
      />
    );

    const copyBtn = screen.getByRole('button', { name: /Salin Kredensial Lengkap/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledWith(
        expect.stringContaining('Dimas Pratama')
      );
      expect(writeTextSpy).toHaveBeenCalledWith(
        expect.stringContaining('Kumpul#2026')
      );
    });
  });

  it('opens WhatsApp with encoded credentials when send button is clicked', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <StaffCredentialModal
        isOpen={true}
        onClose={vi.fn()}
        staff={mockStaff}
        temporaryPassword="Kumpul#2026"
      />
    );

    const waBtn = screen.getByRole('button', { name: /Kirim Kredensial via WhatsApp Staf/i });
    fireEvent.click(waBtn);

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/6281234567890?text='),
      '_blank',
      'noopener,noreferrer'
    );
  });
});
