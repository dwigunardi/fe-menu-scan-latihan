import { Either, left, right } from './either';
import { ApiError } from './api-error';
import { ErrorCode } from './error-codes';
import {
  generateClientKeyPair,
  exportPublicKeyHex,
  importServerPublicKey,
  deriveSessionKey,
  encryptPayload,
  decryptPayload,
  bufToHex,
} from '../crypto/ecdh';
import { useHandshakeStore } from '../../store/use-handshake-store';
import { useAuthStore } from '../../store/use-auth-store';

export interface CustomFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipEncryption?: boolean;
  skipHandshakeToken?: boolean;
  retryOnHandshakeExpired?: boolean;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Performs ECDH Handshake with NestJS backend.
 */
export async function performHandshake(): Promise<
  Either<ApiError, { sessionKey: CryptoKey; handshakeToken: string }>
> {
  const handshakeStore = useHandshakeStore.getState();

  try {
    handshakeStore.setIsHandshaking(true);

    // 1. Generate client P-256 keypair
    const clientKeyPair = await generateClientKeyPair();
    const clientPublicKeyHex = await exportPublicKeyHex(clientKeyPair.publicKey);

    // 2. Generate random 16-byte hex nonce
    const randomNonceBytes = window.crypto.getRandomValues(new Uint8Array(16));
    const nonce = bufToHex(randomNonceBytes);

    // 3. Send clientPublicKey + nonce to backend
    const response = await fetch(`${API_BASE_URL}/auth/handshake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientPublicKey: clientPublicKeyHex,
        nonce: nonce,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      handshakeStore.clearHandshake();
      return left(
        new ApiError(
          response.status,
          'Handshake Error',
          errJson.message || 'Gagal melakukan pertukaran kunci dengan server.',
          { code: ErrorCode.HANDSHAKE_FAILED }
        )
      );
    }

    const resJson = await response.json();
    const { serverPublicKey, handshakeToken, expiresIn = 7200 } =
      resJson.data || resJson;

    if (!serverPublicKey || !handshakeToken) {
      handshakeStore.clearHandshake();
      return left(
        ApiError.handshakeFailed('Server tidak mengembalikan public key atau handshake token.')
      );
    }

    // 4. Derive shared session key via HKDF with nonce and appSecret
    const importedServerKey = await importServerPublicKey(serverPublicKey);
    const sessionKey = await deriveSessionKey(
      clientKeyPair.privateKey,
      importedServerKey,
      nonce
    );

    // 5. Store in RAM-only memory
    handshakeStore.setHandshakeSession(sessionKey, handshakeToken, expiresIn);

    return right({ sessionKey, handshakeToken });
  } catch (err: any) {
    handshakeStore.clearHandshake();
    return left(
      ApiError.handshakeFailed(
        err.message || 'Terjadi kesalahan saat memproses negosiasi kunci.'
      )
    );
  }
}

export async function ensureHandshakeSession(): Promise<
  Either<ApiError, { sessionKey: CryptoKey; handshakeToken: string }>
> {
  const handshakeStore = useHandshakeStore.getState();

  if (!handshakeStore.isExpired() && handshakeStore.sessionKey && handshakeStore.handshakeToken) {
    return right({
      sessionKey: handshakeStore.sessionKey,
      handshakeToken: handshakeStore.handshakeToken,
    });
  }

  return performHandshake();
}

/**
 * Universal Secure Fetch wrapper with:
 * - Automatic JWT Bearer token injection from useAuthStore
 * - Handshake Session Key management
 * - Zero-Trust payload encryption / decryption
 * - Auto-retry on token expiration
 */
export async function customFetch<T = unknown>(
  endpoint: string,
  options: CustomFetchOptions = {}
): Promise<Either<ApiError, T>> {
  const {
    body,
    skipEncryption = false,
    skipHandshakeToken = false,
    retryOnHandshakeExpired = true,
    headers: customHeaders,
    ...fetchInit
  } = options;

  try {
    let sessionKey: CryptoKey | null = null;
    let handshakeToken: string | null = null;

    if (!skipHandshakeToken || (!skipEncryption && body)) {
      const sessionResult = await ensureHandshakeSession();
      if (sessionResult.isLeft()) {
        return left(sessionResult.value);
      }
      sessionKey = sessionResult.value.sessionKey;
      handshakeToken = sessionResult.value.handshakeToken;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    // Inject JWT Bearer Token for authenticated requests
    const authStore = useAuthStore.getState();
    if (authStore.accessToken && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${authStore.accessToken}`;
    }

    // Inject Handshake Token if available
    if (handshakeToken && !skipHandshakeToken) {
      headers['x-handshake-token'] = handshakeToken;
    }

    let finalBody: string | undefined = undefined;
    if (body !== undefined && body !== null) {
      if (!skipEncryption && sessionKey) {
        const envelope = await encryptPayload(body, sessionKey);
        finalBody = JSON.stringify(envelope);
      } else {
        finalBody = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...fetchInit,
      headers,
      body: finalBody,
    });

    const json = await response.json().catch(() => null);

    if (
      response.status === 401 &&
      retryOnHandshakeExpired &&
      json?.message?.includes('HANDSHAKE')
    ) {
      const handshakeResult = await performHandshake();
      if (handshakeResult.isRight()) {
        return customFetch<T>(endpoint, {
          ...options,
          retryOnHandshakeExpired: false,
        });
      }
    }

    if (!response.ok) {
      const statusCode = json?.statusCode || response.status;
      const errorTitle = json?.error || response.statusText || 'API Error';
      const message =
        json?.message ||
        (Array.isArray(json?.details) ? json.details[0]?.message : null) ||
        'Terjadi kesalahan saat memproses permintaan.';

      return left(
        new ApiError(statusCode, errorTitle, message, {
          details: json?.details,
        })
      );
    }

    if (json?.encrypted && json?.payload && json?.iv && json?.tag && sessionKey) {
      try {
        const decrypted = await decryptPayload<T>(json, sessionKey);
        return right(decrypted);
      } catch (err: any) {
        return left(
          new ApiError(500, 'Decryption Error', 'Gagal mendekripsi response aman dari server.', {
            code: ErrorCode.DECRYPTION_FAILED,
          })
        );
      }
    }

    const responseData = json?.data !== undefined ? json.data : json;
    return right(responseData as T);
  } catch (err: any) {
    return left(ApiError.networkError(err.message));
  }
}
