'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentShift,
  openShift,
  closeShift,
  getShiftHistory,
} from '@/lib/api/admin-shifts-api';
import {
  OpenShiftInput,
  CloseShiftInput,
  ShiftHistoryQueryParams,
} from '@/lib/validations/shift.schema';
import { adminQueryKeys } from '@/lib/query-keys';
import { notifyApiError } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Hook to retrieve and observe the currently active cashier shift.
 */
export function useCurrentShiftQuery() {
  return useQuery({
    queryKey: adminQueryKeys.shiftsCurrent(),
    queryFn: async () => {
      const res = await getCurrentShift();
      if (res.isLeft()) throw res.value;
      return res.value;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

/**
 * Hook to open a new cashier shift with an initial cash float.
 */
export function useOpenShiftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: OpenShiftInput) => {
      const res = await openShift(payload);
      if (res.isLeft()) throw res.value;
      return res.value;
    },
    onSuccess: (data) => {
      toast.success(`Shift Kasir berhasil dibuka oleh ${data.staffName}!`);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.shiftsCurrent() });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shifts'] });
    },
    onError: (err) => {
      notifyApiError(err);
    },
  });
}

/**
 * Hook to close the active cashier shift and reconcile physical cash.
 */
export function useCloseShiftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shiftId,
      payload,
    }: {
      shiftId: string;
      payload: CloseShiftInput;
    }) => {
      const res = await closeShift(shiftId, payload);
      if (res.isLeft()) throw res.value;
      return res.value;
    },
    onSuccess: (data) => {
      toast.success('Shift Kasir berhasil ditutup. Z-Report siap dicetak!');
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.shiftsCurrent() });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shifts'] });
    },
    onError: (err) => {
      notifyApiError(err);
    },
  });
}

/**
 * Hook to retrieve paginated shift audit history.
 */
export function useShiftHistoryQuery(params: Partial<ShiftHistoryQueryParams> = {}) {
  const queryParams: ShiftHistoryQueryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    startDate: params.startDate,
    endDate: params.endDate,
    status: params.status,
  };

  return useQuery({
    queryKey: adminQueryKeys.shiftsHistory(queryParams as Record<string, unknown>),
    queryFn: async () => {
      const res = await getShiftHistory(queryParams);
      if (res.isLeft()) throw res.value;
      return res.value;
    },
    staleTime: 30_000,
  });
}

