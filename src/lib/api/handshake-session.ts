import { Either, left, right } from './either';
import { ApiError } from './api-error';
import { ErrorCode } from './error-codes';
import {
  generateClientKeyPair,
  exportPublicKeyHex,
  importServerPublicKey,
  deriveSessionKey,
  bufToHex,
} from '../crypto/ecdh';
import { useHandshakeStore } from '../../store/use-handshake-store';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

type HandshakeResult = Either<ApiError, { sessionKey: CryptoKey; handshakeToken: string }>;

// Single-flight: the handshake currently in progress, shared by every caller that needs one
let inFlightHandshake: Promise<HandshakeResult> | null = null;

/**
 * Performs an ECDH handshake with the backend.
 *
 * Single-flight: concurrent callers (e.g. several requests fired while a page loads) share one
 * handshake instead of each starting its own, which would also overwrite each other's session.
 */
export function performHandshake(): Promise<HandshakeResult> {
  inFlightHandshake ??= runHandshake().finally(() => {
    inFlightHandshake = null;
  });
  return inFlightHandshake;
}

async function runHandshake(): Promise<HandshakeResult> {
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
  } catch (caught: unknown) {
    handshakeStore.clearHandshake();

    const err: { name?: string; message?: string } =
      typeof caught === 'object' && caught !== null ? caught : {};

    const isNetworkError =
      err.name === 'TypeError' ||
      err.message?.toLowerCase().includes('failed to fetch') ||
      err.message?.toLowerCase().includes('network') ||
      err.message?.toLowerCase().includes('connection');

    if (isNetworkError) {
      return left(
        ApiError.networkError(
          'Tidak dapat terhubung ke server. Pastikan server sedang aktif dan memiliki koneksi internet.'
        )
      );
    }

    return left(
      ApiError.handshakeFailed(
        err.message || 'Terjadi kesalahan saat memproses negosiasi kunci enkripsi.'
      )
    );
  }
}

/**
 * Ensures active ECDH session key & token are available in RAM cache.
 * If expired or absent, performs a new handshake transparently (shared with concurrent callers).
 */
export async function ensureHandshakeSession(): Promise<HandshakeResult> {
  const handshakeStore = useHandshakeStore.getState();

  if (!handshakeStore.isExpired() && handshakeStore.sessionKey && handshakeStore.handshakeToken) {
    return right({
      sessionKey: handshakeStore.sessionKey,
      handshakeToken: handshakeStore.handshakeToken,
    });
  }

  return performHandshake();
}
