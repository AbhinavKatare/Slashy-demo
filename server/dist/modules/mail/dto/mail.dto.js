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
exports.CreateLabelDto = exports.SendMessageDto = exports.UpdateThreadDto = exports.ListThreadsQueryDto = exports.RecipientDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class RecipientDto {
    name;
    email;
}
exports.RecipientDto = RecipientDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Alex Morgan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RecipientDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'alex@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RecipientDto.prototype, "email", void 0);
class ListThreadsQueryDto {
    folder;
    accountId;
    labelId;
    isUnread;
    cursor;
    limit;
}
exports.ListThreadsQueryDto = ListThreadsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'inbox' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListThreadsQueryDto.prototype, "folder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '018f0000-0000-7000-8000-000000000010' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListThreadsQueryDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListThreadsQueryDto.prototype, "labelId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], ListThreadsQueryDto.prototype, "isUnread", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListThreadsQueryDto.prototype, "cursor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListThreadsQueryDto.prototype, "limit", void 0);
class UpdateThreadDto {
    isStarred;
    isUnread;
    folder;
}
exports.UpdateThreadDto = UpdateThreadDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateThreadDto.prototype, "isStarred", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateThreadDto.prototype, "isUnread", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'archive' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateThreadDto.prototype, "folder", void 0);
class SendMessageDto {
    accountId;
    to;
    cc;
    bcc;
    subject;
    bodyPlain;
    bodyHtml;
    replyToThreadId;
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '018f0000-0000-7000-8000-000000000010' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [RecipientDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RecipientDto),
    __metadata("design:type", Array)
], SendMessageDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [RecipientDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RecipientDto),
    __metadata("design:type", Array)
], SendMessageDto.prototype, "cc", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [RecipientDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RecipientDto),
    __metadata("design:type", Array)
], SendMessageDto.prototype, "bcc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Project Update' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Hello team, here is the latest update.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "bodyPlain", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '<p>Hello team, here is the latest update.</p>' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "bodyHtml", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "replyToThreadId", void 0);
class CreateLabelDto {
    accountId;
    name;
    colorHex;
}
exports.CreateLabelDto = CreateLabelDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '018f0000-0000-7000-8000-000000000010' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLabelDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Finance' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLabelDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '#10B981' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLabelDto.prototype, "colorHex", void 0);
//# sourceMappingURL=mail.dto.js.map