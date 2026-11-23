import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/lib/query-keys';
import {
  getAdminStaffPaginated,
  createAdminStaff,
  updateAdminStaff,
  updateAdminStaffPin,
  deleteAdminStaff,
} from '@/lib/api/admin-staff-api';
import {
  StaffQueryParams,
  CreateStaffInput,
  UpdateStaffInput,
  UpdateStaffPinInput,
} from '@/lib/validations/staff.schema';
import { notifyApiError } from '@/lib/api/notify-error';
import { toast } from 'sonner';

export function useAdminStaffPaginatedQuery(params: StaffQueryParams = {}) {
  return useQuery({
    queryKey: adminQueryKeys.staffPaginated(params as Record<string, unknown>),
    queryFn: async () => {

      const res = await getAdminStaffPaginated(params);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
  });
}

export function useCreateStaffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateStaffInput) => {
      const res = await createAdminStaff(payload);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.staff() });
      toast.success(`Akun karyawan ${data.name} berhasil dibuat`);
    },
  });
}

export function useUpdateStaffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateStaffInput }) => {
      const res = await updateAdminStaff(id, payload);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.staff() });
      toast.success(`Data karyawan ${data.name} berhasil diperbarui`);
    },
  });
}

export function useUpdateStaffPinMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateStaffPinInput }) => {
      const res = await updateAdminStaffPin(id, payload);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.staff() });
      toast.success(data.message || 'PIN 4-digit karyawan berhasil diperbarui');
    },
  });
}

export function useDeleteStaffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteAdminStaff(id);
      if (res.isLeft()) {
        notifyApiError(res.value);
        throw res.value;
      }
      return res.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.staff() });
      toast.success('Akun karyawan berhasil dihapus');
    },
  });
}
