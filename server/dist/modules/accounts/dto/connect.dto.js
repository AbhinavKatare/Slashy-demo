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
exports.DisconnectAccountDto = exports.ConnectCallbackDto = exports.GetConnectUrlQueryDto = exports.ScopeTier = exports.ConnectProvider = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var ConnectProvider;
(function (ConnectProvider) {
    ConnectProvider["GOOGLE"] = "google";
    ConnectProvider["MICROSOFT"] = "microsoft";
})(ConnectProvider || (exports.ConnectProvider = ConnectProvider = {}));
var ScopeTier;
(function (ScopeTier) {
    ScopeTier["READONLY"] = "readonly";
    ScopeTier["MODIFY_SEND"] = "modify_send";
})(ScopeTier || (exports.ScopeTier = ScopeTier = {}));
class GetConnectUrlQueryDto {
    provider;
    tier;
    redirectUri;
}
exports.GetConnectUrlQueryDto = GetConnectUrlQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ConnectProvider, example: 'google' }),
    (0, class_validator_1.IsEnum)(ConnectProvider),
    __metadata("design:type", String)
], GetConnectUrlQueryDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ScopeTier, default: ScopeTier.READONLY }),
    (0, class_validator_1.IsEnum)(ScopeTier),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetConnectUrlQueryDto.prototype, "tier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'inboxcompanion://oauth/callback' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GetConnectUrlQueryDto.prototype, "redirectUri", void 0);
class ConnectCallbackDto {
    provider;
    code;
    codeVerifier;
    state;
    redirectUri;
}
exports.ConnectCallbackDto = ConnectCallbackDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ConnectProvider, example: 'google' }),
    (0, class_validator_1.IsEnum)(ConnectProvider),
    __metadata("design:type", String)
], ConnectCallbackDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Authorization code returned by provider' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectCallbackDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'PKCE code_verifier generated before launching auth flow' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectCallbackDto.prototype, "codeVerifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'State parameter for CSRF validation' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectCallbackDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'inboxcompanion://oauth/callback' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectCallbackDto.prototype, "redirectUri", void 0);
class DisconnectAccountDto {
    purgeData;
}
exports.DisconnectAccountDto = DisconnectAccountDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: true,
        description: 'Purge all cached emails, threads and drafts',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], DisconnectAccountDto.prototype, "purgeData", void 0);
//# sourceMappingURL=connect.dto.js.map