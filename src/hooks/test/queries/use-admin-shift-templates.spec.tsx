import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import {
  useShiftTemplatesQuery,
  useCreateShiftTemplateMutation,
  useUpdateShiftTemplateMutation,
  useDeleteShiftTemplateMutation,
  useSeedDefaultShiftTemplatesMutation,
} from '@/hooks/queries/use-admin-shift-templates';
import * as api from '@/lib/api/admin-shift-templates-api';
import { right } from '@/lib/api/either';

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('use-admin-shift-templates Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useShiftTemplatesQuery returns data on success', async () => {
    vi.spyOn(api, 'fetchShiftTemplates').mockResolvedValue(right([mockTemplate]));

    const { result } = renderHook(() => useShiftTemplatesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].code).toBe('PAGI');
  });

  it('useCreateShiftTemplateMutation calls API and invalidates cache', async () => {
    vi.spyOn(api, 'createShiftTemplate').mockResolvedValue(right(mockTemplate));

    const { result } = renderHook(() => useCreateShiftTemplateMutation(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      name: 'Shift Pagi',
      code: 'PAGI',
      startTime: '08:00',
      endTime: '16:00',
      breakMinutes: 60,
      colorBadge: 'emerald',
      isActive: true,
    });

    expect(api.createShiftTemplate).toHaveBeenCalled();
  });

  it('useUpdateShiftTemplateMutation updates template', async () => {
    vi.spyOn(api, 'updateShiftTemplate').mockResolvedValue(right(mockTemplate));

    const { result } = renderHook(() => useUpdateShiftTemplateMutation(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      id: 'tmpl-1',
      payload: { name: 'Shift Pagi Baru' },
    });

    expect(api.updateShiftTemplate).toHaveBeenCalledWith('tmpl-1', {
      name: 'Shift Pagi Baru',
    });
  });

  it('useDeleteShiftTemplateMutation deletes template', async () => {
    vi.spyOn(api, 'deleteShiftTemplate').mockResolvedValue(right(mockTemplate));

    const { result } = renderHook(() => useDeleteShiftTemplateMutation(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('tmpl-1');
    expect(api.deleteShiftTemplate).toHaveBeenCalledWith('tmpl-1');
  });

  it('useSeedDefaultShiftTemplatesMutation seeds templates', async () => {
    vi.spyOn(api, 'seedDefaultShiftTemplates').mockResolvedValue(right([mockTemplate]));

    const { result } = renderHook(() => useSeedDefaultShiftTemplatesMutation(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ openTime: '08:00', closeTime: '22:00' });
    expect(api.seedDefaultShiftTemplates).toHaveBeenCalledWith({
      openTime: '08:00',
      closeTime: '22:00',
    });
  });
});
