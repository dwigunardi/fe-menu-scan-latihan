import { describe, it, expect } from 'vitest';
import {
  generateClientKeyPair,
  exportPublicKeyHex,
  importServerPublicKey,
  deriveSessionKey,
  encryptPayload,
  decryptPayload,
} from './ecdh';

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
});
