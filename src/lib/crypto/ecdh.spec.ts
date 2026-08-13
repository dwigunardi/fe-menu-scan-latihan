import { describe, it, expect } from 'vitest';
import {
  generateClientKeyPair,
  exportPublicKeyHex,
  importServerPublicKey,
  deriveSessionKey,
  encryptPayload,
  decryptPayload,
} from './ecdh';

describe('WebCrypto ECDH & AES-256-GCM Engine', () => {
  it('should generate P-256 keypairs and derive matching shared session keys', async () => {
    // 1. Client generates keypair
    const clientKeyPair = await generateClientKeyPair();
    const clientPublicKeyHex = await exportPublicKeyHex(clientKeyPair.publicKey);

    // 2. Server generates keypair
    const serverKeyPair = await generateClientKeyPair();
    const serverPublicKeyHex = await exportPublicKeyHex(serverKeyPair.publicKey);

    // 3. Client imports server public key and derives session key
    const importedServerKey = await importServerPublicKey(serverPublicKeyHex);
    const clientSessionKey = await deriveSessionKey(
      clientKeyPair.privateKey,
      importedServerKey
    );

    // 4. Server imports client public key and derives session key
    const importedClientKey = await importServerPublicKey(clientPublicKeyHex);
    const serverSessionKey = await deriveSessionKey(
      serverKeyPair.privateKey,
      importedClientKey
    );

    expect(clientSessionKey).toBeDefined();
    expect(serverSessionKey).toBeDefined();

    // 5. Test Encrypt on Client -> Decrypt on Server
    const originalPayload = {
      orderNumber: 'ORD-2026-001',
      customerName: 'Dewi',
      items: [{ menuItemId: 'coffee-1', quantity: 2, price: 28000 }],
    };

    const envelope = await encryptPayload(originalPayload, clientSessionKey);
    expect(envelope.encrypted).toBe(true);
    expect(envelope.iv).toBeDefined();
    expect(envelope.payload).toBeDefined();

    const decryptedData = await decryptPayload<typeof originalPayload>(
      envelope,
      serverSessionKey
    );

    expect(decryptedData).toEqual(originalPayload);
  });
});
