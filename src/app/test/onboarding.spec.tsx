import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingPage from '@/app/onboarding/page';
import { useAuthStore, ROLE } from '@/store/use-auth-store';
import * as authApi from '@/lib/api/auth-api';
import { Right } from '@/lib/api/either';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
  usePathname: () => '/onboarding',
}));

describe('OnboardingPage Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
    useAuthStore.getState().setAuth(
      {
        id: 'staff-new-1',
        employeeId: 'KC-001',
        name: 'Rian Kasir Baru',
        email: 'rian@kumpulcafe.com',
        role: ROLE.CASHIER,
        needsOnboarding: true,
      },
      'temp-token'
    );
  });

  it('renders Step 1 (Password Change) by default', () => {
    render(<OnboardingPage />);

    expect(screen.getByText(/Ganti Password Akun Anda/i)).toBeInTheDocument();
    expect(screen.getByText(/Kriteria Keamanan Sandi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lanjut ke Pengaturan PIN Presensi/i })).toBeDisabled();
  });

  it('progresses to Step 2 when password criteria are fulfilled', async () => {
    render(<OnboardingPage />);

    // Fill current password
    const currentPassInput = screen.getByPlaceholderText('Masukkan password dari admin');
    fireEvent.change(currentPassInput, { target: { value: 'Kumpul#2026' } });

    // Fill new password (min 8 chars, uppercase, lowercase, digit)
    const newPassInput = screen.getByPlaceholderText('Min. 8 karakter (huruf besar, kecil, angka)');
    fireEvent.change(newPassInput, { target: { value: 'RahasiaKopi123' } });

    // Fill confirm password
    const confirmPassInput = screen.getByPlaceholderText('Ketik ulang password baru Anda');
    fireEvent.change(confirmPassInput, { target: { value: 'RahasiaKopi123' } });

    const proceedBtn = screen.getByRole('button', { name: /Lanjut ke Pengaturan PIN Presensi/i });
    expect(proceedBtn).toBeEnabled();
    fireEvent.click(proceedBtn);

    // Should now be on Step 2 (PIN Setup)
    await waitFor(() => {
      expect(screen.getByText(/Buat 4-Digit PIN Presensi/i)).toBeInTheDocument();
    });
  });

  it('validates PIN security rules (rejects 1111 and 1234) on Step 2', async () => {
    render(<OnboardingPage />);

    // Pass Step 1
    fireEvent.change(screen.getByPlaceholderText('Masukkan password dari admin'), {
      target: { value: 'Kumpul#2026' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 karakter (huruf besar, kecil, angka)'), {
      target: { value: 'RahasiaKopi123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ketik ulang password baru Anda'), {
      target: { value: 'RahasiaKopi123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Lanjut ke Pengaturan PIN Presensi/i }));

    await waitFor(() => {
      expect(screen.getByText(/Buat 4-Digit PIN Presensi/i)).toBeInTheDocument();
    });

    // Press repetitive digits: 1 1 1 1
    const oneKey = screen.getByRole('button', { name: '1' });
    fireEvent.click(oneKey);
    fireEvent.click(oneKey);
    fireEvent.click(oneKey);
    fireEvent.click(oneKey);

    expect(screen.getByText(/PIN tidak boleh menggunakan 4 angka yang sama/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Simpan & Aktivasi Akun/i })).toBeDisabled();

    // Reset and try sequential: 1 2 3 4
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));

    expect(screen.getByText(/PIN tidak boleh berupa angka berurutan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Simpan & Aktivasi Akun/i })).toBeDisabled();
  });

  it('submits onboarding successfully and completes Step 3 with role workstation redirection', async () => {
    vi.spyOn(authApi, 'onboardStaff').mockResolvedValue(
      new Right({
        accessToken: 'new-token-secure',
        refreshToken: 'new-refresh-secure',
        user: {
          id: 'staff-new-1',
          employeeId: 'KC-001',
          name: 'Rian Kasir Baru',
          email: 'rian@kumpulcafe.com',
          role: ROLE.CASHIER,
          needsOnboarding: false,
          pinCodeSet: true,
        },
      })
    );

    render(<OnboardingPage />);

    // Step 1
    fireEvent.change(screen.getByPlaceholderText('Masukkan password dari admin'), {
      target: { value: 'Kumpul#2026' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 karakter (huruf besar, kecil, angka)'), {
      target: { value: 'RahasiaKopi123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ketik ulang password baru Anda'), {
      target: { value: 'RahasiaKopi123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Lanjut ke Pengaturan PIN Presensi/i }));

    // Step 2: Input valid PIN: 8 5 2 0
    await waitFor(() => {
      expect(screen.getByText(/Buat 4-Digit PIN Presensi/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));

    const submitBtn = screen.getByRole('button', { name: /Simpan & Aktivasi Akun/i });
    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    // Step 3: Role Briefing
    await waitFor(() => {
      expect(screen.getByText(/Selamat Datang di Tim! ☕🎉/i)).toBeInTheDocument();
      expect(screen.getByText(/Workstation: Kasir Front POS/i)).toBeInTheDocument();
    });

    // Finish and redirect
    const finishBtn = screen.getByRole('button', { name: /Mulai Bertugas Sekarang 🚀/i });
    fireEvent.click(finishBtn);

    expect(mockReplace).toHaveBeenCalledWith('/cashier/tables');
  });
});
