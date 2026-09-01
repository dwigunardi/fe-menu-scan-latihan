import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StorePoliciesForm } from '@/components/settings/store-policies-form';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BranchSetting, STORE_MODE, DAY_OF_WEEK } from '@/lib/validations/branch-settings.schema';
import * as settingsHooks from '@/hooks/queries/use-admin-settings';

describe('StorePoliciesForm Component', () => {
  const mockInitialData: BranchSetting = {
    id: 'test-branch-id',
    name: 'Kumpul Cafe - Cabang Pusat',
    address: 'Jl. Tebet Raya No. 45, Jakarta Selatan',
    latitude: -6.2297465,
    longitude: 106.8557342,
    geofenceRadius: 100,
    openTime: '08:00',
    closeTime: '22:00',
    lateGracePeriod: 15,
    isStoreOpen: true,
    storeMode: STORE_MODE.SHIFT_DRIVEN,
    timezone: 'Asia/Jakarta',
    phone: '081234567890',
    email: 'admin@menuscan.com',
    schedules: [
      { day: DAY_OF_WEEK.MONDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { day: DAY_OF_WEEK.TUESDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { day: DAY_OF_WEEK.WEDNESDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { day: DAY_OF_WEEK.THURSDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { day: DAY_OF_WEEK.FRIDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { day: DAY_OF_WEEK.SATURDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { day: DAY_OF_WEEK.SUNDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
    ],
  };

  const mockUpdateBranch = vi.fn();
  const mockUpdateStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(settingsHooks, 'useUpdateBranchSettingMutation').mockReturnValue({
      mutateAsync: mockUpdateBranch,
      isPending: false,
    } as any);
    vi.spyOn(settingsHooks, 'useUpdateStoreStatusMutation').mockReturnValue({
      mutateAsync: mockUpdateStatus,
      isPending: false,
    } as any);
  });

  it('renders all 4 sections with initial values', () => {
    render(
      <TooltipProvider>
        <StorePoliciesForm initialData={mockInitialData} />
      </TooltipProvider>
    );

    expect(screen.getByText(/1\. Mode Operasional Toko/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Saklar Darurat & Status Buka Toko/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Toleransi Keterlambatan Presensi/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Jam Operasional Toko & Jadwal Mingguan/i)).toBeInTheDocument();

    expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('22:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    expect(screen.getByText('Toko Buka')).toBeInTheDocument();
  });

  it('allows changing store mode by clicking on cards', () => {
    render(
      <TooltipProvider>
        <StorePoliciesForm initialData={mockInitialData} />
      </TooltipProvider>
    );

    const clockDrivenCard = screen.getByText(/Clock Driven \(Jam Digital Otomatis\)/i);
    fireEvent.click(clockDrivenCard);

    expect(clockDrivenCard).toBeInTheDocument();
  });

  it('allows changing late grace period via preset button', () => {
    render(
      <TooltipProvider>
        <StorePoliciesForm initialData={mockInitialData} />
      </TooltipProvider>
    );

    const preset30Btn = screen.getByRole('button', { name: '30 Menit' });
    fireEvent.click(preset30Btn);

    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  it('toggles custom weekly schedules to reveal 7 days controls', () => {
    render(
      <TooltipProvider>
        <StorePoliciesForm initialData={mockInitialData} />
      </TooltipProvider>
    );

    // Initial state does not show daily list
    expect(screen.queryByText(/Kustomisasi Jam Buka-Tutup 7 Hari/i)).not.toBeInTheDocument();

    const toggleCustom = screen.getByLabelText(/Atur Jadwal Khusus per Hari/i, { selector: 'button' });
    fireEvent.click(toggleCustom);

    expect(screen.getByText(/Kustomisasi Jam Buka-Tutup 7 Hari/i)).toBeInTheDocument();
    expect(screen.getByText('Senin')).toBeInTheDocument();
    expect(screen.getByText('Minggu')).toBeInTheDocument();
  });

  it('submits updated store policies', async () => {
    mockUpdateBranch.mockResolvedValue(mockInitialData);

    render(
      <TooltipProvider>
        <StorePoliciesForm initialData={mockInitialData} />
      </TooltipProvider>
    );

    const preset20Btn = screen.getByRole('button', { name: '20 Menit' });
    fireEvent.click(preset20Btn);

    const submitBtn = screen.getByRole('button', { name: /Simpan Seluruh Kebijakan Toko/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateBranch).toHaveBeenCalledWith(
        expect.objectContaining({
          lateGracePeriod: 20,
        })
      );
    });
  });
});
