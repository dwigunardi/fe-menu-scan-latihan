import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KioskPinModal } from '@/components/kiosk/kiosk-pin-modal';
import { StaffItem } from '@/lib/validations/staff.schema';
import { ATTENDANCE_TYPE } from '@/lib/constants/attendance';
import { ROLE } from '@/lib/constants/roles';

describe('KioskPinModal Component', () => {
  const mockStaff: StaffItem = {
    id: 'staff-10',
    employeeId: 'KC-010',
    name: 'Ahmad Fauzi',
    email: 'ahmad@kumpulcafe.com',
    role: ROLE.CASHIER,
    isActive: true,
    pinCodeSet: true,
    dailyShiftHours: 8,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders staff details and empty keypad properly', () => {
    render(
      <KioskPinModal
        isOpen={true}
        staff={mockStaff}
        mode={ATTENDANCE_TYPE.CLOCK_IN}
        isSubmitting={false}
        errorMessage={null}
        onClose={vi.fn()}
        onSubmitPin={vi.fn()}
      />
    );

    expect(screen.getByText('Ahmad Fauzi')).toBeInTheDocument();
    expect(screen.getByText(/NIK: KC-010/i)).toBeInTheDocument();
    expect(screen.getByText(/Presensi Masuk/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles keypad button clicks and auto-submits on 4th digit', async () => {
    const handleSubmitPin = vi.fn().mockResolvedValue(undefined);

    render(
      <KioskPinModal
        isOpen={true}
        staff={mockStaff}
        mode={ATTENDANCE_TYPE.CLOCK_IN}
        isSubmitting={false}
        errorMessage={null}
        onClose={vi.fn()}
        onSubmitPin={handleSubmitPin}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(handleSubmitPin).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(handleSubmitPin).toHaveBeenCalledWith('1234');
  });

  it('handles backspace and clear buttons properly', () => {
    render(
      <KioskPinModal
        isOpen={true}
        staff={mockStaff}
        mode={ATTENDANCE_TYPE.CLOCK_OUT}
        isSubmitting={false}
        errorMessage={null}
        onClose={vi.fn()}
        onSubmitPin={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: '6' }));

    const backspaceBtn = screen.getByRole('button', { name: /Hapus Digit/i });
    fireEvent.click(backspaceBtn);

    const resetBtn = screen.getByRole('button', { name: /Bersihkan PIN/i });
    fireEvent.click(resetBtn);
  });

  it('listens to physical keyboard numbers and Escape', () => {
    const handleClose = vi.fn();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <KioskPinModal
        isOpen={true}
        staff={mockStaff}
        mode={ATTENDANCE_TYPE.CLOCK_IN}
        isSubmitting={false}
        errorMessage={null}
        onClose={handleClose}
        onSubmitPin={handleSubmit}
      />
    );

    fireEvent.keyDown(window, { key: '7' });
    fireEvent.keyDown(window, { key: '8' });
    fireEvent.keyDown(window, { key: '9' });
    fireEvent.keyDown(window, { key: '0' });

    expect(handleSubmit).toHaveBeenCalledWith('7890');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('displays error message when provided', () => {
    render(
      <KioskPinModal
        isOpen={true}
        staff={mockStaff}
        mode={ATTENDANCE_TYPE.CLOCK_IN}
        isSubmitting={false}
        errorMessage="PIN salah, silakan coba lagi"
        onClose={vi.fn()}
        onSubmitPin={vi.fn()}
      />
    );

    expect(screen.getByText('PIN salah, silakan coba lagi')).toBeInTheDocument();
  });
});
