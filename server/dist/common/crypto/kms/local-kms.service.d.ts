import { KmsService } from './kms.interface';
export declare class LocalKmsService implements KmsService {
    private readonly masterKey;
    constructor();
    generateDataKey(): Promise<{
        plaintextKey: Buffer;
        ciphertextKey: string;
    }>;
    decryptDataKey(ciphertextKey: string): Promise<Buffer>;
}
