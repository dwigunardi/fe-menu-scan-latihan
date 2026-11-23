import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAdminBranchSetting,
  updateAdminBranchSetting,
  updateStoreStatus,
  fetchPublicBranchLocation,
} from '@/lib/api/admin-settings-api';
import * as apiTransportModule from '@/lib/api/api-transport';
import { right, left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';
import { STORE_MODE } from '@/lib/constants/branch-settings';

vi.mock('@/lib/api/api-transport', () => ({
  apiTransport: vi.fn(),
  hardenedFetch: vi.fn(),
}));

describe('Admin Settings API Client', () => {
  const mockSettingData = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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
  };

  const mockPublicLocation = {
    name: 'Kumpul Cafe - Cabang Pusat',
    address: 'Jl. Tebet Raya No. 45, Jakarta Selatan',
    latitude: -6.2297465,
    longitude: 106.8557342,
    geofenceRadius: 100,
    isStoreOpen: true,
    storeMode: STORE_MODE.SHIFT_DRIVEN,
    openTime: '08:00',
    closeTime: '22:00',
    timezone: 'Asia/Jakarta',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAdminBranchSetting', () => {
    it('returns parsed BranchSetting on success', async () => {
      vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(right(mockSettingData));

      const result = await fetchAdminBranchSetting();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Kumpul Cafe - Cabang Pusat');
        expect(result.value.geofenceRadius).toBe(100);
      }
    });

    it('returns error when request fails', async () => {
      vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(left(ApiError.networkError()));

      const result = await fetchAdminBranchSetting();

      expect(result.isLeft()).toBe(true);
    });
  });

  describe('updateAdminBranchSetting', () => {
    const updatePayload = {
      name: 'Kumpul Cafe Tebet Baru',
      address: 'Jl. Tebet Raya No. 50',
      latitude: -6.2298,
      longitude: 106.8558,
      geofenceRadius: 120,
      openTime: '08:00',
      closeTime: '22:00',
      lateGracePeriod: 15,
      storeMode: STORE_MODE.SHIFT_DRIVEN,
      timezone: 'Asia/Jakarta',
    };

    it('sends PUT request with payload and returns updated setting', async () => {
      vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(
        right({ ...mockSettingData, ...updatePayload })
      );

      const result = await updateAdminBranchSetting(updatePayload);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Kumpul Cafe Tebet Baru');
        expect(result.value.geofenceRadius).toBe(120);
      }
    });

    it('returns error when request fails during update', async () => {
      vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(left(ApiError.networkError()));

      const result = await updateAdminBranchSetting(updatePayload);
      expect(result.isLeft()).toBe(true);
    });
  });

  describe('updateStoreStatus', () => {
    it('sends PUT request to update store status', async () => {
      const updatedSetting = {
        ...mockSettingData,
        isStoreOpen: false,
        storeMode: STORE_MODE.EMERGENCY_CLOSED,
        emergencyReason: 'Perbaikan Mesin',
      };

      vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(right(updatedSetting));

      const result = await updateStoreStatus({
        isStoreOpen: false,
        storeMode: STORE_MODE.EMERGENCY_CLOSED,
        emergencyReason: 'Perbaikan Mesin',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isStoreOpen).toBe(false);
        expect(result.value.storeMode).toBe(STORE_MODE.EMERGENCY_CLOSED);
      }
    });
  });

  describe('fetchPublicBranchLocation', () => {
    it('returns public location on success', async () => {
      vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(right(mockPublicLocation));

      const result = await fetchPublicBranchLocation();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Kumpul Cafe - Cabang Pusat');
        expect(result.value.geofenceRadius).toBe(100);
      }
    });

    it('returns error when public fetch fails', async () => {
      vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(left(ApiError.networkError()));

      const result = await fetchPublicBranchLocation();
      expect(result.isLeft()).toBe(true);
    });
  });
});
