import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { KmsService } from './kms.interface';
import { env } from '../../../config/env.config';

@Injectable()
export class LocalKmsService implements KmsService {
  private readonly masterKey: Buffer;

  constructor() {
    // 256-bit Key Encryption Key (KEK)
    this.masterKey = Buffer.from(env.CREDENTIAL_ENCRYPTION_KEY, 'hex');
  }

  async generateDataKey(): Promise<{ plaintextKey: Buffer; ciphertextKey: string }> {
    // 1. Generate random 32-byte (256-bit) Data Encryption Key (DEK)
    const plaintextKey = crypto.randomBytes(32);

    // 2. Wrap DEK with Master KEK using AES-256-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    let wrapped = cipher.update(plaintextKey);
    wrapped = Buffer.concat([wrapped, cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: iv:tag:wrappedKey in hex
    const ciphertextKey = `${iv.toString('hex')}:${tag.toString('hex')}:${wrapped.toString('hex')}`;

    return {
      plaintextKey,
      ciphertextKey,
    };
  }

  async decryptDataKey(ciphertextKey: string): Promise<Buffer> {
    const parts = ciphertextKey.split(':');
    if (parts.length !== 3) {
      throw new Error('Malformed ciphertext key format. Expected iv:tag:wrappedKey');
    }

    const [ivHex, tagHex, wrappedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const wrapped = Buffer.from(wrappedHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(tag);

    const decrypted = decipher.update(wrapped);
    return Buffer.concat([decrypted, decipher.final()]);
  }
}
