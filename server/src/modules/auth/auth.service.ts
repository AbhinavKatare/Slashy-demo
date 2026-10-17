import {
  Injectable,
  UnauthorizedException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { v7 as uuidv7 } from 'uuid';
import { env } from '../../config/env.config';
import { DatabaseService } from '../../database/database.service';
import { EncryptionService } from '../../common/crypto/encryption.service';
import { OidcService } from '../providers/oidc.service';
import { AuthTokensResponseDto, OidcLoginDto, SessionResponseDto } from './dto/auth.dto';

export interface JwtAccessPayload {
  sub: string; // User ID
  email: string;
  sessionId: string;
}

export interface JwtRefreshPayload {
  sub: string; // User ID
  sessionId: string;
  family: string; // Family UUID
  jti?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly encryptionService: EncryptionService,
    private readonly oidcService: OidcService,
  ) {}

  /**
   * Authenticate via Google or Microsoft OIDC ID Token
   */
  async loginWithOidc(
    dto: OidcLoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokensResponseDto> {
    const oidcUser = await this.oidcService.verifyIdToken(dto.provider, dto.idToken);

    // 1. Upsert User
    const userRes = await this.db.query(
      `INSERT INTO users (email, display_name, avatar_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE 
         SET display_name = EXCLUDED.display_name,
             avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
             updated_at = clock_timestamp()
       RETURNING id, email, display_name, avatar_url;`,
      [oidcUser.email, oidcUser.displayName, oidcUser.avatarUrl || null],
    );
    const user = userRes.rows[0];

    // 2. Upsert Device (if provided)
    let deviceId: string | null = null;
    if (dto.deviceName || dto.platform) {
      const devRes = await this.db.query(
        `INSERT INTO devices (user_id, device_name, platform, app_version, push_token)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id;`,
        [
          user.id,
          dto.deviceName || 'Unknown Device',
          dto.platform || 'unknown',
          dto.appVersion || '1.0.0',
          dto.pushToken || null,
        ],
      );
      deviceId = devRes.rows[0]?.id || null;
    }

    // 3. Upsert Connected Account
    await this.db.query(
      `INSERT INTO connected_accounts (user_id, provider, external_id, email, display_name, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       ON CONFLICT (user_id, provider, external_id) DO UPDATE
         SET status = 'active', updated_at = clock_timestamp();`,
      [user.id, oidcUser.provider, oidcUser.externalId, oidcUser.email, oidcUser.displayName],
    );

    // 4. Create Session & Rotating Refresh Token Family
    const sessionId = uuidv7();
    const family = uuidv7();
    const refreshToken = this.createRefreshToken(user.id, sessionId, family);
    const accessToken = this.createAccessToken(user.id, user.email, sessionId);
    const tokenHash = this.encryptionService.hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.db.query(
      `INSERT INTO sessions (id, user_id, device_id, refresh_token_family, current_token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
      [
        sessionId,
        user.id,
        deviceId,
        family,
        tokenHash,
        expiresAt,
        ipAddress || null,
        userAgent || null,
      ],
    );

    this.logger.log(
      `User ${user.email} authenticated via ${oidcUser.provider}. Session ${sessionId} created.`,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins in seconds
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
      },
    };
  }

  /**
   * Rotate refresh token with strict reuse / replay detection
   */
  async rotateRefreshToken(
    oldRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    let payload: JwtRefreshPayload;
    try {
      payload = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
    } catch (err: any) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { sub: userId, sessionId, family } = payload;
    const oldHash = this.encryptionService.hashToken(oldRefreshToken);

    // Fetch session
    const res = await this.db.query(
      `SELECT id, user_id, refresh_token_family, current_token_hash, is_revoked, expires_at
       FROM sessions
       WHERE id = $1;`,
      [sessionId],
    );

    const session = res.rows[0];

    // Case 1: Session not found
    if (!session) {
      throw new UnauthorizedException('Session does not exist');
    }

    // Case 2: Session already expired
    if (new Date(session.expires_at) < new Date()) {
      await this.db.query(`UPDATE sessions SET is_revoked = true WHERE id = $1;`, [sessionId]);
      throw new UnauthorizedException('Session has expired');
    }

    // Case 3: REUSE / REPLAY ATTACK DETECTION
    // If the session is already revoked OR the token hash doesn't match the latest token
    if (session.is_revoked || session.current_token_hash !== oldHash) {
      this.logger.warn(
        `[SECURITY_ALERT] Replay attack detected on session ${sessionId}, family ${family}! Revoking entire session family.`,
      );

      // Invalidate the entire family of sessions immediately!
      await this.db.query(
        `UPDATE sessions SET is_revoked = true WHERE refresh_token_family = $1;`,
        [family],
      );

      // Record audit log
      await this.db.query(
        `INSERT INTO audit_log (user_id, action, resource_type, resource_id, ip_address, metadata)
         VALUES ($1, 'TOKEN_REPLAY_ATTACK_DETECTED', 'session', $2, $3, $4);`,
        [
          userId,
          sessionId,
          ipAddress || null,
          JSON.stringify({ family, attemptedTokenHash: oldHash }),
        ],
      );

      throw new HttpException(
        {
          title: 'Compromised Token Detected',
          detail:
            'Token replay detected. All sessions in this token family have been permanently revoked for security.',
          code: 'TOKEN_REPLAY_DETECTED',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Fetch user email for access token
    const userRes = await this.db.query(`SELECT email FROM users WHERE id = $1;`, [userId]);
    const userEmail = userRes.rows[0]?.email || 'user@example.com';

    // Issue new tokens (maintaining same family UUID)
    const newRefreshToken = this.createRefreshToken(userId, sessionId, family);
    const newAccessToken = this.createAccessToken(userId, userEmail, sessionId);
    const newHash = this.encryptionService.hashToken(newRefreshToken);

    // Rotate current token hash in DB
    await this.db.query(
      `UPDATE sessions 
       SET current_token_hash = $1, 
           updated_at = clock_timestamp(),
           ip_address = COALESCE($2, ip_address),
           user_agent = COALESCE($3, user_agent)
       WHERE id = $4;`,
      [newHash, ipAddress || null, userAgent || null, sessionId],
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }

  /**
   * List all active sessions for user
   */
  async listSessions(userId: string, currentSessionId?: string): Promise<SessionResponseDto[]> {
    const res = await this.db.query(
      `SELECT s.id, d.device_name, d.platform, s.ip_address, s.user_agent, s.created_at, s.updated_at
       FROM sessions s
       LEFT JOIN devices d ON s.device_id = d.id
       WHERE s.user_id = $1 AND s.is_revoked = false AND s.expires_at > clock_timestamp()
       ORDER BY s.updated_at DESC;`,
      [userId],
      userId,
    );

    return res.rows.map((row) => ({
      id: row.id,
      deviceName: row.device_name || 'Web Client',
      platform: row.platform || 'web',
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      createdAt: row.created_at.toISOString(),
      lastActiveAt: row.updated_at.toISOString(),
      isCurrent: row.id === currentSessionId,
    }));
  }

  /**
   * Revoke a single session
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.db.query(
      `UPDATE sessions SET is_revoked = true, updated_at = clock_timestamp()
       WHERE id = $1 AND user_id = $2;`,
      [sessionId, userId],
      userId,
    );
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllSessions(userId: string): Promise<void> {
    await this.db.query(
      `UPDATE sessions SET is_revoked = true, updated_at = clock_timestamp()
       WHERE user_id = $1;`,
      [userId],
      userId,
    );
  }

  private createAccessToken(userId: string, email: string, sessionId: string): string {
    const payload: JwtAccessPayload = {
      sub: userId,
      email,
      sessionId,
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  private createRefreshToken(userId: string, sessionId: string, family: string): string {
    const payload: JwtRefreshPayload = {
      sub: userId,
      sessionId,
      family,
      jti: uuidv7(),
    };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }
}
