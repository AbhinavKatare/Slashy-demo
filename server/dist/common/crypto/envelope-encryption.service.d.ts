import { LocalKmsService } from './kms/local-kms.service';
export interface EnvelopeEncryptedPayload {
    ciphertext: string;
    iv: string;
    tag: string;
    encryptedDataKey: string;
}
export declare class EnvelopeEncryptionService {
    private readonly kms;
    private readonly logger;
    constructor(kms: LocalKmsService);
    encrypt(plaintextSecret: string): Promise<EnvelopeEncryptedPayload>;
    decrypt(payload: EnvelopeEncryptedPayload): Promise<string>;
}
