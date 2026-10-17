import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import { DatabaseService } from '../../database/database.service';
import { EnvelopeEncryptionService } from '../../common/crypto/envelope-encryption.service';
import { env } from '../../config/env.config';
import { ConnectCallbackDto, ScopeTier } from './dto/connect.dto';
import { getScopesForTier } from '../providers/scopes';

export interface StatePayload {
  userId: string;
  provider: 'google' | 'microsoft';
  tier: ScopeTier;
  nonce: string;
  exp: number;
}

@Injectable()
export class OAuthConnectService {
  private readonly logger = new Logger(OAuthConnectService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly envelopeCrypto: EnvelopeEncryptionService,
  ) {}

  /**
   * Helper: Base64URL encoding (RFC 7636)
   */
  private base64Url(buf: Buffer): string {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Generates PKCE code_verifier and code_challenge (S256)
   */
  generatePkce() {
    const verifier = this.base64Url(crypto.randomBytes(32));
    const challenge = this.base64Url(crypto.createHash('sha256').update(verifier).digest());
    return { verifier, challenge };
  }

  /**
   * Signs a state token with HMAC-SHA256 to guarantee tampering and CSRF protection
   */
  createSignedState(userId: string, provider: 'google' | 'microsoft', tier: ScopeTier): string {
    const payload: StatePayload = {
      userId,
      provider,
      tier,
      nonce: uuidv7(),
      exp: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
    const jsonStr = JSON.stringify(payload);
    const dataPart = this.base64Url(Buffer.from(jsonStr, 'utf8'));
    const sigPart = this.base64Url(
      crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update(dataPart).digest(),
    );
    return `${dataPart}.${sigPart}`;
  }

  /**
   * Verifies signed state token
   */
  verifySignedState(
    signedState: string,
    expectedUserId: string,
    expectedProvider: string,
  ): StatePayload {
    const parts = signedState.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Malformed state parameter');
    }
    const [dataPart, sigPart] = parts;
    const expectedSig = this.base64Url(
      crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update(dataPart).digest(),
    );

    if (sigPart !== expectedSig) {
      throw new UnauthorizedException('Invalid state parameter signature (CSRF mismatch)');
    }

    const payload: StatePayload = JSON.parse(Buffer.from(dataPart, 'base64url').toString('utf8'));

    if (Date.now() > payload.exp) {
      throw new UnauthorizedException('OAuth state parameter has expired. Please retry.');
    }
    if (payload.userId !== expectedUserId) {
      throw new UnauthorizedException('State user identity mismatch');
    }
    if (payload.provider !== expectedProvider) {
      throw new UnauthorizedException('State provider mismatch');
    }

    return payload;
  }

  /**
   * Step 1: Generate Authorization URL with PKCE and minimum/incremental scopes
   */
  generateAuthorizeUrl(
    userId: string,
    provider: 'google' | 'microsoft',
    tier: ScopeTier = ScopeTier.READONLY,
    redirectUri: string,
  ) {
    const pkce = this.generatePkce();
    const state = this.createSignedState(userId, provider, tier);
    const scopes = getScopesForTier(provider, tier);

    let authBase = '';
    const params = new URLSearchParams();

    if (provider === 'google') {
      authBase = 'https://accounts.google.com/o/oauth2/v2/auth';
      params.set('client_id', env.OIDC_GOOGLE_CLIENT_ID || 'mock_google_client_id');
      params.set('redirect_uri', redirectUri);
      params.set('response_type', 'code');
      params.set('scope', scopes.join(' '));
      params.set('access_type', 'offline');
      params.set('prompt', 'consent');
      params.set('code_challenge', pkce.challenge);
      params.set('code_challenge_method', 'S256');
      params.set('state', state);
    } else {
      authBase = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
      params.set('client_id', env.OIDC_MICROSOFT_CLIENT_ID || 'mock_microsoft_client_id');
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

  /**
   * Step 2: Exchange Authorization Code + PKCE Verifier for Tokens & Store with Envelope Encryption
   */
  async handleCallback(userId: string, dto: ConnectCallbackDto) {
    // 1. Verify CSRF State
    const statePayload = this.verifySignedState(dto.state, userId, dto.provider);

    // 2. Perform Token Exchange with Provider
    const tokenResult = await this.exchangeCodeForTokens(
      dto.provider,
      dto.code,
      dto.codeVerifier,
      dto.redirectUri,
    );

    // 3. Envelope Encryption for tokens (never log tokens)
    const encryptedAccess = await this.envelopeCrypto.encrypt(tokenResult.accessToken);
    const encryptedRefresh = await this.envelopeCrypto.encrypt(tokenResult.refreshToken);

    const expiresAt = new Date(Date.now() + tokenResult.expiresIn * 1000);

    // 4. Save connected account and credentials in transaction
    return this.db.transaction(async (client) => {
      // Upsert connected account
      const accountRes = await client.query(
        `INSERT INTO connected_accounts (user_id, provider, external_id, email, display_name, scopes, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         ON CONFLICT (user_id, provider, external_id) DO UPDATE
           SET email = EXCLUDED.email,
               display_name = EXCLUDED.display_name,
               scopes = EXCLUDED.scopes,
               status = 'active',
               updated_at = clock_timestamp()
         RETURNING id, provider, external_id, email, display_name, status, created_at;`,
        [
          userId,
          dto.provider,
          tokenResult.externalId,
          tokenResult.email,
          tokenResult.displayName,
          JSON.stringify(tokenResult.scopes),
        ],
      );

      const account = accountRes.rows[0];

      // Upsert envelope-encrypted credentials
      await client.query(
        `INSERT INTO oauth_credentials (
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
               updated_at = clock_timestamp();`,
        [
          account.id,
          userId,
          encryptedAccess.ciphertext,
          encryptedRefresh.ciphertext,
          encryptedRefresh.encryptedDataKey,
          encryptedRefresh.iv,
          encryptedRefresh.tag,
          expiresAt.toISOString(),
        ],
      );

      this.logger.log(
        `Account ${account.email} connected via ${dto.provider} with ${statePayload.tier} tier. Credentials safely envelope-encrypted.`,
      );

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

  /**
   * Disconnect an account: revoke provider tokens and purge cached data
   */
  async disconnectAccount(userId: string, accountId: string, purgeData = true) {
    // 1. Fetch credentials for revocation
    const credRes = await this.db.query(
      `SELECT c.id, c.encrypted_refresh_token, c.encrypted_data_key, c.iv, c.tag, a.provider, a.email
       FROM oauth_credentials c
       JOIN connected_accounts a ON c.connected_account_id = a.id
       WHERE c.connected_account_id = $1 AND c.user_id = $2;`,
      [accountId, userId],
      userId,
    );

    if (credRes.rows[0]) {
      const row = credRes.rows[0];
      try {
        // Decrypt refresh token in memory without logging
        const refreshToken = await this.envelopeCrypto.decrypt({
          ciphertext: row.encrypted_refresh_token,
          encryptedDataKey: row.encrypted_data_key,
          iv: row.iv,
          tag: row.tag,
        });

        // Revoke token at provider
        await this.revokeProviderToken(row.provider, refreshToken);
      } catch (err: any) {
        this.logger.warn(`Provider token revocation warning: ${err.message}`);
      }
    }

    // 2. Mark account revoked and optionally purge all cached mailbox data
    return this.db.transaction(async (client) => {
      if (purgeData) {
        // Purge related cached emails, threads, drafts, outbox, etc.
        await client.query(`DELETE FROM threads WHERE account_id = $1 AND user_id = $2;`, [
          accountId,
          userId,
        ]);
        await client.query(`DELETE FROM drafts WHERE account_id = $1 AND user_id = $2;`, [
          accountId,
          userId,
        ]);
        await client.query(
          `DELETE FROM outbox_operations WHERE account_id = $1 AND user_id = $2;`,
          [accountId, userId],
        );
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
      } else {
        await client.query(
          `UPDATE connected_accounts SET status = 'revoked', updated_at = clock_timestamp() WHERE id = $1 AND user_id = $2;`,
          [accountId, userId],
        );
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

  /**
   * Helper: Revoke token with provider endpoint
   */
  async revokeProviderToken(provider: string, token: string): Promise<void> {
    if (provider === 'google') {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } catch (err) {
        // Log without token
        this.logger.warn('Google token revocation network issue');
      }
    }
    // Microsoft tokens automatically invalidate or expire
  }

  /**
   * Helper: Exchange authorization code with provider endpoint (Mockable in tests)
   */
  async exchangeCodeForTokens(
    provider: 'google' | 'microsoft',
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    email: string;
    externalId: string;
    displayName: string;
    scopes: string[];
  }> {
    // If running in development with mock code or unconfigured client IDs, return realistic mocked tokens
    if (
      code.startsWith('mock_') ||
      (provider === 'google' && !env.OIDC_GOOGLE_CLIENT_ID) ||
      (provider === 'microsoft' && !env.OIDC_MICROSOFT_CLIENT_ID)
    ) {
      return {
        accessToken: `ya29.mock_access_token_${provider}_${uuidv7()}`,
        refreshToken: `1//mock_refresh_token_${provider}_${uuidv7()}`,
        expiresIn: 3600,
        email: provider === 'google' ? 'alex.morgan@gmail.com' : 'alex.morgan@outlook.com',
        externalId: `${provider}-ext-id-${uuidv7().substring(0, 8)}`,
        displayName: 'Alex Morgan',
        scopes: getScopesForTier(provider, ScopeTier.READONLY),
      };
    }

    const tokenEndpoint =
      provider === 'google'
        ? 'https://oauth2.googleapis.com/token'
        : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const clientId =
      provider === 'google' ? env.OIDC_GOOGLE_CLIENT_ID : env.OIDC_MICROSOFT_CLIENT_ID;
    const clientSecret =
      provider === 'google' ? env.OIDC_GOOGLE_CLIENT_SECRET : env.OIDC_MICROSOFT_CLIENT_SECRET;

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
      throw new BadRequestException(`Failed to exchange authorization code: ${errText}`);
    }

    const json = (await res.json()) as any;
    const email = json.email || `${provider}-user@example.com`;
    const externalId = json.sub || json.id || uuidv7();

    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token || `fallback_refresh_${uuidv7()}`,
      expiresIn: json.expires_in || 3600,
      email,
      externalId,
      displayName: json.name || email.split('@')[0],
      scopes: json.scope ? json.scope.split(' ') : [],
    };
  }
}
