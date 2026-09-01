import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BranchSettingsForm } from '@/components/settings/branch-settings-form';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BranchSetting, STORE_MODE, DAY_OF_WEEK } from '@/lib/validations/branch-settings.schema';
import * as settingsHooks from '@/hooks/queries/use-admin-settings';

// Mock Leaflet dynamic component
vi.mock('@/components/settings/branch-map-picker', () => ({
  BranchMapPicker: ({ latitude, longitude, radiusMeters, onChangeCoordinates }: any) => (
    <div data-testid="mock-map-picker">
      <span>Lat: {latitude}</span>
      <span>Lon: {longitude}</span>
      <span>Radius: {radiusMeters}m</span>
      <button
        type="button"
        onClick={() => onChangeCoordinates(-6.23, 106.86, 'Jl. Tebet Baru No. 10')}
      >
        Set Coords
      </button>
    </div>
  ),
}));

// Mock reverse geocode
vi.mock('@/lib/utils/geocoding', () => ({
  reverseGeocode: vi.fn().mockResolvedValue('Jl. Tebet Raya Sinkron No. 99'),
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
      { day: DAY_OF_WEEK.WEDNESDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { day: DAY_OF_WEEK.THURSDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { day: DAY_OF_WEEK.FRIDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { day: DAY_OF_WEEK.SATURDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { day: DAY_OF_WEEK.SUNDAY, isOpen: true, openTime: '08:00', closeTime: '22:00' },
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
    expect(screen.getByDisplayValue('081234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin@menuscan.com')).toBeInTheDocument();
    expect(screen.getByText('100 Meter')).toBeInTheDocument();
    expect(screen.getByTestId('mock-map-picker')).toBeInTheDocument();
  });

  it('allows changing geofence radius via slider and preset buttons', () => {
    render(
      <TooltipProvider>
        <BranchSettingsForm initialData={mockInitialData} />
      </TooltipProvider>
    );

    const slider = screen.getByLabelText(/Radius Batas Absensi:/i);
    fireEvent.change(slider, { target: { value: '250' } });

    expect(screen.getByText('250 Meter')).toBeInTheDocument();

    const presetBtn = screen.getByRole('button', { name: '200m' });
    fireEvent.click(presetBtn);
    expect(screen.getByText('200 Meter')).toBeInTheDocument();
  });

  it('updates coordinates and address when map picker changes', () => {
    render(
      <TooltipProvider>
        <BranchSettingsForm initialData={mockInitialData} />
      </TooltipProvider>
    );

    const setCoordsBtn = screen.getByRole('button', { name: /Set Coords/i });
    fireEvent.click(setCoordsBtn);

    expect(screen.getByText('Lat: -6.23')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jl. Tebet Baru No. 10')).toBeInTheDocument();
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

    // Floating save bar appears when dirty
    const submitBtn = await screen.findByRole('button', { name: /Simpan Cabang/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Kumpul Cafe Tebet Baru',
        })
      );
    });
  });
});
