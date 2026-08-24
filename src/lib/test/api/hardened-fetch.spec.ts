import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { hardenedFetch } from '@/lib/api/hardened-fetch';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:5000/api/v1';

describe('hardenedFetch', () => {
  const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  });

  it('returns Right with parsed data when response matches schema', async () => {
    server.use(
      http.get(`${API_BASE}/test/valid-user`, () => {
        return HttpResponse.json({
          data: {
            id: 'u-1',
            name: 'Budi Santoso',
            email: 'budi@example.com',
          },
        });
      })
    );

    const result = await hardenedFetch('/test/valid-user', UserSchema, {
      skipHandshakeToken: true,
      skipEncryption: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe('Budi Santoso');
      expect(result.value.email).toBe('budi@example.com');
    }
  });

  it('returns Left with ApiError when response violates schema contract', async () => {
    server.use(
      http.get(`${API_BASE}/test/invalid-user`, () => {
        return HttpResponse.json({
          data: {
            id: 'u-1',
            name: 'Budi Santoso',
            email: 'not-an-email', // invalid email
          },
        });
      })
    );

    const result = await hardenedFetch('/test/invalid-user', UserSchema, {
      skipHandshakeToken: true,
      skipEncryption: true,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.statusCode).toBe(500);
      expect(result.value.errorTitle).toBe('Contract Violation');
      expect(result.value.message).toContain('tidak sesuai dengan format schema');
      expect(result.value.details).toBeDefined();
    }
  });

  it('returns Left if underlying customFetch fails with HTTP error', async () => {
    server.use(
      http.get(`${API_BASE}/test/error`, () => {
        return HttpResponse.json(
          { message: 'Resource not found' },
          { status: 404 }
        );
      })
    );

    const result = await hardenedFetch('/test/error', UserSchema, {
      skipHandshakeToken: true,
      skipEncryption: true,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.statusCode).toBe(404);
      expect(result.value.message).toBe('Resource not found');
    }
  });
});
