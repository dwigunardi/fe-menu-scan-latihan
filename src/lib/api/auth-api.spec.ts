import { describe, it, expect } from 'vitest';
import { normalizeStaffEmail, loginStaff } from './auth-api';

describe('auth-api', () => {
  describe('normalizeStaffEmail', () => {
    it('appends @menuscan.com if username has no @ domain', () => {
      expect(normalizeStaffEmail('admin')).toBe('admin@menuscan.com');
      expect(normalizeStaffEmail(' kasir ')).toBe('kasir@menuscan.com');
    });

    it('retains email as-is if already contains @ domain', () => {
      expect(normalizeStaffEmail('admin@customdomain.com')).toBe('admin@customdomain.com');
      expect(normalizeStaffEmail('  staff@cafe.co.id  ')).toBe('staff@cafe.co.id');
    });
  });

  describe('loginStaff', () => {
    it('successfully logs in with valid staff credentials', async () => {
      const result = await loginStaff({
        usernameOrEmail: 'admin',
        password: 'password123',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.accessToken).toBe('fake-jwt-token-123');
        expect(result.value.user.username).toBe('admin');
        expect(result.value.user.role).toBe('ADMIN');
      }
    });

    it('returns ApiError when credentials are invalid', async () => {
      const result = await loginStaff({
        usernameOrEmail: 'admin',
        password: 'wrongpassword',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.statusCode).toBe(401);
        expect(result.value.message).toContain('Email atau password salah');
      }
    });
  });
});
