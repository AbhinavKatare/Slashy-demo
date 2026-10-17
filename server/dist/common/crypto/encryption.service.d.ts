export declare class EncryptionService {
    private readonly key;
    constructor();
    encrypt(plainText: string): {
        cipherText: string;
        iv: string;
        tag: string;
    };
    decrypt(cipherText: string, ivHex: string, tagHex: string): string;
    hashToken(token: string): string;
}
