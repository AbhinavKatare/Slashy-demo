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
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sync_service_1 = require("./sync.service");
const sync_dto_1 = require("./dto/sync.dto");
const webhook_sync_service_1 = require("./webhooks/webhook-sync.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const database_service_1 = require("../../database/database.service");
let SyncController = class SyncController {
    syncService;
    webhookService;
    db;
    constructor(syncService, webhookService, db) {
        this.syncService = syncService;
        this.webhookService = webhookService;
        this.db = db;
    }
    async pull(req, query) {
        return this.syncService.pullDeltas(req.user.userId, query);
    }
    async push(req, dto) {
        return this.syncService.processOutboxBatch(req.user.userId, dto.operations);
    }
    async getSyncStatus(req, accountId) {
        const res = await this.db.query(`SELECT c.sync_key, c.cursor_value, c.status, c.last_synced_at,
              (SELECT COUNT(*) FROM threads WHERE account_id = $1 AND deleted_at IS NULL) AS thread_count,
              (SELECT COUNT(*) FROM messages WHERE account_id = $1) AS message_count
       FROM sync_cursors c
       WHERE c.account_id = $1 AND c.user_id = $2;`, [accountId, req.user.userId], req.user.userId);
        const cursors = res.rows;
        const threadCount = Number(cursors[0]?.thread_count || 0);
        const messageCount = Number(cursors[0]?.message_count || 0);
        return {
            accountId,
            status: cursors.some((c) => c.status === 'backfilling') ? 'backfilling' : 'idle',
            lastSyncedAt: cursors[0]?.last_synced_at || new Date().toISOString(),
            cursors: cursors.map((c) => ({
                key: c.sync_key,
                value: c.cursor_value,
                status: c.status,
            })),
            stats: {
                threads: threadCount,
                messages: messageCount,
            },
        };
    }
    async handleGoogleWebhook(body) {
        return this.webhookService.handleGoogleWebhook(body);
    }
    handleMicrosoftHandshake(validationToken, res) {
        res.setHeader('Content-Type', 'text/plain');
        res.status(common_1.HttpStatus.OK).send(validationToken || 'ok');
    }
    async handleMicrosoftWebhook(body, validationToken) {
        return this.webhookService.handleMicrosoftWebhook(body, validationToken);
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('pull'),
    (0, swagger_1.ApiOperation)({ summary: 'Pull delta changes since last sync cursor (Cursor-based pagination)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, sync_dto_1.PullDeltaQueryDto]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "pull", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('push'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Replay batched outbox write operations idempotently' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, sync_dto_1.PushOutboxBatchDto]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "push", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('status/:accountId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current sync status, cursor state, and counts for an account' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getSyncStatus", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('webhooks/google'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Google Cloud Pub/Sub Push Notification receiver for Gmail watch' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "handleGoogleWebhook", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)('webhooks/microsoft'),
    (0, swagger_1.ApiOperation)({ summary: 'Microsoft Graph webhook handshake validation token echo' }),
    __param(0, (0, common_1.Query)('validationToken')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "handleMicrosoftHandshake", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('webhooks/microsoft'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Microsoft Graph Change Notification receiver' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('validationToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "handleMicrosoftWebhook", null);
exports.SyncController = SyncController = __decorate([
    (0, swagger_1.ApiTags)('Sync'),
    (0, common_1.Controller)('sync'),
    __metadata("design:paramtypes", [sync_service_1.SyncService,
        webhook_sync_service_1.WebhookSyncService,
        database_service_1.DatabaseService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map