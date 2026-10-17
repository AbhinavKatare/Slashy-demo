import { EncryptionService } from '../../src/common/crypto/encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = new EncryptionService();
  });

  it('should encrypt and decrypt plaintext using AES-256-GCM correctly', () => {
    const secret = 'user_oauth_refresh_token_sample_12345';
    const encrypted = service.encrypt(secret);

    expect(encrypted.cipherText).toBeDefined();
    expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex characters
    expect(encrypted.tag).toHaveLength(32); // 16 bytes = 32 hex characters

    const decrypted = service.decrypt(encrypted.cipherText, encrypted.iv, encrypted.tag);
    expect(decrypted).toBe(secret);
  });

  it('should fail decryption if tag is tampered', () => {
    const secret = 'sensitive_data';
    const encrypted = service.encrypt(secret);
    const tamperedTag = '00'.repeat(16);

    expect(() => {
      service.decrypt(encrypted.cipherText, encrypted.iv, tamperedTag);
    }).toThrow();
  });

  it('should produce deterministic SHA-256 token hashes', () => {
    const token = 'sample_refresh_token_value';
    const hash1 = service.hashToken(token);
    const hash2 = service.hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });
});
