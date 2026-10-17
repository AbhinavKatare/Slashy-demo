export interface OidcUserInfo {
    provider: 'google' | 'microsoft';
    externalId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
}
export declare class OidcService {
    private readonly logger;
    verifyIdToken(provider: 'google' | 'microsoft', idToken: string): Promise<OidcUserInfo>;
    getAuthorizationUrl(provider: 'google' | 'microsoft', state: string): string;
}
