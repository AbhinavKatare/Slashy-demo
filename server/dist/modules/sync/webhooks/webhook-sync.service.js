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
var WebhookSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookSyncService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../database/database.service");
const sync_queue_service_1 = require("../queues/sync-queue.service");
const redis_service_1 = require("../../../common/redis/redis.service");
const env_config_1 = require("../../../config/env.config");
const crypto = require("crypto");
let WebhookSyncService = WebhookSyncService_1 = class WebhookSyncService {
    db;
    queueService;
    redis;
    logger = new common_1.Logger(WebhookSyncService_1.name);
    constructor(db, queueService, redis) {
        this.db = db;
        this.queueService = queueService;
        this.redis = redis;
    }
    async handleGoogleWebhook(body) {
        if (!body || !body.message || !body.message.data) {
            return { status: 'ignored_invalid_payload' };
        }
        const decodedStr = Buffer.from(body.message.data, 'base64').toString('utf8');
        let data;
        try {
            data = JSON.parse(decodedStr);
        }
        catch (_) {
            return { status: 'ignored_malformed_json' };
        }
        const { emailAddress, historyId } = data;
        if (!emailAddress || !historyId) {
            return { status: 'ignored_missing_attributes' };
        }
        const dedupeKey = `webhook:google:${emailAddress}:${historyId}`;
        const alreadyProcessed = await this.redis.get(dedupeKey);
        if (alreadyProcessed) {
            this.logger.debug(`Duplicate Google webhook dropped for ${emailAddress} (historyId ${historyId})`);
            return { status: 'deduplicated' };
        }
        await this.redis.set(dedupeKey, '1', 300);
        const accRes = await this.db.query(`SELECT id, user_id FROM connected_accounts WHERE email = $1 AND provider = 'google' AND status = 'active';`, [emailAddress]);
        if (!accRes.rows[0]) {
            this.logger.warn(`Received Google webhook for unmanaged or inactive account: ${emailAddress}`);
            return { status: 'account_not_found' };
        }
        const account = accRes.rows[0];
        await this.queueService.enqueueIncremental({
            accountId: account.id,
            userId: account.user_id,
            provider: 'google',
            jobType: 'incremental',
            cursor: String(historyId),
        });
        return { status: 'queued' };
    }
    async handleMicrosoftWebhook(body, validationToken) {
        if (validationToken) {
            return {
                status: 'handshake_verified',
                validationResponse: validationToken,
            };
        }
        const notifications = body?.value;
        if (!Array.isArray(notifications) || notifications.length === 0) {
            return { status: 'ignored_empty_value' };
        }
        for (const notif of notifications) {
            const expectedClientState = crypto
                .createHmac('sha256', env_config_1.env.JWT_ACCESS_SECRET)
                .update(notif.subscriptionId || 'graph-sub')
                .digest('hex');
            if (notif.clientState && notif.clientState !== expectedClientState) {
                this.logger.warn('Microsoft webhook rejected: clientState signature mismatch');
                continue;
            }
            const notifId = notif.resourceData?.id || notif.subscriptionId || Date.now().toString();
            const dedupeKey = `webhook:ms:${notifId}`;
            const alreadyProcessed = await this.redis.get(dedupeKey);
            if (alreadyProcessed) {
                continue;
            }
            await this.redis.set(dedupeKey, '1', 300);
            const accRes = await this.db.query(`SELECT id, user_id FROM connected_accounts WHERE provider = 'microsoft' AND status = 'active' LIMIT 1;`);
            if (accRes.rows[0]) {
                const account = accRes.rows[0];
                await this.queueService.enqueueIncremental({
                    accountId: account.id,
                    userId: account.user_id,
                    provider: 'microsoft',
                    jobType: 'incremental',
                });
            }
        }
        return { status: 'processed' };
    }
    async runFallbackPoller() {
        const staleAccounts = await this.db.query(`SELECT a.id, a.user_id, a.provider, c.cursor_value
       FROM connected_accounts a
       LEFT JOIN sync_cursors c ON a.id = c.account_id AND c.sync_key = 'delta'
       WHERE a.status = 'active'
         AND (c.last_synced_at IS NULL OR c.last_synced_at < clock_timestamp() - INTERVAL '30 minutes')
       LIMIT 50;`);
        for (const row of staleAccounts.rows) {
            await this.queueService.enqueueIncremental({
                accountId: row.id,
                userId: row.user_id,
                provider: row.provider,
                jobType: 'incremental',
                cursor: row.cursor_value,
            });
        }
        return { queuedAccounts: staleAccounts.rows.length };
    }
};
exports.WebhookSyncService = WebhookSyncService;
exports.WebhookSyncService = WebhookSyncService = WebhookSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        sync_queue_service_1.SyncQueueService,
        redis_service_1.RedisService])
], WebhookSyncService);
//# sourceMappingURL=webhook-sync.service.js.map