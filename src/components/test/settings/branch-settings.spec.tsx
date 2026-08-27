import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BranchSettingsForm } from '@/components/settings/branch-settings-form';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BranchSetting, STORE_MODE, DAY_OF_WEEK } from '@/lib/validations/branch-settings.schema';
import * as settingsHooks from '@/hooks/queries/use-admin-settings';

// Mock Leaflet dynamic component
vi.mock('@/components/settings/branch-map-picker', () => ({
  BranchMapPicker: ({ latitude, longitude, radiusMeters }: any) => (
    <div data-testid="mock-map-picker">
      <span>Lat: {latitude}</span>
      <span>Lon: {longitude}</span>
      <span>Radius: {radiusMeters}m</span>
    </div>
  ),
}));

describe('BranchSettingsForm Component', () => {
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
    ],
  };

  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(settingsHooks, 'useUpdateBranchSettingMutation').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  it('renders initial form values properly', () => {
    render(
      <TooltipProvider>
        <BranchSettingsForm initialData={mockInitialData} />
      </TooltipProvider>
    );

    expect(screen.getByDisplayValue('Kumpul Cafe - Cabang Pusat')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jl. Tebet Raya No. 45, Jakarta Selatan')).toBeInTheDocument();
    expect(screen.getByText('100 meter')).toBeInTheDocument();
    expect(screen.getByTestId('mock-map-picker')).toBeInTheDocument();
  });

  it('switches between navigation tabs', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <BranchSettingsForm initialData={mockInitialData} />
      </TooltipProvider>
    );

    // Switch to Schedule Tab
    const scheduleTab = screen.getByRole('tab', { name: /Jam Buka & Absensi/i });
    await user.click(scheduleTab);

    expect(await screen.findByText('Toleransi Absensi Staf')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();

    // Switch to Mode Tab
    const modeTab = screen.getByRole('tab', { name: /Mode Operasi Toko/i });
    await user.click(modeTab);

    expect(await screen.findByText(/Mode A: Shift-Driven/i)).toBeInTheDocument();
  });

  it('submits form with updated name and values', async () => {
    mockMutateAsync.mockResolvedValue({ ...mockInitialData, name: 'Kumpul Cafe Tebet Baru' });

    render(
      <TooltipProvider>
        <BranchSettingsForm initialData={mockInitialData} />
      </TooltipProvider>
    );

    const nameInput = screen.getByDisplayValue('Kumpul Cafe - Cabang Pusat');
    fireEvent.change(nameInput, { target: { value: 'Kumpul Cafe Tebet Baru' } });

    const submitBtn = screen.getByRole('button', { name: /Simpan Pengaturan Cabang/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Kumpul Cafe Tebet Baru',
          geofenceRadius: 100,
        })
      );
    });
  });
});
