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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const drafts_service_1 = require("./drafts.service");
const sending_service_1 = require("./sending.service");
const drafts_dto_1 = require("./dto/drafts.dto");
const send_dto_1 = require("./dto/send.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let DraftsController = class DraftsController {
    draftsService;
    sendingService;
    constructor(draftsService, sendingService) {
        this.draftsService = draftsService;
        this.sendingService = sendingService;
    }
    async listDrafts(req, accountId) {
        return this.draftsService.listDrafts(req.user.userId, accountId);
    }
    async getDraft(req, id) {
        return this.draftsService.getDraft(req.user.userId, id);
    }
    async createDraft(req, dto) {
        return this.draftsService.createDraft(req.user.userId, dto);
    }
    async updateDraft(req, id, dto) {
        return this.draftsService.updateDraft(req.user.userId, id, dto);
    }
    async deleteDraft(req, id) {
        return this.draftsService.deleteDraft(req.user.userId, id);
    }
    async sendDraft(req, id, dto, idempotencyKey) {
        dto.draftId = id;
        return this.sendingService.sendDraft(req.user.userId, dto, idempotencyKey);
    }
    async cancelSend(req, sendId) {
        return this.sendingService.cancelSend(req.user.userId, sendId);
    }
    async uploadAttachment(req, dto) {
        return this.sendingService.uploadAttachment(req.user.userId, dto);
    }
};
exports.DraftsController = DraftsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all message drafts' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "listDrafts", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get draft by ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "getDraft", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new draft' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, drafts_dto_1.CreateDraftDto]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "createDraft", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing draft' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, drafts_dto_1.UpdateDraftDto]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "updateDraft", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a draft' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "deleteDraft", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({
        summary: 'Explicitly send a draft with user review hash, undo window, and scheduled send support',
    }),
    (0, swagger_1.ApiHeader)({
        name: 'Idempotency-Key',
        required: false,
        description: 'Unique client key to prevent double submissions',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, send_dto_1.SendDraftDto, String]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "sendDraft", null);
__decorate([
    (0, common_1.Post)('send/:sendId/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancel a pending send during the undo window or before scheduled time',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sendId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "cancelSend", null);
__decorate([
    (0, common_1.Post)('attachments/upload'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload draft attachment with size, type limits and malware scanning' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_dto_1.UploadAttachmentDto]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "uploadAttachment", null);
exports.DraftsController = DraftsController = __decorate([
    (0, swagger_1.ApiTags)('Drafts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('drafts'),
    __metadata("design:paramtypes", [drafts_service_1.DraftsService,
        sending_service_1.SendingService])
], DraftsController);
//# sourceMappingURL=drafts.controller.js.map