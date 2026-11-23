import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/lib/query-keys';
import {
  getAdminAttendancePaginated,
  getAdminAttendanceSummary,
  recordClockIn,
  recordClockOut,
  createLeaveRequest,
  reviewOvertime,
  correctAttendanceTime,
} from '@/lib/api/admin-attendance-api';
import {
  AttendanceQueryParams,
  ClockInInput,
  ClockOutInput,
  LeaveRequestInput,
  OvertimeReviewInput,
  AttendanceCorrectionInput,
} from '@/lib/validations/attendance.schema';
import { notifyApiError } from '@/lib/api/notify-error';
import { toast } from 'sonner';

export function useAdminAttendancePaginatedQuery(params: AttendanceQueryParams = {}) {
  return useQuery({
    queryKey: adminQueryKeys.attendancePaginated(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await getAdminAttendancePaginated(params);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
  });
}

export function useAdminAttendanceSummaryQuery(params: { date?: string } = {}) {
  return useQuery({
    queryKey: adminQueryKeys.attendanceSummary(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await getAdminAttendanceSummary(params);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
  });
}

export function useClockInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ClockInInput) => {
      const res = await recordClockIn(payload);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.attendance() });
      toast.success(`Presensi Masuk (Clock-In) berhasil untuk ${data.staffName}`);
    },
  });
}

export function useClockOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ClockOutInput) => {
      const res = await recordClockOut(payload);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.attendance() });
      toast.success(`Presensi Pulang (Clock-Out) berhasil untuk ${data.staffName}`);
    },
  });
}

export function useCreateLeaveRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LeaveRequestInput) => {
      const res = await createLeaveRequest(payload);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.attendance() });
      toast.success('Pengajuan izin/sakit/cuti staf berhasil dicatat');
    },
  });
}

export function useReviewOvertimeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: OvertimeReviewInput }) => {
      const res = await reviewOvertime(id, payload);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.attendance() });
      toast.success(`Review lembur staf ${data.staffName} berhasil diperbarui!`);
    },
  });
}

export function useCorrectAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: AttendanceCorrectionInput }) => {
      const res = await correctAttendanceTime(id, payload);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.attendance() });
      toast.success(`Koreksi jam pulang staf ${data.staffName} berhasil disimpan!`);
    },
  });
}
