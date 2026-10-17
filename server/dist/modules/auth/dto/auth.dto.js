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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionResponseDto = exports.AuthTokensResponseDto = exports.RefreshTokenDto = exports.OidcLoginDto = exports.AuthProvider = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var AuthProvider;
(function (AuthProvider) {
    AuthProvider["GOOGLE"] = "google";
    AuthProvider["MICROSOFT"] = "microsoft";
})(AuthProvider || (exports.AuthProvider = AuthProvider = {}));
class OidcLoginDto {
    provider;
    idToken;
    deviceName;
    platform;
    appVersion;
    pushToken;
}
exports.OidcLoginDto = OidcLoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: AuthProvider, example: 'google' }),
    (0, class_validator_1.IsEnum)(AuthProvider),
    __metadata("design:type", String)
], OidcLoginDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'OIDC Identity Token issued by provider',
        example: 'eyJhbGciOiJSUzI1NiIs...',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OidcLoginDto.prototype, "idToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Alex's Pixel 9 Pro" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OidcLoginDto.prototype, "deviceName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'android' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OidcLoginDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1.0.0' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OidcLoginDto.prototype, "appVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'fcm_push_token_xyz' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OidcLoginDto.prototype, "pushToken", void 0);
class RefreshTokenDto {
    refreshToken;
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Active rotating refresh token', example: 'eyJhbGciOiJIUzI1Ni...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
class AuthTokensResponseDto {
    accessToken;
    refreshToken;
    expiresIn;
    user;
}
exports.AuthTokensResponseDto = AuthTokensResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'eyJhbGciOiJIUzI1Ni...' }),
    __metadata("design:type", String)
], AuthTokensResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'eyJhbGciOiJIUzI1Ni...' }),
    __metadata("design:type", String)
], AuthTokensResponseDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 900, description: 'Access token expiration in seconds (15 minutes)' }),
    __metadata("design:type", Number)
], AuthTokensResponseDto.prototype, "expiresIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: {
            id: '018f0000-0000-7000-8000-000000000001',
            email: 'alex.morgan@example.com',
            displayName: 'Alex Morgan',
        },
    }),
    __metadata("design:type", Object)
], AuthTokensResponseDto.prototype, "user", void 0);
class SessionResponseDto {
    id;
    deviceName;
    platform;
    ipAddress;
    userAgent;
    createdAt;
    lastActiveAt;
    isCurrent;
}
exports.SessionResponseDto = SessionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '018f0000-0000-7000-8000-000000000030' }),
    __metadata("design:type", String)
], SessionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: "Alex's Pixel 9 Pro" }),
    __metadata("design:type", String)
], SessionResponseDto.prototype, "deviceName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'android' }),
    __metadata("design:type", String)
], SessionResponseDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '192.168.1.100' }),
    __metadata("design:type", String)
], SessionResponseDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'InboxCompanion/1.0.0 (Android 14)' }),
    __metadata("design:type", String)
], SessionResponseDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-10-13T12:00:00Z' }),
    __metadata("design:type", String)
], SessionResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-10-13T12:30:00Z' }),
    __metadata("design:type", String)
], SessionResponseDto.prototype, "lastActiveAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], SessionResponseDto.prototype, "isCurrent", void 0);
//# sourceMappingURL=auth.dto.js.map