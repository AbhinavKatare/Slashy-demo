"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GcpKmsAdapter = exports.AwsKmsAdapter = void 0;
class AwsKmsAdapter {
    config;
    client;
    constructor(config, client) {
        this.config = config;
        this.client = client;
    }
    async generateDataKey() {
        if (!this.client) {
            throw new Error('AWS KMS Client not initialized. Configure AWS credentials and keyId in production.');
        }
        const response = await this.client.generateDataKey({
            KeyId: this.config.keyId,
            KeySpec: 'AES_256',
        });
        return {
            plaintextKey: Buffer.from(response.Plaintext),
            ciphertextKey: Buffer.from(response.CiphertextBlob).toString('base64'),
        };
    }
    async decryptDataKey(ciphertextKey) {
        if (!this.client) {
            throw new Error('AWS KMS Client not initialized.');
        }
        const response = await this.client.decrypt({
            CiphertextBlob: Buffer.from(ciphertextKey, 'base64'),
        });
        return Buffer.from(response.Plaintext);
    }
}
exports.AwsKmsAdapter = AwsKmsAdapter;
class GcpKmsAdapter {
    config;
    client;
    constructor(config, client) {
        this.config = config;
        this.client = client;
    }
    async generateDataKey() {
        if (!this.client) {
            throw new Error('GCP Cloud KMS Client not initialized. Configure GCP service account and keyName in production.');
        }
        const crypto = await Promise.resolve().then(() => require('crypto'));
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
    async decryptDataKey(ciphertextKey) {
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
exports.GcpKmsAdapter = GcpKmsAdapter;
//# sourceMappingURL=cloud-kms.adapter.js.map