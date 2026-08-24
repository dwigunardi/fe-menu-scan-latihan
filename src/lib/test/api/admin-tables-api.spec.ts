import { describe, it, expect } from 'vitest';
import {
  getAdminTables,
  getAdminTablesPaginated,
  createAdminTable,
  updateAdminTable,
  resetAdminTable,
  deleteAdminTable,
  getAdminTableZones,
  createAdminTableZone,
  updateAdminTableZone,
  deleteAdminTableZone,
} from '@/lib/api/admin-tables-api';

describe('admin-tables-api', () => {
  it('fetches all tables successfully without status filter', async () => {
    const result = await getAdminTables();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.length).toBeGreaterThan(0);
    }
  });

  it('fetches tables filtered by status (VACANT)', async () => {
    const result = await getAdminTables('VACANT');
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.every((t) => t.status === 'VACANT')).toBe(true);
    }

    const allRes = await getAdminTables('ALL');
    expect(allRes.isRight()).toBe(true);
  });

  it('fetches paginated tables with search and status query parameters', async () => {
    const result = await getAdminTablesPaginated({
      page: 1,
      limit: 10,
      search: 'T-01',
      status: 'VACANT',
      sortBy: 'number',
      sortOrder: 'asc',
    });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.items.length).toBe(1);
      expect(result.value.items[0].tableNumber).toBe('T-01');
      expect(result.value.meta.page).toBe(1);
      expect(result.value.meta.totalItems).toBe(1);
    }
  });

  it('creates a new table successfully', async () => {
    const result = await createAdminTable({
      tableNumber: 'VIP-01',
      capacity: 8,
      seatingType: 'DINING',
      tags: [],
    });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.tableNumber).toBe('VIP-01');
      expect(result.value.capacity).toBe(8);
      expect(result.value.status).toBe('VACANT');
    }
  });

  it('updates an existing table successfully', async () => {
    const result = await updateAdminTable('table-1', {
      tableNumber: 'T-01-A',
      capacity: 6,
      seatingType: 'DINING',
      tags: [],
    });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.tableNumber).toBe('T-01-A');
      expect(result.value.capacity).toBe(6);
    }
  });

  it('resets an active table session successfully', async () => {
    const result = await resetAdminTable('table-2');
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.status).toBe('VACANT');
      expect(result.value.activeGuestName).toBeNull();
    }
  });

  it('deletes a table successfully', async () => {
    const result = await deleteAdminTable('table-1');
    expect(result.isRight()).toBe(true);
  });

  describe('Table Zones API', () => {
    it('fetches all table zones successfully', async () => {
      const result = await getAdminTableZones();
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.length).toBe(3);
        expect(result.value[0].name).toBe('Indoor (AC Non-Smoking)');
      }
    });

    it('creates a new table zone successfully', async () => {
      const result = await createAdminTableZone({
        name: 'Rooftop VIP',
        description: 'Balkon lantai 2',
        color: 'purple',
        sortOrder: 4,
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Rooftop VIP');
      }
    });

    it('updates a table zone successfully', async () => {
      const result = await updateAdminTableZone('zone-1', {
        name: 'Indoor AC Main',
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.name).toBe('Indoor AC Main');
      }
    });

    it('deletes a table zone successfully', async () => {
      const result = await deleteAdminTableZone('zone-1');
      expect(result.isRight()).toBe(true);
    });
  });
});
