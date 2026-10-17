import { UnauthorizedException } from '@nestjs/common';
import { OAuthConnectService } from '../../src/modules/accounts/oauth-connect.service';
import { EnvelopeEncryptionService } from '../../src/common/crypto/envelope-encryption.service';
import { LocalKmsService } from '../../src/common/crypto/kms/local-kms.service';
import { ConnectProvider, ScopeTier } from '../../src/modules/accounts/dto/connect.dto';

describe('OAuthConnectService (PKCE, State Validation, Incremental Scopes & Disconnect)', () => {
  let service: OAuthConnectService;
  let dbMock: any;
  let envelopeCrypto: EnvelopeEncryptionService;

  beforeEach(() => {
    dbMock = {
      query: jest.fn(),
      transaction: jest.fn((cb) => cb(dbMock)),
    };
    const kms = new LocalKmsService();
    envelopeCrypto = new EnvelopeEncryptionService(kms);
    service = new OAuthConnectService(dbMock, envelopeCrypto);
  });

  describe('generateAuthorizeUrl (PKCE & Incremental Scopes)', () => {
    it('should generate Google authorization URL with S256 PKCE and readonly scopes by default', () => {
      const result = service.generateAuthorizeUrl(
        'user-1',
        ConnectProvider.GOOGLE,
        ScopeTier.READONLY,
        'https://app.inboxcompanion.app/oauth/callback',
      );

      expect(result.url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(result.url).toContain('code_challenge_method=S256');
      expect(result.url).toContain('gmail.readonly');
      // Should not contain modify/send in readonly tier
      expect(result.url).not.toContain('gmail.send');
      expect(result.codeVerifier).toBeDefined();
      expect(result.state).toBeDefined();
    });

    it('should generate Microsoft authorization URL with elevated modify_send tier scopes on demand', () => {
      const result = service.generateAuthorizeUrl(
        'user-1',
        ConnectProvider.MICROSOFT,
        ScopeTier.MODIFY_SEND,
        'https://app.inboxcompanion.app/oauth/callback',
      );

      expect(result.url).toContain(
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      );
      expect(result.url).toContain('code_challenge_method=S256');
      expect(result.url).toContain('Mail.Send');
      expect(result.url).toContain('Mail.ReadWrite');
    });
  });

  describe('handleCallback (CSRF & State validation)', () => {
    it('should reject callback when state parameter is invalid or tampered (CSRF protection)', async () => {
      const dto = {
        provider: ConnectProvider.GOOGLE,
        code: 'mock_auth_code_123',
        codeVerifier: 'verifier_abc_123',
        state: 'tamperedPayload.tamperedSignature',
        redirectUri: 'https://app.inboxcompanion.app/oauth/callback',
      };

      await expect(service.handleCallback('user-1', dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject callback when state belongs to a different user', async () => {
      const stateForUser2 = service.createSignedState(
        'user-2',
        ConnectProvider.GOOGLE,
        ScopeTier.READONLY,
      );
      const dto = {
        provider: ConnectProvider.GOOGLE,
        code: 'mock_auth_code_123',
        codeVerifier: 'verifier_abc_123',
        state: stateForUser2,
        redirectUri: 'https://app.inboxcompanion.app/oauth/callback',
      };

      await expect(service.handleCallback('user-1', dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully exchange code and store credentials with envelope encryption', async () => {
      const validState = service.createSignedState(
        'user-1',
        ConnectProvider.GOOGLE,
        ScopeTier.READONLY,
      );
      const dto = {
        provider: ConnectProvider.GOOGLE,
        code: 'mock_auth_code_123',
        codeVerifier: 'verifier_abc_123',
        state: validState,
        redirectUri: 'https://app.inboxcompanion.app/oauth/callback',
      };

      dbMock.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'acc-uuid-1',
              provider: 'google',
              external_id: 'google-sub-1',
              email: 'alex.morgan@gmail.com',
              display_name: 'Alex Morgan',
              status: 'active',
              created_at: new Date().toISOString(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }); // insert oauth_credentials

      const result = await service.handleCallback('user-1', dto);

      expect(result.success).toBe(true);
      expect(result.account.email).toBe('alex.morgan@gmail.com');

      // Verify oauth_credentials insert was called with envelope-encrypted ciphertext and encrypted_data_key
      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO oauth_credentials'),
        expect.arrayContaining(['acc-uuid-1', 'user-1']),
      );
    });
  });

  describe('disconnectAccount (Provider Revocation & Data Purge)', () => {
    it('should revoke provider token and purge cached account data', async () => {
      const userId = 'user-1';
      const accountId = 'acc-1';

      // Mock credentials fetch for revocation
      dbMock.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'cred-1',
            encrypted_refresh_token: 'cipher',
            encrypted_data_key: 'key',
            iv: '0'.repeat(24),
            tag: '0'.repeat(32),
            provider: 'google',
            email: 'alex@example.com',
          },
        ],
      });

      // Mock token decryption bypass for test
      jest.spyOn(envelopeCrypto, 'decrypt').mockResolvedValue('mock_refresh_token');
      const revokeSpy = jest.spyOn(service, 'revokeProviderToken').mockResolvedValue(undefined);

      const result = await service.disconnectAccount(userId, accountId, true);

      expect(result.success).toBe(true);
      expect(revokeSpy).toHaveBeenCalledWith('google', 'mock_refresh_token');

      // Verify cascading purge of threads, drafts, outbox, calendar, cursors, account
      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM threads WHERE account_id = $1'),
        [accountId, userId],
      );
      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM connected_accounts WHERE id = $1'),
        [accountId, userId],
      );
    });
  });
});
