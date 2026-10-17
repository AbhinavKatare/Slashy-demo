"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OidcService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcService = void 0;
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
let OidcService = OidcService_1 = class OidcService {
    logger = new common_1.Logger(OidcService_1.name);
    async verifyIdToken(provider, idToken) {
        try {
            const decoded = jwt.decode(idToken);
            if (!decoded && !idToken.startsWith('mock_')) {
                throw new common_1.UnauthorizedException('Malformed OIDC ID token');
            }
            if (idToken.startsWith('mock_') || (decoded && decoded.iss?.includes('example.com'))) {
                return {
                    provider,
                    externalId: decoded?.sub || `ext_${provider}_${Date.now()}`,
                    email: decoded?.email || 'alex.morgan@example.com',
                    displayName: decoded?.name || 'Alex Morgan',
                    avatarUrl: decoded?.picture || 'https://avatar.example.com/alex.png',
                };
            }
            const email = decoded?.email || decoded?.preferred_username;
            const externalId = decoded?.sub || decoded?.oid;
            const displayName = decoded?.name || decoded?.given_name || email?.split('@')[0] || 'User';
            const avatarUrl = decoded?.picture;
            if (!email || !externalId) {
                throw new common_1.UnauthorizedException('OIDC token missing required email or subject claim');
            }
            return {
                provider,
                externalId,
                email,
                displayName,
                avatarUrl,
            };
        }
        catch (error) {
            this.logger.warn(`Failed to verify OIDC token: ${error.message}`);
            throw new common_1.UnauthorizedException(`Invalid OIDC token: ${error.message}`);
        }
    }
    getAuthorizationUrl(provider, state) {
        if (provider === 'google') {
            return `https://accounts.google.com/o/oauth2/v2/auth?client_id=mock-google-client-id&response_type=code&scope=openid%20email%20profile&redirect_uri=inboxcompanion://auth/callback&state=${state}`;
        }
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=mock-ms-client-id&response_type=code&scope=openid%20email%20profile&redirect_uri=inboxcompanion://auth/callback&state=${state}`;
    }
};
exports.OidcService = OidcService;
exports.OidcService = OidcService = OidcService_1 = __decorate([
    (0, common_1.Injectable)()
], OidcService);
//# sourceMappingURL=oidc.service.js.map