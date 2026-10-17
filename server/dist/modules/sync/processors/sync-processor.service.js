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
var SyncProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncProcessorService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../database/database.service");
const mail_provider_factory_1 = require("../../mail/adapters/mail-provider.factory");
const sync_queue_service_1 = require("../queues/sync-queue.service");
const uuid_1 = require("uuid");
let SyncProcessorService = SyncProcessorService_1 = class SyncProcessorService {
    db;
    providerFactory;
    queueService;
    logger = new common_1.Logger(SyncProcessorService_1.name);
    constructor(db, providerFactory, queueService) {
        this.db = db;
        this.providerFactory = providerFactory;
        this.queueService = queueService;
    }
    async processBackfill(data) {
        const provider = await this.providerFactory.getProviderForAccount(data.userId, data.accountId);
        const limit = data.maxThreads || 50;
        let currentCursor = data.cursor;
        if (!currentCursor) {
            const cursorRes = await this.db.query(`SELECT cursor_value FROM sync_cursors WHERE account_id = $1 AND sync_key = 'backfill' AND user_id = $2;`, [data.accountId, data.userId], data.userId);
            currentCursor = cursorRes.rows[0]?.cursor_value || undefined;
        }
        await this.updateSyncCursorStatus(data.userId, data.accountId, 'backfill', 'backfilling', currentCursor);
        const page = await provider.listThreads({
            cursor: currentCursor,
            limit,
        });
        await this.persistThreads(data.userId, data.accountId, page.threads);
        if (page.nextCursor) {
            await this.updateSyncCursorStatus(data.userId, data.accountId, 'backfill', 'idle', page.nextCursor);
            await this.queueService.enqueueBackfill({
                ...data,
                cursor: page.nextCursor,
            });
        }
        else {
            const initialDelta = await provider.getDeltaHistory();
            await this.updateSyncCursorStatus(data.userId, data.accountId, 'delta', 'idle', initialDelta.nextCursor);
            this.logger.log(`Backfill completed for account ${data.accountId}. Initialized delta cursor.`);
        }
        return {
            syncedCount: page.threads.length,
            nextCursor: page.nextCursor,
        };
    }
    async processIncremental(data) {
        const provider = await this.providerFactory.getProviderForAccount(data.userId, data.accountId);
        const cursorRes = await this.db.query(`SELECT cursor_value FROM sync_cursors WHERE account_id = $1 AND sync_key = 'delta' AND user_id = $2;`, [data.accountId, data.userId], data.userId);
        const cursor = data.cursor || cursorRes.rows[0]?.cursor_value;
        try {
            const delta = await provider.getDeltaHistory(cursor);
            if (delta.threads.length > 0) {
                await this.persistThreads(data.userId, data.accountId, delta.threads);
            }
            if (delta.deletedThreadIds.length > 0) {
                await this.db.query(`UPDATE threads SET deleted_at = clock_timestamp(), folder = 'trash'
           WHERE account_id = $1 AND user_id = $2 AND external_thread_id = ANY($3);`, [data.accountId, data.userId, delta.deletedThreadIds], data.userId);
            }
            await this.updateSyncCursorStatus(data.userId, data.accountId, 'delta', 'idle', delta.nextCursor);
            return {
                updatedCount: delta.threads.length,
                nextCursor: delta.nextCursor,
            };
        }
        catch (err) {
            if (err.status === 404 ||
                err.status === 410 ||
                err.message?.includes('historyId') ||
                err.message?.includes('ResyncRequired')) {
                this.logger.warn(`Cursor invalidation detected for account ${data.accountId}. Triggering clean full resync.`);
                await this.updateSyncCursorStatus(data.userId, data.accountId, 'delta', 'error', null);
                await this.queueService.enqueueBackfill({
                    ...data,
                    cursor: undefined,
                    jobType: 'backfill',
                });
                return { updatedCount: 0, nextCursor: 'reset' };
            }
            throw err;
        }
    }
    async persistThreads(userId, accountId, threads) {
        for (const t of threads) {
            await this.db.transaction(async (client) => {
                const threadRes = await client.query(`INSERT INTO threads (
             id, user_id, account_id, external_thread_id, subject, snippet,
             is_unread, is_starred, folder, has_attachments, message_count, last_message_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE
             SET subject = EXCLUDED.subject,
                 snippet = EXCLUDED.snippet,
                 is_unread = EXCLUDED.is_unread,
                 is_starred = EXCLUDED.is_starred,
                 folder = EXCLUDED.folder,
                 has_attachments = EXCLUDED.has_attachments,
                 message_count = EXCLUDED.message_count,
                 last_message_at = EXCLUDED.last_message_at,
                 updated_at = clock_timestamp()
           RETURNING id;`, [
                    t.id,
                    userId,
                    accountId,
                    t.externalThreadId,
                    t.subject,
                    t.snippet,
                    t.isUnread,
                    t.isStarred,
                    t.folder,
                    (t.messages || []).some((m) => m.attachments.length > 0),
                    t.messageCount,
                    t.lastMessageAt.toISOString(),
                ]);
                const threadId = threadRes?.rows?.[0]?.id || t.id;
                for (const m of t.messages || []) {
                    await client.query(`INSERT INTO messages (
               id, user_id, thread_id, account_id, external_message_id, sender_name,
               sender_email, to_recipients, cc_recipients, bcc_recipients, is_unread, sent_at
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO UPDATE
               SET is_unread = EXCLUDED.is_unread,
                   sent_at = EXCLUDED.sent_at;`, [
                        m.id,
                        userId,
                        threadId,
                        accountId,
                        m.externalMessageId || m.id,
                        m.sender.name,
                        m.sender.email,
                        JSON.stringify(m.to),
                        JSON.stringify(m.cc),
                        JSON.stringify(m.bcc),
                        m.isUnread,
                        m.sentAt.toISOString(),
                    ]);
                    await client.query(`INSERT INTO message_bodies (message_id, user_id, body_plain, body_html, snippet)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (message_id) DO UPDATE
               SET body_plain = EXCLUDED.body_plain,
                   body_html = EXCLUDED.body_html,
                   snippet = EXCLUDED.snippet;`, [m.id, userId, m.bodyPlain, m.bodyHtml, m.snippet]);
                }
            }, userId);
        }
    }
    async updateSyncCursorStatus(userId, accountId, syncKey, status, cursorValue) {
        await this.db.query(`INSERT INTO sync_cursors (id, user_id, account_id, sync_key, cursor_value, status, last_synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, clock_timestamp())
       ON CONFLICT (account_id, sync_key) DO UPDATE
         SET cursor_value = COALESCE(EXCLUDED.cursor_value, sync_cursors.cursor_value),
             status = EXCLUDED.status,
             last_synced_at = clock_timestamp(),
             updated_at = clock_timestamp();`, [(0, uuid_1.v7)(), userId, accountId, syncKey, cursorValue || null, status], userId);
    }
};
exports.SyncProcessorService = SyncProcessorService;
exports.SyncProcessorService = SyncProcessorService = SyncProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        mail_provider_factory_1.MailProviderFactory,
        sync_queue_service_1.SyncQueueService])
], SyncProcessorService);
//# sourceMappingURL=sync-processor.service.js.map