import { describe, it, expect } from 'vitest';
import {
  generateClientKeyPair,
  exportPublicKeyHex,
  importServerPublicKey,
  deriveSessionKey,
  encryptPayload,
  decryptPayload,
  bufToHex,
  hexToBuf,
  bufToBase64,
  base64ToBuf,
} from '@/lib/crypto/ecdh';

describe('WebCrypto Zero-Trust ECDH & AES-GCM', () => {
  it('should negotiate shared key, encrypt payload, and decrypt cleanly', async () => {
    // 1. Generate client and server simulated P-256 keypairs
    const clientKP = await generateClientKeyPair();
    const serverKP = await generateClientKeyPair();

    const clientPubHex = await exportPublicKeyHex(clientKP.publicKey);
    const serverPubHex = await exportPublicKeyHex(serverKP.publicKey);

    const importedServerPub = await importServerPublicKey(serverPubHex);
    const importedClientPub = await importServerPublicKey(clientPubHex);

    const nonce = 'test-nonce-16bytes-min';

    // 2. Derive symmetrical AES-256-GCM session keys on both sides
    const clientSessionKey = await deriveSessionKey(
      clientKP.privateKey,
      importedServerPub,
      nonce
    );
    const serverSessionKey = await deriveSessionKey(
      serverKP.privateKey,
      importedClientPub,
      nonce
    );

    // 3. Encrypt sensitive order payload on client
    const sensitivePayload = {
      orderId: 'ORD-TEST-001',
      items: [{ menuId: 'kopi-aren', qty: 2, price: 28000 }],
      total: 56000,
    };

    const envelope = await encryptPayload(sensitivePayload, clientSessionKey);
    expect(envelope.encrypted).toBe(true);
    expect(envelope.iv).toBeDefined();
    expect(envelope.tag).toBeDefined();
    expect(envelope.payload).toBeDefined();

    // 4. Decrypt payload on server side
    const decrypted = await decryptPayload<typeof sensitivePayload>(
      envelope,
      serverSessionKey
    );

    expect(decrypted.orderId).toBe('ORD-TEST-001');
    expect(decrypted.items[0].menuId).toBe('kopi-aren');
    expect(decrypted.total).toBe(56000);
  });

  it('encrypts and decrypts raw non-JSON string payloads and returns decodedText on parse error', async () => {
    const kp1 = await generateClientKeyPair();
    const kp2 = await generateClientKeyPair();
    const pub2 = await importServerPublicKey(await exportPublicKeyHex(kp2.publicKey));
    const key = await deriveSessionKey(kp1.privateKey, pub2, 'nonce-raw-string');

    // "{ invalid json" will fail JSON.parse and trigger catch block fallback
    const rawNonJson = '{ invalid: json without quotes';
    const envelope = await encryptPayload(rawNonJson, key);
    const decrypted = await decryptPayload<string>(envelope, key);

    expect(decrypted).toBe(rawNonJson);
  });

  it('derives session key with custom appSecret', async () => {
    const kp1 = await generateClientKeyPair();
    const kp2 = await generateClientKeyPair();
    const pub2 = await importServerPublicKey(await exportPublicKeyHex(kp2.publicKey));
    const key = await deriveSessionKey(
      kp1.privateKey,
      pub2,
      'nonce-custom-secret',
      'my_custom_secret_key_32_bytes_test'
    );

    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe('AES-GCM');
  });

  describe('Buffer & Encoding Helpers', () => {
    it('converts ArrayBuffer and Uint8Array to hex seamlessly', () => {
      const u8 = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      expect(bufToHex(u8)).toBe('deadbeef');
      expect(bufToHex(u8.buffer)).toBe('deadbeef');
    });

    it('converts hex string with and without 0x prefix to Uint8Array', () => {
      const b1 = hexToBuf('0xdeadbeef');
      const b2 = hexToBuf('deadbeef');
      expect(bufToHex(b1)).toBe('deadbeef');
      expect(bufToHex(b2)).toBe('deadbeef');
    });

    it('converts ArrayBuffer and Uint8Array to Base64 and back', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const b64 = bufToBase64(bytes);
      expect(b64).toBe('SGVsbG8=');

      const b64FromBuffer = bufToBase64(bytes.buffer);
      expect(b64FromBuffer).toBe('SGVsbG8=');

      const recovered = base64ToBuf(b64);
      expect(Array.from(recovered)).toEqual([72, 101, 108, 108, 111]);
    });

    it('uses Buffer fallback when atob and btoa are unavailable in environment', () => {
      const originalAtob = (globalThis as any).atob;
      const originalBtoa = (globalThis as any).btoa;

      try {
        (globalThis as any).atob = undefined;
        (globalThis as any).btoa = undefined;

        const u8 = new Uint8Array([65, 66, 67]); // "ABC"
        const b64 = bufToBase64(u8);
        expect(b64).toBe('QUJD');

        const recovered = base64ToBuf(b64);
        expect(Array.from(recovered)).toEqual([65, 66, 67]);
      } finally {
        (globalThis as any).atob = originalAtob;
        (globalThis as any).btoa = originalBtoa;
      }
    });

    it('falls back to globalThis.crypto when window is unavailable', async () => {
      const originalWindow = (globalThis as any).window;

      try {
        (globalThis as any).window = undefined;

        const kp = await generateClientKeyPair();
        expect(kp.publicKey).toBeDefined();
        const hex = await exportPublicKeyHex(kp.publicKey);
        expect(hex.length).toBeGreaterThan(0);
      } finally {
        (globalThis as any).window = originalWindow;
      }
    });
  });
});
