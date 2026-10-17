import { KmsService } from './kms.interface';
export interface AwsKmsConfig {
    keyId: string;
    region: string;
}
export declare class AwsKmsAdapter implements KmsService {
    private readonly config;
    private readonly client?;
    constructor(config: AwsKmsConfig, client?: any | undefined);
    generateDataKey(): Promise<{
        plaintextKey: Buffer;
        ciphertextKey: string;
    }>;
    decryptDataKey(ciphertextKey: string): Promise<Buffer>;
}
export interface GcpKmsConfig {
    keyName: string;
}
export declare class GcpKmsAdapter implements KmsService {
    private readonly config;
    private readonly client?;
    constructor(config: GcpKmsConfig, client?: any | undefined);
    generateDataKey(): Promise<{
        plaintextKey: Buffer;
        ciphertextKey: string;
    }>;
    decryptDataKey(ciphertextKey: string): Promise<Buffer>;
}
