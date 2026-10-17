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
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const uuid_1 = require("uuid");
let SyncService = SyncService_1 = class SyncService {
    db;
    logger = new common_1.Logger(SyncService_1.name);
    constructor(db) {
        this.db = db;
    }
    async pullDeltas(userId, query) {
        const since = query.cursor ? new Date(query.cursor) : new Date(0);
        const params = [userId, since.toISOString()];
        let accountFilter = '';
        if (query.accountId) {
            params.push(query.accountId);
            accountFilter = ` AND t.account_id = $${params.length}`;
        }
        const threadsRes = await this.db.query(`SELECT t.id, t.account_id, t.subject, t.snippet, t.is_unread, t.is_starred,
              t.folder, t.has_attachments, t.message_count, t.last_message_at,
              t.updated_at, t.deleted_at
       FROM threads t
       WHERE t.user_id = $1 AND t.updated_at > $2 ${accountFilter}
       ORDER BY t.updated_at ASC
       LIMIT 100;`, params, userId);
        const updatedThreads = threadsRes.rows
            .filter((r) => !r.deleted_at)
            .map((r) => ({
            id: r.id,
            accountId: r.account_id,
            subject: r.subject,
            snippet: r.snippet,
            isUnread: r.is_unread,
            isStarred: r.is_starred,
            folder: r.folder,
            hasAttachments: r.has_attachments,
            messageCount: r.message_count,
            lastMessageAt: r.last_message_at.toISOString(),
            updatedAt: r.updated_at.toISOString(),
        }));
        const deletedThreadIds = threadsRes.rows.filter((r) => !!r.deleted_at).map((r) => r.id);
        const now = new Date().toISOString();
        const newCursor = threadsRes.rows.length > 0
            ? threadsRes.rows[threadsRes.rows.length - 1].updated_at.toISOString()
            : query.cursor || now;
        return {
            threads: updatedThreads,
            deletedThreadIds,
            cursor: newCursor,
            hasMore: threadsRes.rows.length >= 100,
        };
    }
    async processOutboxBatch(userId, operations) {
        const results = [];
        for (const op of operations) {
            try {
                const res = await this.db.transaction(async (client) => {
                    const existing = await client.query(`SELECT id, status, error_message FROM outbox_operations
             WHERE user_id = $1 AND idempotency_key = $2;`, [userId, op.idempotencyKey]);
                    if (existing.rows.length > 0) {
                        const row = existing.rows[0];
                        return {
                            idempotencyKey: op.idempotencyKey,
                            status: row.status,
                            error: row.error_message || undefined,
                        };
                    }
                    const opId = (0, uuid_1.v7)();
                    let success = true;
                    let errorMessage = null;
                    try {
                        switch (op.actionType) {
                            case 'mark_read':
                                await client.query(`UPDATE threads SET is_unread = false, updated_at = clock_timestamp() WHERE id = $1 AND user_id = $2;`, [op.targetId, userId]);
                                break;
                            case 'mark_unread':
                                await client.query(`UPDATE threads SET is_unread = true, updated_at = clock_timestamp() WHERE id = $1 AND user_id = $2;`, [op.targetId, userId]);
                                break;
                            case 'star':
                                await client.query(`UPDATE threads SET is_starred = true, updated_at = clock_timestamp() WHERE id = $1 AND user_id = $2;`, [op.targetId, userId]);
                                break;
                            case 'unstar':
                                await client.query(`UPDATE threads SET is_starred = false, updated_at = clock_timestamp() WHERE id = $1 AND user_id = $2;`, [op.targetId, userId]);
                                break;
                            case 'archive':
                                await client.query(`UPDATE threads SET folder = 'archive', updated_at = clock_timestamp() WHERE id = $1 AND user_id = $2;`, [op.targetId, userId]);
                                break;
                            case 'trash':
                                await client.query(`UPDATE threads SET folder = 'trash', deleted_at = clock_timestamp(), updated_at = clock_timestamp() WHERE id = $1 AND user_id = $2;`, [op.targetId, userId]);
                                break;
                            default:
                                throw new Error(`Unsupported outbox action: ${op.actionType}`);
                        }
                    }
                    catch (err) {
                        success = false;
                        errorMessage = err.message || 'Operation execution failed';
                    }
                    await client.query(`INSERT INTO outbox_operations (id, user_id, account_id, idempotency_key, action_type, target_id, payload, status, error_message)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`, [
                        opId,
                        userId,
                        op.accountId,
                        op.idempotencyKey,
                        op.actionType,
                        op.targetId,
                        JSON.stringify(op.payload || {}),
                        success ? 'completed' : 'failed',
                        errorMessage,
                    ]);
                    return {
                        idempotencyKey: op.idempotencyKey,
                        status: success ? 'completed' : 'failed',
                        error: errorMessage || undefined,
                    };
                }, userId);
                results.push(res);
            }
            catch (err) {
                this.logger.error(`Error processing outbox key ${op.idempotencyKey}: ${err.message}`);
                results.push({
                    idempotencyKey: op.idempotencyKey,
                    status: 'failed',
                    error: err.message,
                });
            }
        }
        return { processed: results };
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SyncService);
//# sourceMappingURL=sync.service.js.map