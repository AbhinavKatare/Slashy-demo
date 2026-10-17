import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { env } from '../../config/env.config';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    this.key = Buffer.from(env.CREDENTIAL_ENCRYPTION_KEY, 'hex');
  }

  /**
   * Encrypt plaintext string using AES-256-GCM
   */
  encrypt(plainText: string): { cipherText: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag().toString('hex');

    return {
      cipherText: encrypted,
      iv: iv.toString('hex'),
      tag,
    };
  }

  /**
   * Decrypt ciphertext string using AES-256-GCM
   */
  decrypt(cipherText: string, ivHex: string, tagHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Cryptographic SHA-256 hash for refresh token tracking
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
