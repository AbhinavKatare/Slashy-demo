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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const rate_limiter_guard_1 = require("../../common/guards/rate-limiter.guard");
const oidc_service_1 = require("../providers/oidc.service");
const env_config_1 = require("../../config/env.config");
let AuthController = class AuthController {
    authService;
    oidcService;
    constructor(authService, oidcService) {
        this.authService = authService;
        this.oidcService = oidcService;
    }
    getGoogleAuthUrl(state) {
        return {
            url: this.oidcService.getAuthorizationUrl('google', state || 'state_nonce'),
        };
    }
    getMicrosoftAuthUrl(state) {
        return {
            url: this.oidcService.getAuthorizationUrl('microsoft', state || 'state_nonce'),
        };
    }
    async login(dto, req, res) {
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');
        const result = await this.authService.loginWithOidc(dto, ip, userAgent);
        res.cookie('access_token', result.accessToken, {
            httpOnly: true,
            secure: env_config_1.env.COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
            domain: env_config_1.env.COOKIE_DOMAIN,
        });
        res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            secure: env_config_1.env.COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            domain: env_config_1.env.COOKIE_DOMAIN,
            path: '/v1/auth',
        });
        return result;
    }
    async refresh(dto, req, res) {
        const token = dto.refreshToken || req.cookies?.['refresh_token'];
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');
        const result = await this.authService.rotateRefreshToken(token, ip, userAgent);
        res.cookie('access_token', result.accessToken, {
            httpOnly: true,
            secure: env_config_1.env.COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
            domain: env_config_1.env.COOKIE_DOMAIN,
        });
        res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            secure: env_config_1.env.COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            domain: env_config_1.env.COOKIE_DOMAIN,
            path: '/v1/auth',
        });
        return result;
    }
    async logout(req, res) {
        if (req.user) {
            await this.authService.revokeSession(req.user.userId, req.user.sessionId);
        }
        res.clearCookie('access_token', { domain: env_config_1.env.COOKIE_DOMAIN });
        res.clearCookie('refresh_token', { domain: env_config_1.env.COOKIE_DOMAIN, path: '/v1/auth' });
        return { success: true, message: 'Logged out successfully' };
    }
    async listSessions(req) {
        return this.authService.listSessions(req.user.userId, req.user.sessionId);
    }
    async revokeSession(sessionId, req) {
        await this.authService.revokeSession(req.user.userId, sessionId);
        return { success: true, message: 'Session revoked successfully' };
    }
    async revokeAll(req, res) {
        await this.authService.revokeAllSessions(req.user.userId);
        res.clearCookie('access_token', { domain: env_config_1.env.COOKIE_DOMAIN });
        res.clearCookie('refresh_token', { domain: env_config_1.env.COOKIE_DOMAIN, path: '/v1/auth' });
        return { success: true, message: 'All sessions revoked successfully' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)('google/url'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Google OIDC authorization URL for Custom Tabs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Authorization URL' }),
    __param(0, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getGoogleAuthUrl", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)('microsoft/url'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Microsoft OIDC authorization URL for Custom Tabs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Authorization URL' }),
    __param(0, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMicrosoftAuthUrl", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('oidc/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, rate_limiter_guard_1.RateLimit)(10, 60),
    (0, swagger_1.ApiOperation)({ summary: 'Login via OIDC identity token (Google / Microsoft)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_dto_1.AuthTokensResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.OidcLoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, rate_limiter_guard_1.RateLimit)(30, 60),
    (0, swagger_1.ApiOperation)({ summary: 'Rotate refresh token and issue new token pair' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rotated token pair' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RefreshTokenDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and revoke current device session' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all active sessions for current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [auth_dto_1.SessionResponseDto] }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Delete)('sessions/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a specific device session' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeSession", null);
__decorate([
    (0, common_1.Post)('revoke-all'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke all sessions for current user across all devices' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeAll", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rate_limiter_guard_1.RateLimiterGuard),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        oidc_service_1.OidcService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map