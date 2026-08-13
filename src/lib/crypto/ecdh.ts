/**
 * WebCrypto Zero-Trust Client-Side Cryptography Core
 * - Curve: P-256 (prime256v1 / secp256r1)
 * - Key Derivation: HKDF with SHA-256
 * - Symmetric Cipher: AES-256-GCM (12-byte IV, 16-byte Tag)
 */

export interface EncryptedEnvelope {
  encrypted: true;
  iv: string; // Base64 or Hex
  tag?: string; // Hex/Base64 if separated, or appended to payload
  payload: string; // Base64 ciphertext
}

// Global crypto accessor safe for browser and Node.js environments
const getCrypto = (): Crypto => {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto as Crypto;
  }
  throw new Error('WebCrypto API is not supported in this runtime environment.');
};

/**
 * Converts ArrayBuffer to Hex string
 */
export function bufToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts Hex string to Uint8Array
 */
export function hexToBuf(hex: string): Uint8Array {
  const cleanHex = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Converts ArrayBuffer to Base64 string
 */
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

/**
 * Converts Base64 string to Uint8Array
 */
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

/**
 * Generates an ephemeral ECDH P-256 key pair.
 */
export async function generateClientKeyPair(): Promise<CryptoKeyPair> {
  const crypto = getCrypto();
  return crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Exports a CryptoKey to uncompressed raw hex format (04 || X || Y).
 */
export async function exportPublicKeyHex(publicKey: CryptoKey): Promise<string> {
  const crypto = getCrypto();
  const rawBuffer = await crypto.subtle.exportKey('raw', publicKey);
  return bufToHex(rawBuffer);
}

/**
 * Imports an uncompressed raw hex public key (from server).
 */
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
 * Derives a 256-bit AES-GCM session key from ECDH shared bits using HKDF-SHA256.
 * Salt default is 'kumpul-cafe-handshake-salt-v1'.
 */
export async function deriveSessionKey(
  clientPrivateKey: CryptoKey,
  serverPublicKey: CryptoKey,
  saltStr = 'kumpul-cafe-handshake-salt-v1'
): Promise<CryptoKey> {
  const crypto = getCrypto();

  // 1. Derive shared bits using ECDH
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
  const salt = encoder.encode(saltStr);
  const info = encoder.encode('aes-256-gcm-session-key');

  // 3. Derive AES-GCM 256-bit key via HKDF
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
    false, // RAM-only, non-extractable for maximum security
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plain JavaScript object or string into an EncryptedEnvelope.
 */
export async function encryptPayload(
  data: unknown,
  sessionKey: CryptoKey
): Promise<EncryptedEnvelope> {
  const crypto = getCrypto();
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(text);

  // 12-byte random IV for GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // WebCrypto encrypts and appends the 16-byte authentication tag to the end of ciphertext
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    sessionKey,
    encodedData
  );

  return {
    encrypted: true,
    iv: bufToHex(iv),
    payload: bufToBase64(ciphertextBuffer),
  };
}

/**
 * Decrypts an EncryptedEnvelope back into the original plain JavaScript object.
 */
export async function decryptPayload<T = unknown>(
  envelope: { iv: string; payload: string; tag?: string },
  sessionKey: CryptoKey
): Promise<T> {
  const crypto = getCrypto();
  const iv = hexToBuf(envelope.iv);
  let ciphertext = base64ToBuf(envelope.payload);

  // If server returns separate hex tag, append it to ciphertext for WebCrypto
  if (envelope.tag) {
    const tagBytes = hexToBuf(envelope.tag);
    const combined = new Uint8Array(ciphertext.length + tagBytes.length);
    combined.set(ciphertext, 0);
    combined.set(tagBytes, ciphertext.length);
    ciphertext = combined;
  }

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      tagLength: 128,
    },
    sessionKey,
    ciphertext as BufferSource
  );

  const decoder = new TextDecoder();
  const decodedText = decoder.decode(decryptedBuffer);

  try {
    return JSON.parse(decodedText) as T;
  } catch {
    return decodedText as unknown as T;
  }
}
