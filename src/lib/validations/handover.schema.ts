import { z } from 'zod';

/** A staff member who can take over this device (GET /auth/handover/candidates). */
export const HandoverCandidateSchema = z.object({
  id: z.string(),
  employeeId: z.string().nullable(),
  name: z.string(),
  role: z.enum(['CASHIER', 'KITCHEN', 'WAITER']),
  avatarUrl: z.string().nullable(),
});

export const HandoverCandidatesSchema = z.array(HandoverCandidateSchema);

export type HandoverCandidate = z.infer<typeof HandoverCandidateSchema>;

/** Body of POST /auth/handover. Limits mirror the backend HandoverDto. */
export const HandoverInputSchema = z.object({
  incomingStaffId: z.string().min(1, 'Pilih staf pengganti'),
  pinCode: z.string().regex(/^\d{4}$/, 'PIN harus berupa 4 angka'),
  notes: z.string().max(500, 'Catatan serah terima maksimal 500 karakter').optional(),
});

export type HandoverInput = z.infer<typeof HandoverInputSchema>;
