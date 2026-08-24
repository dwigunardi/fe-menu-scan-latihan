import { z } from 'zod';
import { ROLE } from '../constants/roles';

export const UserRoleSchema = z.enum([
  ROLE.ADMIN,
  ROLE.CASHIER,
  ROLE.KITCHEN,
  ROLE.WAITER,
  ROLE.KASIR,
  ROLE.DAPUR,
  ROLE.PELAYAN,
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
  refreshToken: z.string().optional().nullable(),
  user: StaffUserSchema,
});

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
});

export type StaffUserType = z.infer<typeof StaffUserSchema>;
export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenResponseType = z.infer<typeof RefreshTokenResponseSchema>;
