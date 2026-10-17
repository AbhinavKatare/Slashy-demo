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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
const uuid_1 = require("uuid");
const env_config_1 = require("../../config/env.config");
const database_service_1 = require("../../database/database.service");
const encryption_service_1 = require("../../common/crypto/encryption.service");
const oidc_service_1 = require("../providers/oidc.service");
let AuthService = AuthService_1 = class AuthService {
    db;
    encryptionService;
    oidcService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(db, encryptionService, oidcService) {
        this.db = db;
        this.encryptionService = encryptionService;
        this.oidcService = oidcService;
    }
    async loginWithOidc(dto, ipAddress, userAgent) {
        const oidcUser = await this.oidcService.verifyIdToken(dto.provider, dto.idToken);
        const userRes = await this.db.query(`INSERT INTO users (email, display_name, avatar_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE 
         SET display_name = EXCLUDED.display_name,
             avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
             updated_at = clock_timestamp()
       RETURNING id, email, display_name, avatar_url;`, [oidcUser.email, oidcUser.displayName, oidcUser.avatarUrl || null]);
        const user = userRes.rows[0];
        let deviceId = null;
        if (dto.deviceName || dto.platform) {
            const devRes = await this.db.query(`INSERT INTO devices (user_id, device_name, platform, app_version, push_token)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id;`, [
                user.id,
                dto.deviceName || 'Unknown Device',
                dto.platform || 'unknown',
                dto.appVersion || '1.0.0',
                dto.pushToken || null,
            ]);
            deviceId = devRes.rows[0]?.id || null;
        }
        await this.db.query(`INSERT INTO connected_accounts (user_id, provider, external_id, email, display_name, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       ON CONFLICT (user_id, provider, external_id) DO UPDATE
         SET status = 'active', updated_at = clock_timestamp();`, [user.id, oidcUser.provider, oidcUser.externalId, oidcUser.email, oidcUser.displayName]);
        const sessionId = (0, uuid_1.v7)();
        const family = (0, uuid_1.v7)();
        const refreshToken = this.createRefreshToken(user.id, sessionId, family);
        const accessToken = this.createAccessToken(user.id, user.email, sessionId);
        const tokenHash = this.encryptionService.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.db.query(`INSERT INTO sessions (id, user_id, device_id, refresh_token_family, current_token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`, [
            sessionId,
            user.id,
            deviceId,
            family,
            tokenHash,
            expiresAt,
            ipAddress || null,
            userAgent || null,
        ]);
        this.logger.log(`User ${user.email} authenticated via ${oidcUser.provider}. Session ${sessionId} created.`);
        return {
            accessToken,
            refreshToken,
            expiresIn: 900,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                avatarUrl: user.avatar_url,
            },
        };
    }
    async rotateRefreshToken(oldRefreshToken, ipAddress, userAgent) {
        let payload;
        try {
            payload = jwt.verify(oldRefreshToken, env_config_1.env.JWT_REFRESH_SECRET);
        }
        catch (err) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const { sub: userId, sessionId, family } = payload;
        const oldHash = this.encryptionService.hashToken(oldRefreshToken);
        const res = await this.db.query(`SELECT id, user_id, refresh_token_family, current_token_hash, is_revoked, expires_at
       FROM sessions
       WHERE id = $1;`, [sessionId]);
        const session = res.rows[0];
        if (!session) {
            throw new common_1.UnauthorizedException('Session does not exist');
        }
        if (new Date(session.expires_at) < new Date()) {
            await this.db.query(`UPDATE sessions SET is_revoked = true WHERE id = $1;`, [sessionId]);
            throw new common_1.UnauthorizedException('Session has expired');
        }
        if (session.is_revoked || session.current_token_hash !== oldHash) {
            this.logger.warn(`[SECURITY_ALERT] Replay attack detected on session ${sessionId}, family ${family}! Revoking entire session family.`);
            await this.db.query(`UPDATE sessions SET is_revoked = true WHERE refresh_token_family = $1;`, [family]);
            await this.db.query(`INSERT INTO audit_log (user_id, action, resource_type, resource_id, ip_address, metadata)
         VALUES ($1, 'TOKEN_REPLAY_ATTACK_DETECTED', 'session', $2, $3, $4);`, [
                userId,
                sessionId,
                ipAddress || null,
                JSON.stringify({ family, attemptedTokenHash: oldHash }),
            ]);
            throw new common_1.HttpException({
                title: 'Compromised Token Detected',
                detail: 'Token replay detected. All sessions in this token family have been permanently revoked for security.',
                code: 'TOKEN_REPLAY_DETECTED',
            }, common_1.HttpStatus.UNAUTHORIZED);
        }
        const userRes = await this.db.query(`SELECT email FROM users WHERE id = $1;`, [userId]);
        const userEmail = userRes.rows[0]?.email || 'user@example.com';
        const newRefreshToken = this.createRefreshToken(userId, sessionId, family);
        const newAccessToken = this.createAccessToken(userId, userEmail, sessionId);
        const newHash = this.encryptionService.hashToken(newRefreshToken);
        await this.db.query(`UPDATE sessions 
       SET current_token_hash = $1, 
           updated_at = clock_timestamp(),
           ip_address = COALESCE($2, ip_address),
           user_agent = COALESCE($3, user_agent)
       WHERE id = $4;`, [newHash, ipAddress || null, userAgent || null, sessionId]);
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900,
        };
    }
    async listSessions(userId, currentSessionId) {
        const res = await this.db.query(`SELECT s.id, d.device_name, d.platform, s.ip_address, s.user_agent, s.created_at, s.updated_at
       FROM sessions s
       LEFT JOIN devices d ON s.device_id = d.id
       WHERE s.user_id = $1 AND s.is_revoked = false AND s.expires_at > clock_timestamp()
       ORDER BY s.updated_at DESC;`, [userId], userId);
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
    async revokeSession(userId, sessionId) {
        await this.db.query(`UPDATE sessions SET is_revoked = true, updated_at = clock_timestamp()
       WHERE id = $1 AND user_id = $2;`, [sessionId, userId], userId);
    }
    async revokeAllSessions(userId) {
        await this.db.query(`UPDATE sessions SET is_revoked = true, updated_at = clock_timestamp()
       WHERE user_id = $1;`, [userId], userId);
    }
    createAccessToken(userId, email, sessionId) {
        const payload = {
            sub: userId,
            email,
            sessionId,
        };
        return jwt.sign(payload, env_config_1.env.JWT_ACCESS_SECRET, {
            expiresIn: env_config_1.env.JWT_ACCESS_EXPIRES_IN,
        });
    }
    createRefreshToken(userId, sessionId, family) {
        const payload = {
            sub: userId,
            sessionId,
            family,
            jti: (0, uuid_1.v7)(),
        };
        return jwt.sign(payload, env_config_1.env.JWT_REFRESH_SECRET, {
            expiresIn: env_config_1.env.JWT_REFRESH_EXPIRES_IN,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        encryption_service_1.EncryptionService,
        oidc_service_1.OidcService])
], AuthService);
//# sourceMappingURL=auth.service.js.map