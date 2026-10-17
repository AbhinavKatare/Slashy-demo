/**
 * Interface for Key Management Service (KMS) provider adapters.
 * Implements Envelope Encryption: Master Key (KEK) wraps/unwraps per-record Data Keys (DEK).
 */
export interface KmsService {
  /**
   * Generates a new 256-bit Data Encryption Key (DEK).
   * Returns both the plaintext DEK (to encrypt data) and the ciphertext DEK (wrapped by KEK).
   */
  generateDataKey(): Promise<{
    plaintextKey: Buffer;
    ciphertextKey: string;
  }>;

  /**
   * Decrypts/unwraps a ciphertext DEK using the KMS Master Key (KEK).
   * Returns the plaintext DEK Buffer.
   */
  decryptDataKey(ciphertextKey: string): Promise<Buffer>;
}
