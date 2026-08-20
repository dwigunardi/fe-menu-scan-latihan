import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'ADMIN',
  'CASHIER',
  'KITCHEN',
  'WAITER',
  'KASIR',
  'DAPUR',
  'PELAYAN',
]);

export const StaffUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  role: UserRoleSchema,
});

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  user: StaffUserSchema,
});

export type StaffUserType = z.infer<typeof StaffUserSchema>;
export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
