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
exports.ListEventsQueryDto = exports.CreateCalendarEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCalendarEventDto {
    accountId;
    title;
    description;
    location;
    joinUrl;
    startTime;
    endTime;
    isAllDay;
    attendees;
}
exports.CreateCalendarEventDto = CreateCalendarEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '018f0000-0000-7000-8000-000000000010' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Product Sync & Design Review' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Discuss Q4 roadmap and design iterations' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Conference Room B / Virtual' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://meet.google.com/abc-defg-hij' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "joinUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-10-15T14:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-10-15T15:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCalendarEventDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCalendarEventDto.prototype, "isAllDay", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['alex@example.com', 'taylor@example.com'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCalendarEventDto.prototype, "attendees", void 0);
class ListEventsQueryDto {
    start;
    end;
    accountId;
}
exports.ListEventsQueryDto = ListEventsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-10-01T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListEventsQueryDto.prototype, "start", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-10-31T23:59:59Z' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListEventsQueryDto.prototype, "end", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '018f0000-0000-7000-8000-000000000010' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ListEventsQueryDto.prototype, "accountId", void 0);
//# sourceMappingURL=calendar.dto.js.map