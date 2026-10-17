import { KmsService } from './kms.interface';

/**
 * AWS KMS Adapter Interface & Implementation Blueprint.
 * Uses AWS KMS GenerateDataKey and Decrypt APIs.
 *
 * Example AWS SDK v3 usage:
 * const { KMSClient, GenerateDataKeyCommand, DecryptCommand } = require('@aws-sdk/client-kms');
 */
export interface AwsKmsConfig {
  keyId: string;
  region: string;
}

export class AwsKmsAdapter implements KmsService {
  constructor(
    private readonly config: AwsKmsConfig,
    private readonly client?: any, // KMSClient instance when @aws-sdk/client-kms is provided
  ) {}

  async generateDataKey(): Promise<{ plaintextKey: Buffer; ciphertextKey: string }> {
    if (!this.client) {
      throw new Error(
        'AWS KMS Client not initialized. Configure AWS credentials and keyId in production.',
      );
    }
    // const response = await this.client.send(new GenerateDataKeyCommand({ KeyId: this.config.keyId, KeySpec: 'AES_256' }));
    // return { plaintextKey: Buffer.from(response.Plaintext), ciphertextKey: Buffer.from(response.CiphertextBlob).toString('base64') };
    const response = await this.client.generateDataKey({
      KeyId: this.config.keyId,
      KeySpec: 'AES_256',
    });
    return {
      plaintextKey: Buffer.from(response.Plaintext),
      ciphertextKey: Buffer.from(response.CiphertextBlob).toString('base64'),
    };
  }

  async decryptDataKey(ciphertextKey: string): Promise<Buffer> {
    if (!this.client) {
      throw new Error('AWS KMS Client not initialized.');
    }
    const response = await this.client.decrypt({
      CiphertextBlob: Buffer.from(ciphertextKey, 'base64'),
    });
    return Buffer.from(response.Plaintext);
  }
}

/**
 * GCP Cloud KMS Adapter Interface & Implementation Blueprint.
 * Uses Google Cloud KMS KeyManagementServiceClient encrypt / decrypt.
 */
export interface GcpKmsConfig {
  keyName: string; // projects/{project}/locations/{location}/keyRings/{ring}/cryptoKeys/{key}
}

export class GcpKmsAdapter implements KmsService {
  constructor(
    private readonly config: GcpKmsConfig,
    private readonly client?: any, // KeyManagementServiceClient when @google-cloud/kms is provided
  ) {}

  async generateDataKey(): Promise<{ plaintextKey: Buffer; ciphertextKey: string }> {
    if (!this.client) {
      throw new Error(
        'GCP Cloud KMS Client not initialized. Configure GCP service account and keyName in production.',
      );
    }
    // Generate 32-byte DEK and wrap via GCP KMS encrypt API
    const crypto = await import('crypto');
    const plaintextKey = crypto.randomBytes(32);
    const [response] = await this.client.encrypt({
      name: this.config.keyName,
      plaintext: plaintextKey,
    });
    return {
      plaintextKey,
      ciphertextKey: Buffer.from(response.ciphertext).toString('base64'),
    };
  }

  async decryptDataKey(ciphertextKey: string): Promise<Buffer> {
    if (!this.client) {
      throw new Error('GCP Cloud KMS Client not initialized.');
    }
    const [response] = await this.client.decrypt({
      name: this.config.keyName,
      ciphertext: Buffer.from(ciphertextKey, 'base64'),
    });
    return Buffer.from(response.plaintext);
  }
}
