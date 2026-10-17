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
exports.BulkModifyThreadsDto = exports.ModifyThreadActionDto = exports.WriteActionType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var WriteActionType;
(function (WriteActionType) {
    WriteActionType["MARK_READ"] = "mark_read";
    WriteActionType["MARK_UNREAD"] = "mark_unread";
    WriteActionType["STAR"] = "star";
    WriteActionType["UNSTAR"] = "unstar";
    WriteActionType["ARCHIVE"] = "archive";
    WriteActionType["TRASH"] = "trash";
    WriteActionType["APPLY_LABEL"] = "apply_label";
    WriteActionType["REMOVE_LABEL"] = "remove_label";
})(WriteActionType || (exports.WriteActionType = WriteActionType = {}));
class ModifyThreadActionDto {
    action;
    labelName;
    eTag;
}
exports.ModifyThreadActionDto = ModifyThreadActionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: WriteActionType, example: WriteActionType.MARK_READ }),
    (0, class_validator_1.IsEnum)(WriteActionType),
    __metadata("design:type", String)
], ModifyThreadActionDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Finance' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyThreadActionDto.prototype, "labelName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optimistic concurrency ETag or updated_at version token' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyThreadActionDto.prototype, "eTag", void 0);
class BulkModifyThreadsDto {
    threadIds;
    action;
    labelName;
}
exports.BulkModifyThreadsDto = BulkModifyThreadsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['thread-1', 'thread-2'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], BulkModifyThreadsDto.prototype, "threadIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: WriteActionType, example: WriteActionType.ARCHIVE }),
    (0, class_validator_1.IsEnum)(WriteActionType),
    __metadata("design:type", String)
], BulkModifyThreadsDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Receipts' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkModifyThreadsDto.prototype, "labelName", void 0);
//# sourceMappingURL=outbox-write.dto.js.map