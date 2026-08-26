import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAdminBranchSetting,
  updateAdminBranchSetting,
  updateStoreStatus,
  fetchPublicBranchLocation,
} from '@/lib/api/admin-settings-api';
import * as pipeline from '@/lib/api/pipeline/pipeline-runner';
import { right, left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';

vi.mock('@/lib/api/pipeline/pipeline-runner', () => ({
  executePipeline: vi.fn(),
}));

describe('Admin Settings API Client', () => {
  const mockSettingData = {
    id: 'b1234567-0000-0000-0000-000000000000',
    name: 'Kumpul Cafe - Cabang Pusat',
    address: 'Jl. Tebet Raya No. 45, Jakarta Selatan',
    latitude: -6.2297465,
    longitude: 106.8557342,
    geofenceRadius: 100,
    openTime: '08:00',
    closeTime: '22:00',
    lateGracePeriod: 15,
    isStoreOpen: true,
    storeMode: 'SHIFT_DRIVEN' as const,
    timezone: 'Asia/Jakarta',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAdminBranchSetting', () => {
    it('returns parsed BranchSetting on success', async () => {
      vi.mocked(pipeline.executePipeline).mockResolvedValue(right(mockSettingData));

      const result = await fetchAdminBranchSetting();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Kumpul Cafe - Cabang Pusat');
        expect(result.value.geofenceRadius).toBe(100);
      }
    });

    it('returns error when pipeline fails', async () => {
      vi.mocked(pipeline.executePipeline).mockResolvedValue(left(ApiError.networkError()));

      const result = await fetchAdminBranchSetting();

      expect(result.isLeft()).toBe(true);
    });
  });

  describe('updateAdminBranchSetting', () => {
    it('sends PUT request with payload and returns updated setting', async () => {
      const updatePayload = {
        name: 'Kumpul Cafe Tebet Baru',
        address: 'Jl. Tebet Raya No. 50',
        latitude: -6.2298,
        longitude: 106.8558,
        geofenceRadius: 120,
        openTime: '08:00',
        closeTime: '22:00',
        lateGracePeriod: 15,
        storeMode: 'SHIFT_DRIVEN' as const,
        timezone: 'Asia/Jakarta',
      };

      vi.mocked(pipeline.executePipeline).mockResolvedValue(
        right({ ...mockSettingData, ...updatePayload })
      );

      const result = await updateAdminBranchSetting(updatePayload);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Kumpul Cafe Tebet Baru');
        expect(result.value.geofenceRadius).toBe(120);
      }
    });
  });

  describe('updateStoreStatus', () => {
    it('updates store open/closed status', async () => {
      vi.mocked(pipeline.executePipeline).mockResolvedValue(
        right({ ...mockSettingData, isStoreOpen: false, storeMode: 'EMERGENCY_CLOSED' })
      );

      const result = await updateStoreStatus({
        isStoreOpen: false,
        storeMode: 'EMERGENCY_CLOSED',
        emergencyReason: 'Mati Lampu',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isStoreOpen).toBe(false);
      }
    });
  });

  describe('fetchPublicBranchLocation', () => {
    it('returns public coordinates and radius', async () => {
      vi.mocked(pipeline.executePipeline).mockResolvedValue(
        right({
          name: 'Kumpul Cafe',
          address: 'Jl. Tebet',
          latitude: -6.2297465,
          longitude: 106.8557342,
          geofenceRadius: 100,
          isStoreOpen: true,
          storeMode: 'SHIFT_DRIVEN',
          openTime: '08:00',
          closeTime: '22:00',
          timezone: 'Asia/Jakarta',
        })
      );

      const result = await fetchPublicBranchLocation();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.latitude).toBeCloseTo(-6.2297465);
      }
    });
  });
});
