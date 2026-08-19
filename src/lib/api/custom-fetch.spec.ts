import { describe, it, expect, beforeEach } from 'vitest';
import { customFetch, performHandshake, ensureHandshakeSession } from './custom-fetch';
import { useAuthStore } from '../../store/use-auth-store';
import { useHandshakeStore } from '../../store/use-handshake-store';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { encryptPayload, generateClientKeyPair } from '../crypto/ecdh';

const API_BASE = 'http://localhost:5000/api/v1';

describe('customFetch & Handshake Architecture', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    useHandshakeStore.getState().clearHandshake();
  });

  describe('performHandshake & ensureHandshakeSession', () => {
    it('performs handshake successfully and saves session in useHandshakeStore', async () => {
      const result = await performHandshake();
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        expect(result.value.handshakeToken).toBe('test-handshake-token-xyz');
        expect(result.value.sessionKey).toBeDefined();
      }

      const store = useHandshakeStore.getState();
      expect(store.handshakeToken).toBe('test-handshake-token-xyz');
      expect(store.sessionKey).toBeDefined();
    });

    it('returns cached handshake session from ensureHandshakeSession without re-fetching', async () => {
      // First handshake
      await performHandshake();
      const firstToken = useHandshakeStore.getState().handshakeToken;

      // Second call should reuse cached session
      const cachedResult = await ensureHandshakeSession();
      expect(cachedResult.isRight()).toBe(true);
      if (cachedResult.isRight()) {
        expect(cachedResult.value.handshakeToken).toBe(firstToken);
      }
    });

    it('returns Left(ApiError) when server responds with 500 on handshake', async () => {
      server.use(
        http.post(`${API_BASE}/auth/handshake`, () => {
          return HttpResponse.json(
            { message: 'Handshake negotiation failed on backend' },
            { status: 500 }
          );
        })
      );

      const result = await performHandshake();
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.statusCode).toBe(500);
        expect(result.value.message).toContain('Handshake negotiation failed');
      }
    });

    it('returns Left(ApiError) when server response lacks serverPublicKey or handshakeToken', async () => {
      server.use(
        http.post(`${API_BASE}/auth/handshake`, () => {
          return HttpResponse.json({
            statusCode: 200,
            data: { serverPublicKey: null, handshakeToken: null },
          });
        })
      );

      const result = await performHandshake();
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Server tidak mengembalikan public key');
      }
    });
  });

  describe('customFetch Core Functionality', () => {
    it('performs successful GET request and returns Right(data)', async () => {
      server.use(
        http.get(`${API_BASE}/test/ping`, () => {
          return HttpResponse.json({ statusCode: 200, data: { pong: true } });
        })
      );

      const result = await customFetch<{ pong: boolean }>('/test/ping', {
        skipHandshakeToken: true,
        skipEncryption: true,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pong).toBe(true);
      }
    });

    it('handles full absolute URL starting with http:// and direct JSON format', async () => {
      server.use(
        http.get('http://localhost:5000/api/v1/test/absolute', () => {
          return HttpResponse.json({ ok: true, directValue: 42 });
        })
      );

      const result = await customFetch<{ directValue: number }>(
        'http://localhost:5000/api/v1/test/absolute',
        {
          skipHandshakeToken: true,
          skipEncryption: true,
        }
      );

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.directValue).toBe(42);
      }
    });

    it('handles string body with skipEncryption', async () => {
      let receivedRawBody: string | null = null;

      server.use(
        http.post(`${API_BASE}/test/string-body`, async ({ request }) => {
          receivedRawBody = await request.text();
          return HttpResponse.json({ statusCode: 200, data: { received: true } });
        })
      );

      const result = await customFetch('/test/string-body', {
        method: 'POST',
        body: 'raw string test',
        skipEncryption: true,
        skipHandshakeToken: true,
      });

      expect(result.isRight()).toBe(true);
      expect(receivedRawBody).toBe('raw string test');
    });

    it('preserves existing lowercase authorization header if provided', async () => {
      let capturedHeader: string | null = null;

      server.use(
        http.get(`${API_BASE}/test/custom-auth`, ({ request }) => {
          capturedHeader = request.headers.get('authorization');
          return HttpResponse.json({ statusCode: 200, data: {} });
        })
      );

      useAuthStore.getState().setAuth(
        { id: '1', username: 'admin', name: 'Admin', role: 'ADMIN' },
        'store-token'
      );

      await customFetch('/test/custom-auth', {
        headers: { authorization: 'Basic custom_basic_auth' },
        skipHandshakeToken: true,
        skipEncryption: true,
      });

      expect(capturedHeader).toBe('Basic custom_basic_auth');
    });

    it('decrypts encrypted server response successfully', async () => {
      // Perform handshake to establish shared sessionKey
      const handshakeResult = await ensureHandshakeSession();
      expect(handshakeResult.isRight()).toBe(true);
      const sessionKey = handshakeResult.isRight() ? handshakeResult.value.sessionKey : null;

      const secretPayload = { secretCardNumber: '1234-5678-9012-3456' };
      const encryptedEnvelope = await encryptPayload(secretPayload, sessionKey!);

      server.use(
        http.get(`${API_BASE}/test/encrypted-response`, () => {
          return HttpResponse.json(encryptedEnvelope);
        })
      );

      const result = await customFetch<typeof secretPayload>('/test/encrypted-response');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.secretCardNumber).toBe('1234-5678-9012-3456');
      }
    });

    it('returns Left(ApiError) when encrypted server response fails decryption', async () => {
      // Handshake established
      await ensureHandshakeSession();

      server.use(
        http.get(`${API_BASE}/test/corrupt-encryption`, () => {
          return HttpResponse.json({
            encrypted: true,
            iv: 'invalid-iv-base64',
            tag: 'invalid-tag-base64',
            payload: 'corrupt-payload',
          });
        })
      );

      const result = await customFetch('/test/corrupt-encryption');
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.statusCode).toBe(500);
        expect(result.value.message).toContain('Gagal mendekripsi response');
      }
    });

    it('returns Left(ApiError) when handshake fails during customFetch', async () => {
      server.use(
        http.post(`${API_BASE}/auth/handshake`, () => {
          return HttpResponse.error();
        })
      );

      const result = await customFetch('/test/protected-feature');
      expect(result.isLeft()).toBe(true);
    });

    it('retries request on handshake expired 401 and returns error if retry handshake fails', async () => {
      let callCount = 0;

      server.use(
        http.get(`${API_BASE}/test/handshake-retry-fail`, () => {
          callCount++;
          return HttpResponse.json(
            { statusCode: 401, message: 'HANDSHAKE_EXPIRED' },
            { status: 401 }
          );
        }),
        http.post(`${API_BASE}/auth/handshake`, () => {
          return HttpResponse.json({ message: 'Handshake server dead' }, { status: 500 });
        })
      );

      const result = await customFetch('/test/handshake-retry-fail');
      expect(result.isLeft()).toBe(true);
    });
  });
});
