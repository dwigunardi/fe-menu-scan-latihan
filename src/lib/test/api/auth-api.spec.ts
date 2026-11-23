import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeStaffEmail,
  loginStaff,
  refreshTokenApi,
  reloginStaff,
  getHandoverCandidates,
  handoverShift,
} from '@/lib/api/auth-api';
import { useAuthStore } from '@/store/use-auth-store';
import { ErrorCode } from '@/lib/api/error-codes';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('auth-api', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

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
    it('successfully logs in with valid staff credentials and returns refreshToken', async () => {
      const result = await loginStaff({
        usernameOrEmail: 'admin',
        password: 'password123',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.accessToken).toBe('fake-jwt-token-123');
        expect(result.value.refreshToken).toBe('fake-refresh-token-456');
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

  describe('refreshTokenApi', () => {
    it('renews tokens successfully with valid refreshToken', async () => {
      const result = await refreshTokenApi('valid-refresh-token');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.accessToken).toBe('renewed-access-token-789');
        expect(result.value.refreshToken).toBe('renewed-refresh-token-789');
      }
    });

    it('returns ApiError when refreshToken is expired or revoked', async () => {
      const result = await refreshTokenApi('expired-refresh-token');

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.statusCode).toBe(401);
      }
    });
  });

  describe('reloginStaff', () => {
    it('re-authenticates active staff and updates store', async () => {
      useAuthStore.getState().setAuth(
        {
          id: 'user-1',
          name: 'Admin Cafe',
          email: 'admin@menuscan.com',
          role: 'ADMIN',
        },
        'old-token'
      );

      const result = await reloginStaff('password123');

      expect(result.isRight()).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('fake-jwt-token-123');
      expect(useAuthStore.getState().refreshToken).toBe('fake-refresh-token-456');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('fails when active user is not found or password incorrect', async () => {
      useAuthStore.getState().setAuth(
        {
          id: 'user-1',
          name: 'Admin Cafe',
          email: 'admin@menuscan.com',
          role: 'ADMIN',
        },
        'old-token'
      );

      const result = await reloginStaff('wrongpass');
      expect(result.isLeft()).toBe(true);
    });
  });

  describe('shift handover', () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

    beforeEach(() => {
      useAuthStore.getState().setAuth(
        { id: 'cashier-1', name: 'Kasir Pagi', role: 'CASHIER' },
        'access-token'
      );
    });

    it('lists handover candidates from GET /auth/handover/candidates', async () => {
      server.use(
        http.get(`${API_BASE}/auth/handover/candidates`, () =>
          HttpResponse.json({
            data: [{ id: 'staff-2', employeeId: 'KC-002', name: 'Siti', role: 'KITCHEN', avatarUrl: null }],
          })
        )
      );

      const result = await getHandoverCandidates();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) expect(result.value[0].name).toBe('Siti');
    });

    it('returns the incoming staff session from POST /auth/handover', async () => {
      let method = '';
      server.use(
        http.post(`${API_BASE}/auth/handover`, ({ request }) => {
          method = request.method;
          return HttpResponse.json({
            data: {
              accessToken: 'incoming-access',
              refreshToken: 'incoming-refresh',
              user: { id: 'staff-2', name: 'Siti', role: 'KITCHEN', needsOnboarding: false },
            },
          });
        })
      );

      const result = await handoverShift({ incomingStaffId: 'staff-2', pinCode: '1234' });

      expect(method).toBe('POST');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.accessToken).toBe('incoming-access');
        expect(result.value.user.id).toBe('staff-2');
      }
    });

    it('surfaces the SHIFT_STILL_OPEN code on 409', async () => {
      server.use(
        http.post(`${API_BASE}/auth/handover`, () =>
          HttpResponse.json(
            { statusCode: 409, error: 'Conflict', code: 'SHIFT_STILL_OPEN', message: 'Tutup shift dulu.' },
            { status: 409 }
          )
        )
      );

      const result = await handoverShift({ incomingStaffId: 'staff-2', pinCode: '1234' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) expect(result.value.code).toBe(ErrorCode.SHIFT_STILL_OPEN);
    });
  });
});
