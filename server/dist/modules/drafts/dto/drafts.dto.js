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
exports.UpdateDraftDto = exports.CreateDraftDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const mail_dto_1 = require("../../mail/dto/mail.dto");
class CreateDraftDto {
    accountId;
    replyThreadId;
    replyMessageId;
    toRecipients;
    ccRecipients;
    bccRecipients;
    subject;
    bodyPlain;
    bodyHtml;
    attachmentsMeta;
}
exports.CreateDraftDto = CreateDraftDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '018f0000-0000-7000-8000-000000000010' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDraftDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDraftDto.prototype, "replyThreadId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDraftDto.prototype, "replyMessageId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [mail_dto_1.RecipientDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => mail_dto_1.RecipientDto),
    __metadata("design:type", Array)
], CreateDraftDto.prototype, "toRecipients", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [mail_dto_1.RecipientDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => mail_dto_1.RecipientDto),
    __metadata("design:type", Array)
], CreateDraftDto.prototype, "ccRecipients", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [mail_dto_1.RecipientDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => mail_dto_1.RecipientDto),
    __metadata("design:type", Array)
], CreateDraftDto.prototype, "bccRecipients", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Quarterly Planning' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDraftDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Here are the draft notes...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDraftDto.prototype, "bodyPlain", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '<p>Here are the draft notes...</p>' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDraftDto.prototype, "bodyHtml", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: [] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateDraftDto.prototype, "attachmentsMeta", void 0);
class UpdateDraftDto extends CreateDraftDto {
}
exports.UpdateDraftDto = UpdateDraftDto;
//# sourceMappingURL=drafts.dto.js.map