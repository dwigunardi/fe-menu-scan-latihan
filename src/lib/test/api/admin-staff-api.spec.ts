import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAdminStaffPaginated,
  createAdminStaff,
  updateAdminStaff,
  updateAdminStaffPin,
  deleteAdminStaff,
} from '@/lib/api/admin-staff-api';
import { ROLE } from '@/lib/constants/roles';

describe('admin-staff-api', () => {
  beforeEach(() => {
    localStorage.clear();
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
    const result = await createAdminStaff({
      name: 'Eko Prasetyo',
      email: 'eko@kumpulcafe.com',
      phone: '081299998888',
      role: ROLE.KITCHEN,
      password: 'password123',
      pinCode: '4321',
      dailyShiftHours: 8,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Eko Prasetyo');
      expect(result.value.pinCodeSet).toBe(true);
      expect(result.value.role).toBe(ROLE.KITCHEN);
    }
  });

  it('updates an existing staff member', async () => {
    const listRes = await getAdminStaffPaginated();
    if (listRes.isRight() && listRes.value.items.length > 0) {
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
    }
  });

  it('updates staff 4-digit PIN', async () => {
    const listRes = await getAdminStaffPaginated();
    if (listRes.isRight() && listRes.value.items.length > 0) {
      const target = listRes.value.items[0];
      const pinRes = await updateAdminStaffPin(target.id, { pinCode: '9876' });

      expect(pinRes.isRight()).toBe(true);
      if (pinRes.isRight()) {
        expect(pinRes.value.success).toBe(true);
      }
    }
  });

  it('deletes a staff member', async () => {
    const listRes = await getAdminStaffPaginated();
    if (listRes.isRight() && listRes.value.items.length > 0) {
      const target = listRes.value.items[0];
      const delRes = await deleteAdminStaff(target.id);

      expect(delRes.isRight()).toBe(true);
      if (delRes.isRight()) {
        expect(delRes.value.success).toBe(true);
      }
    }
  });
});
