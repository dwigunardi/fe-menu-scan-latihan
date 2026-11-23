import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as apiTransportModule from '@/lib/api/api-transport';
import {
  getAdminStaffPaginated,
  createAdminStaff,
  updateAdminStaff,
  updateAdminStaffPin,
  deleteAdminStaff,
} from '@/lib/api/admin-staff-api';
import { left, right } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';
import { ROLE } from '@/lib/constants/roles';

const newStaffPayload = {
  name: 'Eko Prasetyo',
  email: 'eko@kumpulcafe.com',
  phone: '081299998888',
  role: ROLE.KITCHEN,
  password: 'password123',
  pinCode: '4321',
  dailyShiftHours: 8,
};

/** Makes every apiTransport call fail as if the backend were offline. */
function simulateBackendOffline() {
  vi.spyOn(apiTransportModule, 'apiTransport').mockResolvedValue(left(ApiError.networkError()));
}

describe('admin-staff-api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('backend responses', () => {
    it('returns backend data when the request succeeds', async () => {
      const created = {
        id: 'staff-99',
        employeeId: null,
        name: 'Eko Prasetyo',
        email: 'eko@kumpulcafe.com',
        phone: '081299998888',
        role: ROLE.KITCHEN,
        pinCodeSet: true,
        needsOnboarding: true,
        dailyShiftHours: 8,
        isActive: true,
        avatarUrl: null,
        isEmailVerified: false,
        isPhoneVerified: false,
        joinedAt: '2026-08-25T08:00:00.000Z',
        createdAt: '2026-08-25T08:00:00.000Z',
        updatedAt: '2026-08-25T08:00:00.000Z',
      };
      vi.spyOn(apiTransportModule, 'apiTransport').mockResolvedValueOnce(right(created));

      const result = await createAdminStaff(newStaffPayload);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.id).toBe('staff-99');
      }
    });

    it('surfaces backend errors when mock fallback is disabled (default)', async () => {
      simulateBackendOffline();

      const result = await createAdminStaff(newStaffPayload);
      expect(result.isLeft()).toBe(true);
      expect(localStorage.getItem('menuscan_staff_fallback_v1')).toBeNull();
    });

    it('never masks a 409 duplicate-email error with mock data, even when fallback is enabled', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_MOCK_FALLBACK', 'true');
      vi.spyOn(apiTransportModule, 'apiTransport').mockResolvedValueOnce(
        left(new ApiError(409, 'Conflict', 'Email sudah terdaftar'))
      );

      const result = await createAdminStaff(newStaffPayload);
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.statusCode).toBe(409);
      }
    });

    it('never masks a 403 permission error with mock data, even when fallback is enabled', async () => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_MOCK_FALLBACK', 'true');
      vi.spyOn(apiTransportModule, 'apiTransport').mockResolvedValueOnce(
        left(new ApiError(403, 'Forbidden', 'Akses ditolak'))
      );

      const result = await deleteAdminStaff('staff-1');
      expect(result.isLeft()).toBe(true);
    });
  });

  describe('dev mock fallback (NEXT_PUBLIC_ENABLE_MOCK_FALLBACK=true, backend offline)', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_MOCK_FALLBACK', 'true');
      simulateBackendOffline();
    });

    it('fetches staff paginated with default mock list', async () => {
      const result = await getAdminStaffPaginated({ page: 1, limit: 10 });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items.length).toBeGreaterThanOrEqual(4);
        expect(result.value.items[0].email).toBeDefined();
        expect(result.value.meta.totalPages).toBeGreaterThanOrEqual(1);
      }
    });

    it('filters staff by search query and role', async () => {
      const result = await getAdminStaffPaginated({
        search: 'Budi',
        role: ROLE.ADMIN,
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items.length).toBe(1);
        expect(result.value.items[0].name).toContain('Budi');
      }
    });

    it('creates a new staff member with PIN', async () => {
      const result = await createAdminStaff(newStaffPayload);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Eko Prasetyo');
        expect(result.value.pinCodeSet).toBe(true);
        expect(result.value.role).toBe(ROLE.KITCHEN);
      }
    });

    it('updates an existing staff member', async () => {
      const listRes = await getAdminStaffPaginated();
      expect(listRes.isRight()).toBe(true);
      if (!listRes.isRight()) return;

      const target = listRes.value.items[0];
      const updateRes = await updateAdminStaff(target.id, {
        name: `${target.name} (Updated)`,
        email: target.email,
        phone: '081111111111',
        role: target.role,
        isActive: true,
        dailyShiftHours: 7,
      });

      expect(updateRes.isRight()).toBe(true);
      if (updateRes.isRight()) {
        expect(updateRes.value.name).toContain('(Updated)');
        expect(updateRes.value.dailyShiftHours).toBe(7);
      }
    });

    it('updates staff 4-digit PIN', async () => {
      const listRes = await getAdminStaffPaginated();
      expect(listRes.isRight()).toBe(true);
      if (!listRes.isRight()) return;

      const pinRes = await updateAdminStaffPin(listRes.value.items[0].id, { pinCode: '9876' });
      expect(pinRes.isRight()).toBe(true);
      if (pinRes.isRight()) {
        expect(pinRes.value.success).toBe(true);
      }
    });

    it('deletes a staff member', async () => {
      const listRes = await getAdminStaffPaginated();
      expect(listRes.isRight()).toBe(true);
      if (!listRes.isRight()) return;

      const delRes = await deleteAdminStaff(listRes.value.items[0].id);
      expect(delRes.isRight()).toBe(true);
      if (delRes.isRight()) {
        expect(delRes.value.success).toBe(true);
      }
    });
  });
});
