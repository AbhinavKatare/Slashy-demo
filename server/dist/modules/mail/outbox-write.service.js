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
var OutboxWriteService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxWriteService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const mail_provider_factory_1 = require("./adapters/mail-provider.factory");
const outbox_write_dto_1 = require("./dto/outbox-write.dto");
const uuid_1 = require("uuid");
let OutboxWriteService = OutboxWriteService_1 = class OutboxWriteService {
    db;
    providerFactory;
    logger = new common_1.Logger(OutboxWriteService_1.name);
    constructor(db, providerFactory) {
        this.db = db;
        this.providerFactory = providerFactory;
    }
    getInverseAction(action) {
        switch (action) {
            case outbox_write_dto_1.WriteActionType.MARK_READ:
                return outbox_write_dto_1.WriteActionType.MARK_UNREAD;
            case outbox_write_dto_1.WriteActionType.MARK_UNREAD:
                return outbox_write_dto_1.WriteActionType.MARK_READ;
            case outbox_write_dto_1.WriteActionType.STAR:
                return outbox_write_dto_1.WriteActionType.UNSTAR;
            case outbox_write_dto_1.WriteActionType.UNSTAR:
                return outbox_write_dto_1.WriteActionType.STAR;
            case outbox_write_dto_1.WriteActionType.ARCHIVE:
                return 'unarchive';
            case outbox_write_dto_1.WriteActionType.TRASH:
                return 'untrash';
            case outbox_write_dto_1.WriteActionType.APPLY_LABEL:
                return outbox_write_dto_1.WriteActionType.REMOVE_LABEL;
            case outbox_write_dto_1.WriteActionType.REMOVE_LABEL:
                return outbox_write_dto_1.WriteActionType.APPLY_LABEL;
            default:
                return 'noop';
        }
    }
    async executeWrite(userId, threadId, idempotencyKey, dto) {
        if (!idempotencyKey) {
            throw new common_1.BadRequestException('Idempotency-Key header is strictly required');
        }
        const existingOp = await this.db.query(`SELECT id, idempotency_key, action_type, target_id, status, error_message, payload, created_at, updated_at
       FROM outbox_operations
       WHERE user_id = $1 AND idempotency_key = $2;`, [userId, idempotencyKey], userId);
        if (existingOp.rows.length > 0) {
            const op = existingOp.rows[0];
            this.logger.debug(`Idempotent write deduplicated: ${idempotencyKey}`);
            return {
                operationId: op.id,
                idempotencyKey: op.idempotency_key,
                targetId: op.target_id,
                action: op.action_type,
                status: op.status,
                inverseAction: op.payload?.inverseAction || this.getInverseAction(op.action_type),
                errorMessage: op.error_message || undefined,
                confirmedAt: op.status === 'confirmed' ? op.updated_at.toISOString() : undefined,
            };
        }
        const threadRes = await this.db.query(`SELECT id, account_id, external_thread_id, is_unread, is_starred, folder, updated_at
       FROM threads
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;`, [threadId, userId], userId);
        if (!threadRes.rows[0]) {
            throw new common_1.NotFoundException(`Thread ${threadId} not found`);
        }
        const thread = threadRes.rows[0];
        const currentETag = thread.updated_at.toISOString();
        if (dto.eTag && dto.eTag !== currentETag) {
            throw new common_1.PreconditionFailedException(`Optimistic concurrency conflict: thread has changed since version ${dto.eTag} (current: ${currentETag})`);
        }
        const opId = (0, uuid_1.v7)();
        const inverseAction = this.getInverseAction(dto.action);
        await this.db.query(`INSERT INTO outbox_operations (id, user_id, account_id, idempotency_key, action_type, target_id, payload, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending');`, [
            opId,
            userId,
            thread.account_id,
            idempotencyKey,
            dto.action,
            threadId,
            JSON.stringify({ inverseAction, labelName: dto.labelName }),
        ], userId);
        const provider = await this.providerFactory.getProviderForAccount(userId, thread.account_id);
        const externalId = thread.external_thread_id || thread.id;
        let success = true;
        let errorMessage = null;
        try {
            switch (dto.action) {
                case outbox_write_dto_1.WriteActionType.MARK_READ:
                    await provider.modifyLabels(externalId, { isRead: true });
                    break;
                case outbox_write_dto_1.WriteActionType.MARK_UNREAD:
                    await provider.modifyLabels(externalId, { isRead: false });
                    break;
                case outbox_write_dto_1.WriteActionType.STAR:
                    await provider.modifyLabels(externalId, { isStarred: true });
                    break;
                case outbox_write_dto_1.WriteActionType.UNSTAR:
                    await provider.modifyLabels(externalId, { isStarred: false });
                    break;
                case outbox_write_dto_1.WriteActionType.ARCHIVE:
                    await provider.archive(externalId);
                    break;
                case outbox_write_dto_1.WriteActionType.TRASH:
                    await provider.trash(externalId);
                    break;
                case outbox_write_dto_1.WriteActionType.APPLY_LABEL:
                    await provider.modifyLabels(externalId, { addLabels: [dto.labelName || ''] });
                    break;
                case outbox_write_dto_1.WriteActionType.REMOVE_LABEL:
                    await provider.modifyLabels(externalId, { removeLabels: [dto.labelName || ''] });
                    break;
                default:
                    throw new Error(`Unsupported action ${dto.action}`);
            }
        }
        catch (err) {
            success = false;
            errorMessage = err.message || 'Provider execution failed';
            this.logger.error(`Provider write failed for thread ${threadId}: ${errorMessage}`);
        }
        let newETag = currentETag;
        if (success) {
            const updateSets = ['updated_at = clock_timestamp()'];
            if (dto.action === outbox_write_dto_1.WriteActionType.MARK_READ)
                updateSets.push('is_unread = false');
            if (dto.action === outbox_write_dto_1.WriteActionType.MARK_UNREAD)
                updateSets.push('is_unread = true');
            if (dto.action === outbox_write_dto_1.WriteActionType.STAR)
                updateSets.push('is_starred = true');
            if (dto.action === outbox_write_dto_1.WriteActionType.UNSTAR)
                updateSets.push('is_starred = false');
            if (dto.action === outbox_write_dto_1.WriteActionType.ARCHIVE)
                updateSets.push("folder = 'archive'");
            if (dto.action === outbox_write_dto_1.WriteActionType.TRASH)
                updateSets.push("folder = 'trash'");
            const updateRes = await this.db.query(`UPDATE threads SET ${updateSets.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING updated_at;`, [threadId, userId], userId);
            newETag = updateRes.rows[0]?.updated_at?.toISOString() || currentETag;
            await this.db.query(`UPDATE outbox_operations SET status = 'confirmed', updated_at = clock_timestamp() WHERE id = $1;`, [opId], userId);
        }
        else {
            await this.db.query(`UPDATE outbox_operations SET status = 'failed', error_message = $2, updated_at = clock_timestamp() WHERE id = $1;`, [opId, errorMessage], userId);
        }
        return {
            operationId: opId,
            idempotencyKey,
            targetId: threadId,
            action: dto.action,
            status: success ? 'confirmed' : 'failed',
            inverseAction,
            eTag: newETag,
            errorMessage: errorMessage || undefined,
            confirmedAt: success ? new Date().toISOString() : undefined,
        };
    }
    async executeBulkWrite(userId, idempotencyKey, dto) {
        if (!idempotencyKey) {
            throw new common_1.BadRequestException('Idempotency-Key header is required for bulk actions');
        }
        const itemResults = [];
        for (const [index, tid] of dto.threadIds.entries()) {
            const subKey = `${idempotencyKey}_item_${index}`;
            try {
                const res = await this.executeWrite(userId, tid, subKey, {
                    action: dto.action,
                    labelName: dto.labelName,
                });
                itemResults.push({
                    threadId: tid,
                    status: res.status,
                    error: res.errorMessage,
                });
            }
            catch (err) {
                itemResults.push({
                    threadId: tid,
                    status: 'failed',
                    error: err.message,
                });
            }
        }
        const succeeded = itemResults.filter((r) => r.status === 'confirmed').length;
        const failed = itemResults.filter((r) => r.status === 'failed').length;
        return {
            idempotencyKey,
            action: dto.action,
            totalCount: dto.threadIds.length,
            succeededCount: succeeded,
            failedCount: failed,
            items: itemResults,
        };
    }
    async getOperationStatus(userId, operationId) {
        const res = await this.db.query(`SELECT id, idempotency_key, action_type, target_id, status, error_message, payload, created_at, updated_at
       FROM outbox_operations
       WHERE id = $1 AND user_id = $2;`, [operationId, userId], userId);
        if (!res.rows[0]) {
            throw new common_1.NotFoundException(`Operation ${operationId} not found`);
        }
        const row = res.rows[0];
        return {
            operationId: row.id,
            idempotencyKey: row.idempotency_key,
            targetId: row.target_id,
            action: row.action_type,
            status: row.status,
            errorMessage: row.error_message || undefined,
            inverseAction: row.payload?.inverseAction,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
        };
    }
    async undoOperation(userId, operationId) {
        const op = await this.getOperationStatus(userId, operationId);
        if (op.status !== 'confirmed') {
            throw new common_1.BadRequestException('Cannot undo an operation that was not confirmed');
        }
        const undoKey = `undo_${op.operationId}_${Date.now()}`;
        const inverseAction = op.inverseAction;
        const undoRes = await this.executeWrite(userId, op.targetId, undoKey, {
            action: inverseAction,
        });
        return {
            undoneOperationId: operationId,
            inverseResult: undoRes,
            message: 'Operation successfully undone',
        };
    }
};
exports.OutboxWriteService = OutboxWriteService;
exports.OutboxWriteService = OutboxWriteService = OutboxWriteService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        mail_provider_factory_1.MailProviderFactory])
], OutboxWriteService);
//# sourceMappingURL=outbox-write.service.js.map