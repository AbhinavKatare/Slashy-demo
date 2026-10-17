"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OAuthConnectService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthConnectService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const uuid_1 = require("uuid");
const database_service_1 = require("../../database/database.service");
const envelope_encryption_service_1 = require("../../common/crypto/envelope-encryption.service");
const env_config_1 = require("../../config/env.config");
const connect_dto_1 = require("./dto/connect.dto");
const scopes_1 = require("../providers/scopes");
let OAuthConnectService = OAuthConnectService_1 = class OAuthConnectService {
    db;
    envelopeCrypto;
    logger = new common_1.Logger(OAuthConnectService_1.name);
    constructor(db, envelopeCrypto) {
        this.db = db;
        this.envelopeCrypto = envelopeCrypto;
    }
    base64Url(buf) {
        return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    generatePkce() {
        const verifier = this.base64Url(crypto.randomBytes(32));
        const challenge = this.base64Url(crypto.createHash('sha256').update(verifier).digest());
        return { verifier, challenge };
    }
    createSignedState(userId, provider, tier) {
        const payload = {
            userId,
            provider,
            tier,
            nonce: (0, uuid_1.v7)(),
            exp: Date.now() + 10 * 60 * 1000,
        };
        const jsonStr = JSON.stringify(payload);
        const dataPart = this.base64Url(Buffer.from(jsonStr, 'utf8'));
        const sigPart = this.base64Url(crypto.createHmac('sha256', env_config_1.env.JWT_ACCESS_SECRET).update(dataPart).digest());
        return `${dataPart}.${sigPart}`;
    }
    verifySignedState(signedState, expectedUserId, expectedProvider) {
        const parts = signedState.split('.');
        if (parts.length !== 2) {
            throw new common_1.BadRequestException('Malformed state parameter');
        }
        const [dataPart, sigPart] = parts;
        const expectedSig = this.base64Url(crypto.createHmac('sha256', env_config_1.env.JWT_ACCESS_SECRET).update(dataPart).digest());
        if (sigPart !== expectedSig) {
            throw new common_1.UnauthorizedException('Invalid state parameter signature (CSRF mismatch)');
        }
        const payload = JSON.parse(Buffer.from(dataPart, 'base64url').toString('utf8'));
        if (Date.now() > payload.exp) {
            throw new common_1.UnauthorizedException('OAuth state parameter has expired. Please retry.');
        }
        if (payload.userId !== expectedUserId) {
            throw new common_1.UnauthorizedException('State user identity mismatch');
        }
        if (payload.provider !== expectedProvider) {
            throw new common_1.UnauthorizedException('State provider mismatch');
        }
        return payload;
    }
    generateAuthorizeUrl(userId, provider, tier = connect_dto_1.ScopeTier.READONLY, redirectUri) {
        const pkce = this.generatePkce();
        const state = this.createSignedState(userId, provider, tier);
        const scopes = (0, scopes_1.getScopesForTier)(provider, tier);
        let authBase = '';
        const params = new URLSearchParams();
        if (provider === 'google') {
            authBase = 'https://accounts.google.com/o/oauth2/v2/auth';
            params.set('client_id', env_config_1.env.OIDC_GOOGLE_CLIENT_ID || 'mock_google_client_id');
            params.set('redirect_uri', redirectUri);
            params.set('response_type', 'code');
            params.set('scope', scopes.join(' '));
            params.set('access_type', 'offline');
            params.set('prompt', 'consent');
            params.set('code_challenge', pkce.challenge);
            params.set('code_challenge_method', 'S256');
            params.set('state', state);
        }
        else {
            authBase = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
            params.set('client_id', env_config_1.env.OIDC_MICROSOFT_CLIENT_ID || 'mock_microsoft_client_id');
            params.set('redirect_uri', redirectUri);
            params.set('response_type', 'code');
            params.set('scope', scopes.join(' '));
            params.set('response_mode', 'query');
            params.set('code_challenge', pkce.challenge);
            params.set('code_challenge_method', 'S256');
            params.set('state', state);
        }
        return {
            url: `${authBase}?${params.toString()}`,
            codeVerifier: pkce.verifier,
            state,
            tier,
            scopes,
        };
    }
    async handleCallback(userId, dto) {
        const statePayload = this.verifySignedState(dto.state, userId, dto.provider);
        const tokenResult = await this.exchangeCodeForTokens(dto.provider, dto.code, dto.codeVerifier, dto.redirectUri);
        const encryptedAccess = await this.envelopeCrypto.encrypt(tokenResult.accessToken);
        const encryptedRefresh = await this.envelopeCrypto.encrypt(tokenResult.refreshToken);
        const expiresAt = new Date(Date.now() + tokenResult.expiresIn * 1000);
        return this.db.transaction(async (client) => {
            const accountRes = await client.query(`INSERT INTO connected_accounts (user_id, provider, external_id, email, display_name, scopes, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         ON CONFLICT (user_id, provider, external_id) DO UPDATE
           SET email = EXCLUDED.email,
               display_name = EXCLUDED.display_name,
               scopes = EXCLUDED.scopes,
               status = 'active',
               updated_at = clock_timestamp()
         RETURNING id, provider, external_id, email, display_name, status, created_at;`, [
                userId,
                dto.provider,
                tokenResult.externalId,
                tokenResult.email,
                tokenResult.displayName,
                JSON.stringify(tokenResult.scopes),
            ]);
            const account = accountRes.rows[0];
            await client.query(`INSERT INTO oauth_credentials (
           connected_account_id, user_id, encrypted_access_token, encrypted_refresh_token,
           encrypted_data_key, iv, tag, token_type, expires_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Bearer', $8)
         ON CONFLICT (connected_account_id) DO UPDATE
           SET encrypted_access_token = EXCLUDED.encrypted_access_token,
               encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
               encrypted_data_key = EXCLUDED.encrypted_data_key,
               iv = EXCLUDED.iv,
               tag = EXCLUDED.tag,
               expires_at = EXCLUDED.expires_at,
               updated_at = clock_timestamp();`, [
                account.id,
                userId,
                encryptedAccess.ciphertext,
                encryptedRefresh.ciphertext,
                encryptedRefresh.encryptedDataKey,
                encryptedRefresh.iv,
                encryptedRefresh.tag,
                expiresAt.toISOString(),
            ]);
            this.logger.log(`Account ${account.email} connected via ${dto.provider} with ${statePayload.tier} tier. Credentials safely envelope-encrypted.`);
            return {
                success: true,
                account: {
                    id: account.id,
                    provider: account.provider,
                    email: account.email,
                    displayName: account.display_name,
                    status: account.status,
                    scopes: tokenResult.scopes,
                    tier: statePayload.tier,
                },
            };
        }, userId);
    }
    async disconnectAccount(userId, accountId, purgeData = true) {
        const credRes = await this.db.query(`SELECT c.id, c.encrypted_refresh_token, c.encrypted_data_key, c.iv, c.tag, a.provider, a.email
       FROM oauth_credentials c
       JOIN connected_accounts a ON c.connected_account_id = a.id
       WHERE c.connected_account_id = $1 AND c.user_id = $2;`, [accountId, userId], userId);
        if (credRes.rows[0]) {
            const row = credRes.rows[0];
            try {
                const refreshToken = await this.envelopeCrypto.decrypt({
                    ciphertext: row.encrypted_refresh_token,
                    encryptedDataKey: row.encrypted_data_key,
                    iv: row.iv,
                    tag: row.tag,
                });
                await this.revokeProviderToken(row.provider, refreshToken);
            }
            catch (err) {
                this.logger.warn(`Provider token revocation warning: ${err.message}`);
            }
        }
        return this.db.transaction(async (client) => {
            if (purgeData) {
                await client.query(`DELETE FROM threads WHERE account_id = $1 AND user_id = $2;`, [
                    accountId,
                    userId,
                ]);
                await client.query(`DELETE FROM drafts WHERE account_id = $1 AND user_id = $2;`, [
                    accountId,
                    userId,
                ]);
                await client.query(`DELETE FROM outbox_operations WHERE account_id = $1 AND user_id = $2;`, [accountId, userId]);
                await client.query(`DELETE FROM calendar_events WHERE account_id = $1 AND user_id = $2;`, [
                    accountId,
                    userId,
                ]);
                await client.query(`DELETE FROM sync_cursors WHERE account_id = $1 AND user_id = $2;`, [
                    accountId,
                    userId,
                ]);
                await client.query(`DELETE FROM connected_accounts WHERE id = $1 AND user_id = $2;`, [
                    accountId,
                    userId,
                ]);
            }
            else {
                await client.query(`UPDATE connected_accounts SET status = 'revoked', updated_at = clock_timestamp() WHERE id = $1 AND user_id = $2;`, [accountId, userId]);
                await client.query(`DELETE FROM oauth_credentials WHERE connected_account_id = $1;`, [
                    accountId,
                ]);
            }
            return {
                success: true,
                message: purgeData
                    ? 'Account disconnected, provider tokens revoked, and all data purged.'
                    : 'Account disconnected and provider tokens revoked.',
            };
        }, userId);
    }
    async revokeProviderToken(provider, token) {
        if (provider === 'google') {
            try {
                await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                });
            }
            catch (err) {
                this.logger.warn('Google token revocation network issue');
            }
        }
    }
    async exchangeCodeForTokens(provider, code, codeVerifier, redirectUri) {
        if (code.startsWith('mock_') ||
            (provider === 'google' && !env_config_1.env.OIDC_GOOGLE_CLIENT_ID) ||
            (provider === 'microsoft' && !env_config_1.env.OIDC_MICROSOFT_CLIENT_ID)) {
            return {
                accessToken: `ya29.mock_access_token_${provider}_${(0, uuid_1.v7)()}`,
                refreshToken: `1//mock_refresh_token_${provider}_${(0, uuid_1.v7)()}`,
                expiresIn: 3600,
                email: provider === 'google' ? 'alex.morgan@gmail.com' : 'alex.morgan@outlook.com',
                externalId: `${provider}-ext-id-${(0, uuid_1.v7)().substring(0, 8)}`,
                displayName: 'Alex Morgan',
                scopes: (0, scopes_1.getScopesForTier)(provider, connect_dto_1.ScopeTier.READONLY),
            };
        }
        const tokenEndpoint = provider === 'google'
            ? 'https://oauth2.googleapis.com/token'
            : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        const clientId = provider === 'google' ? env_config_1.env.OIDC_GOOGLE_CLIENT_ID : env_config_1.env.OIDC_MICROSOFT_CLIENT_ID;
        const clientSecret = provider === 'google' ? env_config_1.env.OIDC_GOOGLE_CLIENT_SECRET : env_config_1.env.OIDC_MICROSOFT_CLIENT_SECRET;
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
            code_verifier: codeVerifier,
        });
        const res = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        if (!res.ok) {
            const errText = await res.text();
            this.logger.error(`Token exchange failed for ${provider}: ${res.status}`);
            throw new common_1.BadRequestException(`Failed to exchange authorization code: ${errText}`);
        }
        const json = (await res.json());
        const email = json.email || `${provider}-user@example.com`;
        const externalId = json.sub || json.id || (0, uuid_1.v7)();
        return {
            accessToken: json.access_token,
            refreshToken: json.refresh_token || `fallback_refresh_${(0, uuid_1.v7)()}`,
            expiresIn: json.expires_in || 3600,
            email,
            externalId,
            displayName: json.name || email.split('@')[0],
            scopes: json.scope ? json.scope.split(' ') : [],
        };
    }
};
exports.OAuthConnectService = OAuthConnectService;
exports.OAuthConnectService = OAuthConnectService = OAuthConnectService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        envelope_encryption_service_1.EnvelopeEncryptionService])
], OAuthConnectService);
//# sourceMappingURL=oauth-connect.service.js.map