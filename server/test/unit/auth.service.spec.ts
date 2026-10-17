import { UnauthorizedException, HttpException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../../src/modules/auth/auth.service';
import { EncryptionService } from '../../src/common/crypto/encryption.service';
import { AuthProvider } from '../../src/modules/auth/dto/auth.dto';
import { env } from '../../src/config/env.config';

describe('AuthService (Token Rotation & Replay Attack Protection)', () => {
  let authService: AuthService;
  let dbMock: any;
  let oidcMock: any;
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService();

    dbMock = {
      query: jest.fn(),
      transaction: jest.fn(),
    };

    oidcMock = {
      verifyIdToken: jest.fn(),
    };

    authService = new AuthService(dbMock, encryptionService, oidcMock);
  });

  describe('loginWithOidc', () => {
    it('should authenticate user and issue short-lived access token and 7-day refresh token', async () => {
      oidcMock.verifyIdToken.mockResolvedValue({
        provider: 'google',
        externalId: 'google-sub-12345',
        email: 'alex.morgan@example.com',
        displayName: 'Alex Morgan',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      dbMock.query
        .mockResolvedValueOnce({
          rows: [
            { id: 'user-uuid-1', email: 'alex.morgan@example.com', display_name: 'Alex Morgan' },
          ],
        }) // Upsert user
        .mockResolvedValueOnce({ rows: [] }) // Upsert connected account
        .mockResolvedValueOnce({ rows: [] }); // Insert session

      const result = await authService.loginWithOidc({
        provider: AuthProvider.GOOGLE,
        idToken: 'mock.valid.idtoken',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(900); // 15 mins
      expect(result.user.email).toBe('alex.morgan@example.com');

      // Verify session insert called with refresh_token_family
      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sessions'),
        expect.arrayContaining(['user-uuid-1']),
      );
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate refresh token and issue new token pair within same family', async () => {
      const userId = 'user-uuid-1';
      const sessionId = 'session-uuid-1';
      const family = 'family-uuid-1';

      // Generate initial refresh token
      const oldRefreshToken = jwt.sign({ sub: userId, sessionId, family }, env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });
      const oldHash = encryptionService.hashToken(oldRefreshToken);

      // Session in DB has matching current_token_hash and is not revoked
      dbMock.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: sessionId,
              user_id: userId,
              refresh_token_family: family,
              current_token_hash: oldHash,
              is_revoked: false,
              expires_at: new Date(Date.now() + 100000).toISOString(),
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ email: 'alex.morgan@example.com' }],
        })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE sessions set current_token_hash

      const result = await authService.rotateRefreshToken(oldRefreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(oldRefreshToken);

      // Verify the new token has the same family
      const decodedNew = jwt.verify(result.refreshToken, env.JWT_REFRESH_SECRET) as any;
      expect(decodedNew.family).toBe(family);
      expect(decodedNew.sessionId).toBe(sessionId);

      // Verify session DB updated with new hash
      const newHash = encryptionService.hashToken(result.refreshToken);
      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sessions \n       SET current_token_hash = $1'),
        expect.arrayContaining([newHash, sessionId]),
      );
    });

    it('REPLAY ATTACK: should detect replayed token, revoke entire family, and log security audit', async () => {
      const userId = 'user-uuid-1';
      const sessionId = 'session-uuid-1';
      const family = 'family-uuid-1';

      // Attacker re-uses an already rotated / stale refresh token
      const staleToken = jwt.sign({ sub: userId, sessionId, family }, env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });
      const staleHash = encryptionService.hashToken(staleToken);

      // In the database, current_token_hash has already progressed to newerHash!
      const newerHash = encryptionService.hashToken('some_newer_token');

      dbMock.query.mockResolvedValueOnce({
        rows: [
          {
            id: sessionId,
            user_id: userId,
            refresh_token_family: family,
            current_token_hash: newerHash, // Mismatch with staleHash!
            is_revoked: false,
            expires_at: new Date(Date.now() + 100000).toISOString(),
          },
        ],
      });

      // Expect replay detection to throw and invalidate the entire token family
      await expect(
        authService.rotateRefreshToken(staleToken, '192.168.1.100', 'AttackerAgent'),
      ).rejects.toThrow(HttpException);

      // Verify entire family revoked in DB
      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'UPDATE sessions SET is_revoked = true WHERE refresh_token_family = $1',
        ),
        [family],
      );

      // Verify security audit log recorded
      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_log'),
        expect.arrayContaining([
          userId,
          sessionId,
          '192.168.1.100',
          expect.stringContaining(staleHash),
        ]),
      );
    });

    it('should reject invalid or expired JWT token', async () => {
      await expect(authService.rotateRefreshToken('totally_invalid_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeSession and revokeAllSessions', () => {
    it('should revoke a single session for the user', async () => {
      dbMock.query.mockResolvedValueOnce({ rows: [] });

      await authService.revokeSession('user-1', 'session-1');

      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sessions SET is_revoked = true'),
        ['session-1', 'user-1'],
        'user-1',
      );
    });

    it('should revoke all sessions for the user', async () => {
      dbMock.query.mockResolvedValueOnce({ rows: [] });

      await authService.revokeAllSessions('user-1');

      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'UPDATE sessions SET is_revoked = true, updated_at = clock_timestamp()',
        ),
        ['user-1'],
        'user-1',
      );
    });
  });
});
