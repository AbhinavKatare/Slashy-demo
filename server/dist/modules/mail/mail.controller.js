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
exports.MailController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mail_service_1 = require("./mail.service");
const outbox_write_service_1 = require("./outbox-write.service");
const mail_dto_1 = require("./dto/mail.dto");
const outbox_write_dto_1 = require("./dto/outbox-write.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const rate_limiter_guard_1 = require("../../common/guards/rate-limiter.guard");
let MailController = class MailController {
    mailService;
    outboxWriteService;
    constructor(mailService, outboxWriteService) {
        this.mailService = mailService;
        this.outboxWriteService = outboxWriteService;
    }
    async listThreads(req, query) {
        return this.mailService.listThreads(req.user.userId, query);
    }
    async getThread(req, id) {
        return this.mailService.getThread(req.user.userId, id);
    }
    async updateThread(req, id, dto) {
        return this.mailService.updateThread(req.user.userId, id, dto);
    }
    async modifyThread(req, id, idempotencyKey, dto) {
        return this.outboxWriteService.executeWrite(req.user.userId, id, idempotencyKey, dto);
    }
    async bulkModifyThreads(req, idempotencyKey, dto) {
        return this.outboxWriteService.executeBulkWrite(req.user.userId, idempotencyKey, dto);
    }
    async getOperationStatus(req, id) {
        return this.outboxWriteService.getOperationStatus(req.user.userId, id);
    }
    async undoOperation(req, id) {
        return this.outboxWriteService.undoOperation(req.user.userId, id);
    }
    async deleteThread(req, id) {
        return this.mailService.deleteThread(req.user.userId, id);
    }
    async sendMessage(req, dto) {
        return this.mailService.sendMessage(req.user.userId, dto);
    }
    async listLabels(req, accountId) {
        return this.mailService.listLabels(req.user.userId, accountId);
    }
    async createLabel(req, dto) {
        return this.mailService.createLabel(req.user.userId, dto);
    }
};
exports.MailController = MailController;
__decorate([
    (0, common_1.Get)('threads'),
    (0, swagger_1.ApiOperation)({ summary: 'List threads with pagination, folder, or account filter' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mail_dto_1.ListThreadsQueryDto]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "listThreads", null);
__decorate([
    (0, common_1.Get)('threads/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get thread details and all constituent messages' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "getThread", null);
__decorate([
    (0, common_1.Patch)('threads/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update thread flags or folder' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, mail_dto_1.UpdateThreadDto]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "updateThread", null);
__decorate([
    (0, common_1.Patch)('threads/:id/modify'),
    (0, swagger_1.ApiHeader)({ name: 'idempotency-key', required: true }),
    (0, swagger_1.ApiOperation)({
        summary: 'Modify thread (read/unread, star, archive, trash, label) requiring Idempotency-Key with provider confirmation',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, outbox_write_dto_1.ModifyThreadActionDto]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "modifyThread", null);
__decorate([
    (0, common_1.Post)('threads/bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiHeader)({ name: 'idempotency-key', required: true }),
    (0, swagger_1.ApiOperation)({
        summary: 'Perform bulk actions across multiple threads requiring Idempotency-Key',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('idempotency-key')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, outbox_write_dto_1.BulkModifyThreadsDto]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "bulkModifyThreads", null);
__decorate([
    (0, common_1.Get)('operations/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Poll status and result of an outbox write operation' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "getOperationStatus", null);
__decorate([
    (0, common_1.Post)('operations/:id/undo'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Undo an operation by executing its inverse action' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "undoOperation", null);
__decorate([
    (0, common_1.Delete)('threads/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Move thread to trash' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "deleteThread", null);
__decorate([
    (0, common_1.Post)('mail/send'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, rate_limiter_guard_1.RateLimit)(30, 60),
    (0, swagger_1.ApiOperation)({ summary: 'Send an email message' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mail_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('labels'),
    (0, swagger_1.ApiOperation)({ summary: 'List mail labels' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "listLabels", null);
__decorate([
    (0, common_1.Post)('labels'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new mail label' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mail_dto_1.CreateLabelDto]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "createLabel", null);
exports.MailController = MailController = __decorate([
    (0, swagger_1.ApiTags)('Mail'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rate_limiter_guard_1.RateLimiterGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [mail_service_1.MailService,
        outbox_write_service_1.OutboxWriteService])
], MailController);
//# sourceMappingURL=mail.controller.js.map