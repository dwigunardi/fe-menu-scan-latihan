/**
 * WebCrypto Zero-Trust Client-Side Cryptography Core
 * - Curve: P-256 (prime256v1 / secp256r1)
 * - Key Derivation: HKDF with SHA-256
 * - Symmetric Cipher: AES-256-GCM (12-byte IV, 16-byte Tag)
 */

export interface EncryptedEnvelope {
  encrypted: true;
  iv: string; // Base64
  tag: string; // Base64
  payload: string; // Base64 ciphertext
}

const getCrypto = (): Crypto => {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto as Crypto;
  }
  throw new Error('WebCrypto API is not supported in this runtime environment.');
};

export function bufToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuf(hex: string): Uint8Array {
  const cleanHex = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

export function bufToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof btoa !== 'undefined'
    ? btoa(binary)
    : Buffer.from(bytes).toString('base64');
}

export function base64ToBuf(base64: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

export async function generateClientKeyPair(): Promise<CryptoKeyPair> {
  const crypto = getCrypto();
  return crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

export async function exportPublicKeyHex(publicKey: CryptoKey): Promise<string> {
  const crypto = getCrypto();
  const rawBuffer = await crypto.subtle.exportKey('raw', publicKey);
  return bufToHex(rawBuffer);
}

export async function importServerPublicKey(serverPublicKeyHex: string): Promise<CryptoKey> {
  const crypto = getCrypto();
  const rawBuffer = hexToBuf(serverPublicKeyHex);
  return crypto.subtle.importKey(
    'raw',
    rawBuffer as BufferSource,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    false,
    []
  );
}

/**
 * Derives a 256-bit AES-GCM session key matching backend NestJS CryptoService.
 */
export async function deriveSessionKey(
  clientPrivateKey: CryptoKey,
  serverPublicKey: CryptoKey,
  nonce: string,
  appSecret = process.env.NEXT_PUBLIC_APP_SECRET || 'menuscan_app_handshake_secret_32bytes_key_secure_xyz'
): Promise<CryptoKey> {
  const crypto = getCrypto();

  // 1. Derive shared bits using ECDH (256 bits)
  const sharedBits = await crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: serverPublicKey,
    },
    clientPrivateKey,
    256
  );

  // 2. Import shared bits as raw key for HKDF
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    sharedBits,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  const encoder = new TextEncoder();
  const salt = encoder.encode(appSecret);
  const info = encoder.encode(`menuscan-session-${nonce}`);

  // 3. Derive AES-GCM 256-bit key via HKDF (HMAC-SHA256)
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info,
    },
    hkdfKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPayload(
  data: unknown,
  sessionKey: CryptoKey
): Promise<EncryptedEnvelope> {
  const crypto = getCrypto();
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(text);

  // 12-byte random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    sessionKey,
    encodedData
  );

  const ciphertextBytes = new Uint8Array(ciphertextBuffer);
  // WebCrypto appends 16-byte auth tag at the end of ciphertext
  const payloadBytes = ciphertextBytes.slice(0, -16);
  const tagBytes = ciphertextBytes.slice(-16);

  return {
    encrypted: true,
    iv: bufToBase64(iv),
    tag: bufToBase64(tagBytes),
    payload: bufToBase64(payloadBytes),
  };
}

export async function decryptPayload<T = unknown>(
  envelope: { iv: string; payload: string; tag: string },
  sessionKey: CryptoKey
): Promise<T> {
  const crypto = getCrypto();
  const iv = base64ToBuf(envelope.iv);
  const ciphertextBytes = base64ToBuf(envelope.payload);
  const tagBytes = base64ToBuf(envelope.tag);

  // Combine ciphertext and auth tag for WebCrypto decrypt
  const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
  combined.set(ciphertextBytes, 0);
  combined.set(tagBytes, ciphertextBytes.length);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      tagLength: 128,
    },
    sessionKey,
    combined as BufferSource
  );

  const decoder = new TextDecoder();
  const decodedText = decoder.decode(decryptedBuffer);

  try {
    return JSON.parse(decodedText) as T;
  } catch {
    return decodedText as unknown as T;
  }
}
