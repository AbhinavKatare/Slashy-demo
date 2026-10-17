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
exports.UnregisterNotificationTokenDto = exports.RegisterNotificationTokenDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterNotificationTokenDto {
    token;
    platform;
    deviceId;
}
exports.RegisterNotificationTokenDto = RegisterNotificationTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'fcm_token_xyz123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterNotificationTokenDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'android', enum: ['android', 'ios', 'web'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['android', 'ios', 'web']),
    __metadata("design:type", String)
], RegisterNotificationTokenDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '018f0000-0000-7000-8000-000000000030' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterNotificationTokenDto.prototype, "deviceId", void 0);
class UnregisterNotificationTokenDto {
    token;
}
exports.UnregisterNotificationTokenDto = UnregisterNotificationTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'fcm_token_xyz123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UnregisterNotificationTokenDto.prototype, "token", void 0);
//# sourceMappingURL=notifications.dto.js.map