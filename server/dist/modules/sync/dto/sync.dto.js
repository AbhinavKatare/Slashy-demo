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
exports.PullDeltaQueryDto = exports.PushOutboxBatchDto = exports.OutboxItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class OutboxItemDto {
    idempotencyKey;
    accountId;
    actionType;
    targetId;
    payload;
}
exports.OutboxItemDto = OutboxItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'op-018f0000-0000-7000' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OutboxItemDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '018f0000-0000-7000-8000-000000000010' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OutboxItemDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'mark_read',
        enum: ['mark_read', 'mark_unread', 'star', 'unstar', 'archive', 'trash'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OutboxItemDto.prototype, "actionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '018f0000-0000-7000-8000-000000000020' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OutboxItemDto.prototype, "targetId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: {} }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], OutboxItemDto.prototype, "payload", void 0);
class PushOutboxBatchDto {
    operations;
}
exports.PushOutboxBatchDto = PushOutboxBatchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [OutboxItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => OutboxItemDto),
    __metadata("design:type", Array)
], PushOutboxBatchDto.prototype, "operations", void 0);
class PullDeltaQueryDto {
    accountId;
    cursor;
}
exports.PullDeltaQueryDto = PullDeltaQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '018f0000-0000-7000-8000-000000000010' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PullDeltaQueryDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-10-13T12:00:00.000Z' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PullDeltaQueryDto.prototype, "cursor", void 0);
//# sourceMappingURL=sync.dto.js.map