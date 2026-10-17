import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { LocalKmsService } from './kms/local-kms.service';

export interface EnvelopeEncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  encryptedDataKey: string;
}

@Injectable()
export class EnvelopeEncryptionService {
  private readonly logger = new Logger(EnvelopeEncryptionService.name);

  constructor(private readonly kms: LocalKmsService) {}

  /**
   * Encrypt a sensitive token using Envelope Encryption:
   * 1. KMS generates a fresh 256-bit Data Encryption Key (DEK) and wrapped DEK.
   * 2. Plaintext is encrypted with DEK using AES-256-GCM.
   * 3. Plaintext DEK is securely zeroed from memory immediately.
   * 4. Returns ciphertext, IV, auth tag, and wrapped DEK.
   *
   * SECURITY RULE: Never logs the plaintext token or keys.
   */
  async encrypt(plaintextSecret: string): Promise<EnvelopeEncryptedPayload> {
    const { plaintextKey, ciphertextKey } = await this.kms.generateDataKey();

    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', plaintextKey, iv);

      let encrypted = cipher.update(plaintextSecret, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = cipher.getAuthTag().toString('hex');

      return {
        ciphertext: encrypted,
        iv: iv.toString('hex'),
        tag,
        encryptedDataKey: ciphertextKey,
      };
    } finally {
      // Securely wipe plaintext DEK from memory immediately
      plaintextKey.fill(0);
    }
  }

  /**
   * Decrypt an envelope-encrypted token:
   * 1. KMS unwraps the Data Encryption Key (DEK).
   * 2. Ciphertext is decrypted with DEK using AES-256-GCM with tag verification.
   * 3. Plaintext DEK is wiped from memory immediately.
   * 4. Returns the decrypted secret.
   */
  async decrypt(payload: EnvelopeEncryptedPayload): Promise<string> {
    const plaintextKey = await this.kms.decryptDataKey(payload.encryptedDataKey);

    try {
      const iv = Buffer.from(payload.iv, 'hex');
      const tag = Buffer.from(payload.tag, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', plaintextKey, iv);

      decipher.setAuthTag(tag);

      let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } finally {
      plaintextKey.fill(0);
    }
  }
}
