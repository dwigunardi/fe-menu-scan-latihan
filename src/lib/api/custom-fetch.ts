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
  retryOnTokenExpired?: boolean;
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
  // Delegate to modular Interceptor Middleware Pipeline
  const { executePipeline } = await import('./pipeline/pipeline-runner');
  return executePipeline<T>(endpoint, options);
}
