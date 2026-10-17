import { DatabaseService } from '../../database/database.service';
import { EnvelopeEncryptionService } from '../../common/crypto/envelope-encryption.service';
import { ConnectCallbackDto, ScopeTier } from './dto/connect.dto';
export interface StatePayload {
    userId: string;
    provider: 'google' | 'microsoft';
    tier: ScopeTier;
    nonce: string;
    exp: number;
}
export declare class OAuthConnectService {
    private readonly db;
    private readonly envelopeCrypto;
    private readonly logger;
    constructor(db: DatabaseService, envelopeCrypto: EnvelopeEncryptionService);
    private base64Url;
    generatePkce(): {
        verifier: string;
        challenge: string;
    };
    createSignedState(userId: string, provider: 'google' | 'microsoft', tier: ScopeTier): string;
    verifySignedState(signedState: string, expectedUserId: string, expectedProvider: string): StatePayload;
    generateAuthorizeUrl(userId: string, provider: 'google' | 'microsoft', tier: ScopeTier | undefined, redirectUri: string): {
        url: string;
        codeVerifier: string;
        state: string;
        tier: ScopeTier;
        scopes: string[];
    };
    handleCallback(userId: string, dto: ConnectCallbackDto): Promise<{
        success: boolean;
        account: {
            id: any;
            provider: any;
            email: any;
            displayName: any;
            status: any;
            scopes: string[];
            tier: ScopeTier;
        };
    }>;
    disconnectAccount(userId: string, accountId: string, purgeData?: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
    revokeProviderToken(provider: string, token: string): Promise<void>;
    exchangeCodeForTokens(provider: 'google' | 'microsoft', code: string, codeVerifier: string, redirectUri: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        email: string;
        externalId: string;
        displayName: string;
        scopes: string[];
    }>;
}
