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
exports.TranscribeAssistDto = exports.AdjustToneDto = exports.GenerateReplyDto = exports.SummarizeThreadDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SummarizeThreadDto {
    threadId;
    redactPii;
}
exports.SummarizeThreadDto = SummarizeThreadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '018f0000-0000-7000-8000-000000000020' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SummarizeThreadDto.prototype, "threadId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Mask email addresses and phone numbers before AI processing',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SummarizeThreadDto.prototype, "redactPii", void 0);
class GenerateReplyDto {
    threadId;
    tone;
    userPrompt;
    redactPii;
}
exports.GenerateReplyDto = GenerateReplyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '018f0000-0000-7000-8000-000000000020' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateReplyDto.prototype, "threadId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'professional',
        enum: ['professional', 'friendly', 'concise', 'casual'],
        default: 'professional',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['professional', 'friendly', 'concise', 'casual']),
    __metadata("design:type", String)
], GenerateReplyDto.prototype, "tone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Confirm availability for Friday at 2 PM' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], GenerateReplyDto.prototype, "userPrompt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Mask email addresses and phone numbers before AI processing',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], GenerateReplyDto.prototype, "redactPii", void 0);
class AdjustToneDto {
    text;
    targetTone;
}
exports.AdjustToneDto = AdjustToneDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Please send me the report ASAP.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], AdjustToneDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'friendly',
        enum: ['professional', 'friendly', 'concise', 'casual'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['professional', 'friendly', 'concise', 'casual']),
    __metadata("design:type", String)
], AdjustToneDto.prototype, "targetTone", void 0);
class TranscribeAssistDto {
    rawDictation;
    tone;
}
exports.TranscribeAssistDto = TranscribeAssistDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Raw transcribed voice dictation text to convert into an email draft',
        example: 'hey Alex let us meet next Tuesday around two pm to go over the budget and slides thanks',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], TranscribeAssistDto.prototype, "rawDictation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'professional',
        enum: ['professional', 'friendly', 'concise', 'casual'],
        default: 'professional',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['professional', 'friendly', 'concise', 'casual']),
    __metadata("design:type", String)
], TranscribeAssistDto.prototype, "tone", void 0);
//# sourceMappingURL=ai.dto.js.map