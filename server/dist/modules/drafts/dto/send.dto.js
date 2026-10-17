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
exports.UploadAttachmentDto = exports.CancelSendDto = exports.SendDraftDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SendDraftDto {
    draftId;
    payloadHash;
    undoWindowSeconds;
    scheduledAt;
    timezone;
    followUpIfNoReplyDays;
    reminderAt;
}
exports.SendDraftDto = SendDraftDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the draft to send' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendDraftDto.prototype, "draftId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SHA-256 hex hash of the final reviewed payload to ensure user reviewed exact content',
        example: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^[a-f0-9]{64}$/i, {
        message: 'payloadHash must be a valid 64-character SHA-256 hex string',
    }),
    __metadata("design:type", String)
], SendDraftDto.prototype, "payloadHash", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Undo window duration in seconds (0 to 30s). Defaults to 10s',
        default: 10,
        minimum: 0,
        maximum: 30,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], SendDraftDto.prototype, "undoWindowSeconds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Scheduled send timestamp (ISO-8601 UTC)',
        example: '2026-10-15T09:00:00.000Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], SendDraftDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Client timezone identifier for scheduled send (e.g. "America/New_York", "UTC")',
        default: 'UTC',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendDraftDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Automatically trigger a reminder if no reply is received within N days',
        example: 3,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], SendDraftDto.prototype, "followUpIfNoReplyDays", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Explicit reminder timestamp for this thread (ISO-8601)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], SendDraftDto.prototype, "reminderAt", void 0);
class CancelSendDto {
    sendId;
}
exports.CancelSendDto = CancelSendDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The operation or send ID to cancel' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CancelSendDto.prototype, "sendId", void 0);
class UploadAttachmentDto {
    filename;
    contentType;
    base64Data;
}
exports.UploadAttachmentDto = UploadAttachmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'financial_report.pdf' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadAttachmentDto.prototype, "filename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'application/pdf' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadAttachmentDto.prototype, "contentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Base64 encoded binary file content' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadAttachmentDto.prototype, "base64Data", void 0);
//# sourceMappingURL=send.dto.js.map