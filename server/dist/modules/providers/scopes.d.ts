export interface ScopeDefinition {
    scope: string;
    tier: 'readonly' | 'modify_send';
    justification: string;
}
export declare const GOOGLE_SCOPES: Record<string, ScopeDefinition>;
export declare const MICROSOFT_SCOPES: Record<string, ScopeDefinition>;
export declare function getScopesForTier(provider: 'google' | 'microsoft', tier?: 'readonly' | 'modify_send'): string[];
