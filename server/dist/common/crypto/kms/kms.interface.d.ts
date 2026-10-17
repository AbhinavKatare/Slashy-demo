export interface KmsService {
    generateDataKey(): Promise<{
        plaintextKey: Buffer;
        ciphertextKey: string;
    }>;
    decryptDataKey(ciphertextKey: string): Promise<Buffer>;
}
