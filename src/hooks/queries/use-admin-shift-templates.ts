import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchShiftTemplates,
  createShiftTemplate,
  updateShiftTemplate,
  deleteShiftTemplate,
  seedDefaultShiftTemplates,
} from '@/lib/api/admin-shift-templates-api';
import {
  CreateShiftTemplateInput,
  UpdateShiftTemplateInput,
  SeedDefaultShiftTemplatesInput,
} from '@/lib/validations/shift-template.schema';

export const ADMIN_SHIFT_TEMPLATES_QUERY_KEYS = {
  all: ['admin', 'shift-templates'] as const,
  list: () => [...ADMIN_SHIFT_TEMPLATES_QUERY_KEYS.all, 'list'] as const,
};

/**
 * Hook to fetch all master shift templates.
 */
export function useShiftTemplatesQuery() {
  return useQuery({
    queryKey: ADMIN_SHIFT_TEMPLATES_QUERY_KEYS.list(),
    queryFn: async () => {
      const result = await fetchShiftTemplates();
      if (result.isLeft()) {
        throw new Error(result.value.message);
      }
      return result.value;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to create a new master shift template.
 */
export function useCreateShiftTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateShiftTemplateInput) => {
      const result = await createShiftTemplate(payload);
      if (result.isLeft()) {
        throw new Error(result.value.message);
      }
      return result.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SHIFT_TEMPLATES_QUERY_KEYS.all });
      toast.success(`Template shift '${data.name}' berhasil dibuat`);
    },
    onError: (err: Error) => {
      toast.error(`Gagal membuat template shift: ${err.message}`);
    },
  });
}

/**
 * Hook to update an existing master shift template.
 */
export function useUpdateShiftTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateShiftTemplateInput }) => {
      const result = await updateShiftTemplate(id, payload);
      if (result.isLeft()) {
        throw new Error(result.value.message);
      }
      return result.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SHIFT_TEMPLATES_QUERY_KEYS.all });
      toast.success(`Template shift '${data.name}' berhasil diperbarui`);
    },
    onError: (err: Error) => {
      toast.error(`Gagal memperbarui template shift: ${err.message}`);
    },
  });
}

/**
 * Hook to delete a master shift template.
 */
export function useDeleteShiftTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteShiftTemplate(id);
      if (result.isLeft()) {
        throw new Error(result.value.message);
      }
      return result.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SHIFT_TEMPLATES_QUERY_KEYS.all });
      toast.success(`Template shift '${data.name}' berhasil dihapus`);
    },
    onError: (err: Error) => {
      toast.error(`Gagal menghapus template shift: ${err.message}`);
    },
  });
}

/**
 * Hook to auto-seed default shift templates aligned with store hours.
 */
export function useSeedDefaultShiftTemplatesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SeedDefaultShiftTemplatesInput = {}) => {
      const result = await seedDefaultShiftTemplates(payload);
      if (result.isLeft()) {
        throw new Error(result.value.message);
      }
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SHIFT_TEMPLATES_QUERY_KEYS.all });
      toast.success('Template shift standar berhasil disinkronkan');
    },
    onError: (err: Error) => {
      toast.error(`Gagal menyinkronkan template shift: ${err.message}`);
    },
  });
}
