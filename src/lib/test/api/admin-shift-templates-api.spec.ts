import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchShiftTemplates,
  createShiftTemplate,
  updateShiftTemplate,
  deleteShiftTemplate,
  seedDefaultShiftTemplates,
} from '@/lib/api/admin-shift-templates-api';
import * as apiTransportModule from '@/lib/api/api-transport';
import { right, left } from '@/lib/api/either';
import { ApiError } from '@/lib/api/api-error';

vi.mock('@/lib/api/api-transport', () => ({
  apiTransport: vi.fn(),
  hardenedFetch: vi.fn(),
}));

describe('Admin Shift Templates API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTemplate = {
    id: 'tmpl-1',
    branchId: 'default-branch',
    name: 'Shift Pagi (Opening)',
    code: 'PAGI',
    startTime: '08:00',
    endTime: '16:00',
    breakMinutes: 60,
    colorBadge: 'emerald',
    isActive: true,
  };

  it('fetchShiftTemplates successfully returns array of templates', async () => {
    vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(
      right([mockTemplate])
    );

    const result = await fetchShiftTemplates();
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].code).toBe('PAGI');
    }
  });

  it('createShiftTemplate successfully creates and returns new template', async () => {
    vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(
      right(mockTemplate)
    );

    const result = await createShiftTemplate({
      name: 'Shift Pagi (Opening)',
      code: 'PAGI',
      startTime: '08:00',
      endTime: '16:00',
      breakMinutes: 60,
      colorBadge: 'emerald',
      isActive: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.id).toBe('tmpl-1');
    }
  });

  it('updateShiftTemplate updates template', async () => {
    vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(
      right({ ...mockTemplate, name: 'Shift Pagi Baru' })
    );

    const result = await updateShiftTemplate('tmpl-1', {
      name: 'Shift Pagi Baru',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Shift Pagi Baru');
    }
  });

  it('deleteShiftTemplate deletes template', async () => {
    vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(
      right(mockTemplate)
    );

    const result = await deleteShiftTemplate('tmpl-1');
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.id).toBe('tmpl-1');
    }
  });

  it('seedDefaultShiftTemplates seeds and returns default templates', async () => {
    vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(
      right([mockTemplate])
    );

    const result = await seedDefaultShiftTemplates({ openTime: '08:00', closeTime: '22:00' });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toHaveLength(1);
    }
  });

  it('handles errors correctly', async () => {
    vi.mocked(apiTransportModule.apiTransport).mockResolvedValue(
      left(ApiError.networkError('Network error'))
    );

    const result = await fetchShiftTemplates();
    expect(result.isLeft()).toBe(true);
  });
});
