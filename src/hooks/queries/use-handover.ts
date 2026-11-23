import { useQuery } from '@tanstack/react-query';
import { getHandoverCandidates } from '@/lib/api/auth-api';

export const handoverQueryKeys = {
  candidates: () => ['auth', 'handover', 'candidates'] as const,
};

/**
 * Staff who can take over this device. Unlike GET /admin/staff (ADMIN only), this endpoint is
 * open to every logged-in staff role, so cashiers, kitchen and waiter staff can hand over.
 */
export function useHandoverCandidatesQuery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: handoverQueryKeys.candidates(),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const res = await getHandoverCandidates();
      if (res.isLeft()) throw res.value;
      return res.value;
    },
    staleTime: 30_000,
  });
}
