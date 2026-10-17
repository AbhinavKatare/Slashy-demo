import { EnvelopeEncryptionService } from '../../src/common/crypto/envelope-encryption.service';
import { LocalKmsService } from '../../src/common/crypto/kms/local-kms.service';

describe('EnvelopeEncryptionService (KMS Wrapped Data Encryption Keys)', () => {
  let kms: LocalKmsService;
  let envelopeService: EnvelopeEncryptionService;

  beforeEach(() => {
    kms = new LocalKmsService();
    envelopeService = new EnvelopeEncryptionService(kms);
  });

  it('should encrypt secret with per-record DEK and decrypt correctly', async () => {
    const rawRefreshToken = '1//oauth_refresh_token_very_secret_xyz123';

    const encrypted = await envelopeService.encrypt(rawRefreshToken);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toHaveLength(24); // 12 bytes
    expect(encrypted.tag).toHaveLength(32); // 16 bytes
    expect(encrypted.encryptedDataKey).toBeDefined();
    // Verify ciphertext does not contain plaintext token
    expect(encrypted.ciphertext).not.toContain(rawRefreshToken);

    const decrypted = await envelopeService.decrypt(encrypted);
    expect(decrypted).toBe(rawRefreshToken);
  });

  it('should generate unique DEKs for each encryption call (envelope isolation)', async () => {
    const secret = 'identical_secret_token_content';

    const enc1 = await envelopeService.encrypt(secret);
    const enc2 = await envelopeService.encrypt(secret);

    // Different wrapped DEKs and different ciphertexts
    expect(enc1.encryptedDataKey).not.toBe(enc2.encryptedDataKey);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);

    expect(await envelopeService.decrypt(enc1)).toBe(secret);
    expect(await envelopeService.decrypt(enc2)).toBe(secret);
  });

  it('should fail decryption if auth tag is tampered', async () => {
    const secret = 'secret_data';
    const encrypted = await envelopeService.encrypt(secret);
    encrypted.tag = 'ff'.repeat(16);

    await expect(envelopeService.decrypt(encrypted)).rejects.toThrow();
  });
});
