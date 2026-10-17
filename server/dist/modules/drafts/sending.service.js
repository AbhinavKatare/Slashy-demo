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
var SendingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendingService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const uuid_1 = require("uuid");
const database_service_1 = require("../../database/database.service");
const mail_provider_factory_1 = require("../mail/adapters/mail-provider.factory");
const clamav_scanner_service_1 = require("../../common/security/clamav-scanner.service");
const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;
const BLOCKED_EXTENSIONS = new Set([
    '.exe',
    '.bat',
    '.cmd',
    '.sh',
    '.msi',
    '.vbs',
    '.js',
    '.scr',
    '.pif',
    '.com',
    '.ps1',
]);
let SendingService = SendingService_1 = class SendingService {
    db;
    providerFactory;
    malwareScanner;
    logger = new common_1.Logger(SendingService_1.name);
    activeUndoTimers = new Map();
    onModuleDestroy() {
        for (const timer of this.activeUndoTimers.values()) {
            clearTimeout(timer);
        }
        this.activeUndoTimers.clear();
    }
    constructor(db, providerFactory, malwareScanner) {
        this.db = db;
        this.providerFactory = providerFactory;
        this.malwareScanner = malwareScanner;
    }
    computeDraftHash(draft) {
        const canonical = [
            draft.account_id,
            JSON.stringify(draft.to_recipients ?? []),
            JSON.stringify(draft.cc_recipients ?? []),
            JSON.stringify(draft.bcc_recipients ?? []),
            draft.subject ?? '',
            draft.body_plain ?? '',
            draft.body_html ?? '',
            JSON.stringify(draft.attachments_meta ?? []),
        ].join('|');
        return crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
    }
    async sendDraft(userId, dto, idempotencyKey) {
        const effectiveIdempotencyKey = idempotencyKey || `send-${dto.draftId}-${dto.payloadHash.substring(0, 16)}`;
        const existingOp = await this.db.query(`SELECT id, status, payload, created_at FROM outbox_operations 
       WHERE idempotency_key = $1 AND user_id = $2;`, [effectiveIdempotencyKey, userId], userId);
        if (existingOp.rows[0]) {
            this.logger.log(`[IDEMPOTENCY] Replaying duplicate send request ${effectiveIdempotencyKey}`);
            return {
                sendId: existingOp.rows[0].id,
                status: existingOp.rows[0].status,
                message: 'Send request already submitted and being processed',
            };
        }
        const draftRes = await this.db.query(`SELECT id, account_id, reply_thread_id, reply_message_id, to_recipients, cc_recipients,
              bcc_recipients, subject, body_plain, body_html, attachments_meta
       FROM drafts
       WHERE id = $1 AND user_id = $2;`, [dto.draftId, userId], userId);
        if (!draftRes.rows[0]) {
            throw new common_1.NotFoundException(`Draft ${dto.draftId} not found`);
        }
        const draft = draftRes.rows[0];
        const expectedHash = this.computeDraftHash(draft);
        if (expectedHash.toLowerCase() !== dto.payloadHash.toLowerCase()) {
            this.logger.warn(`[INTEGRITY ERROR] Draft hash mismatch for user ${userId}. Expected ${expectedHash}, got ${dto.payloadHash}`);
            throw new common_1.BadRequestException('Draft content changed since last review (payload hash mismatch). Please review before sending.');
        }
        const sendId = (0, uuid_1.v7)();
        const undoWindowSeconds = dto.undoWindowSeconds ?? 10;
        if (dto.scheduledAt) {
            const scheduledDate = new Date(dto.scheduledAt);
            if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
                throw new common_1.BadRequestException('scheduledAt must be a valid timestamp in the future');
            }
            const scheduledMsgId = (0, uuid_1.v7)();
            await this.db.query(`INSERT INTO scheduled_messages (id, user_id, account_id, draft_id, scheduled_at, timezone, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending');`, [
                scheduledMsgId,
                userId,
                draft.account_id,
                draft.id,
                scheduledDate.toISOString(),
                dto.timezone || 'UTC',
            ], userId);
            await this.db.query(`INSERT INTO outbox_operations (id, user_id, account_id, idempotency_key, action_type, target_id, payload, status)
         VALUES ($1, $2, $3, $4, 'send_mail', $5, $6, 'scheduled');`, [
                sendId,
                userId,
                draft.account_id,
                effectiveIdempotencyKey,
                draft.id,
                JSON.stringify({
                    draftId: draft.id,
                    scheduledAt: dto.scheduledAt,
                    timezone: dto.timezone || 'UTC',
                    scheduledMessageId: scheduledMsgId,
                    followUpIfNoReplyDays: dto.followUpIfNoReplyDays,
                    reminderAt: dto.reminderAt,
                }),
            ], userId);
            return {
                sendId,
                status: 'scheduled',
                scheduledAt: scheduledDate.toISOString(),
                timezone: dto.timezone || 'UTC',
            };
        }
        if (undoWindowSeconds > 0) {
            const dispatchAt = new Date(Date.now() + undoWindowSeconds * 1000);
            await this.db.query(`INSERT INTO outbox_operations (id, user_id, account_id, idempotency_key, action_type, target_id, payload, status)
         VALUES ($1, $2, $3, $4, 'send_mail', $5, $6, 'undo_window');`, [
                sendId,
                userId,
                draft.account_id,
                effectiveIdempotencyKey,
                draft.id,
                JSON.stringify({
                    draftId: draft.id,
                    dispatchAt: dispatchAt.toISOString(),
                    followUpIfNoReplyDays: dto.followUpIfNoReplyDays,
                    reminderAt: dto.reminderAt,
                }),
            ], userId);
            const timer = setTimeout(async () => {
                try {
                    await this.dispatchSend(userId, sendId);
                }
                catch (err) {
                    this.logger.error(`Failed to dispatch send for ${sendId}: ${err.message}`);
                }
                finally {
                    this.activeUndoTimers.delete(sendId);
                }
            }, undoWindowSeconds * 1000);
            if (timer.unref) {
                timer.unref();
            }
            this.activeUndoTimers.set(sendId, timer);
            return {
                sendId,
                status: 'undo_window',
                undoWindowSeconds,
                dispatchAt: dispatchAt.toISOString(),
            };
        }
        await this.db.query(`INSERT INTO outbox_operations (id, user_id, account_id, idempotency_key, action_type, target_id, payload, status)
       VALUES ($1, $2, $3, $4, 'send_mail', $5, $6, 'in_flight');`, [
            sendId,
            userId,
            draft.account_id,
            effectiveIdempotencyKey,
            draft.id,
            JSON.stringify({
                draftId: draft.id,
                followUpIfNoReplyDays: dto.followUpIfNoReplyDays,
                reminderAt: dto.reminderAt,
            }),
        ], userId);
        return this.dispatchSend(userId, sendId);
    }
    async cancelSend(userId, sendId) {
        const timer = this.activeUndoTimers.get(sendId);
        if (timer) {
            clearTimeout(timer);
            this.activeUndoTimers.delete(sendId);
        }
        const opRes = await this.db.query(`SELECT id, status, payload FROM outbox_operations
       WHERE id = $1 AND user_id = $2;`, [sendId, userId], userId);
        if (!opRes.rows[0]) {
            throw new common_1.NotFoundException(`Send operation ${sendId} not found`);
        }
        const op = opRes.rows[0];
        if (op.status === 'completed' || op.status === 'in_flight') {
            throw new common_1.ConflictException('Cannot cancel: message has already been dispatched to provider');
        }
        if (op.status === 'cancelled') {
            return { success: true, message: 'Send operation was already cancelled' };
        }
        await this.db.query(`UPDATE outbox_operations
       SET status = 'cancelled', updated_at = clock_timestamp()
       WHERE id = $1 AND user_id = $2;`, [sendId, userId], userId);
        if (op.payload?.scheduledMessageId) {
            await this.db.query(`UPDATE scheduled_messages
         SET status = 'cancelled', updated_at = clock_timestamp()
         WHERE id = $1 AND user_id = $2;`, [op.payload.scheduledMessageId, userId], userId);
        }
        this.logger.log(`Send operation ${sendId} successfully cancelled by user ${userId}`);
        return { success: true, message: 'Send successfully cancelled' };
    }
    async dispatchSend(userId, sendId) {
        const opRes = await this.db.query(`SELECT id, account_id, target_id, payload, status FROM outbox_operations
       WHERE id = $1 AND user_id = $2;`, [sendId, userId], userId);
        if (!opRes.rows[0]) {
            throw new common_1.NotFoundException(`Operation ${sendId} not found`);
        }
        const op = opRes.rows[0];
        if (op.status === 'cancelled') {
            this.logger.log(`Operation ${sendId} was cancelled; skipping dispatch.`);
            return { sendId, status: 'cancelled' };
        }
        await this.db.query(`UPDATE outbox_operations SET status = 'in_flight', updated_at = clock_timestamp()
       WHERE id = $1;`, [sendId], userId);
        const draftId = op.target_id;
        const draftRes = await this.db.query(`SELECT id, account_id, reply_thread_id, reply_message_id, to_recipients, cc_recipients,
              bcc_recipients, subject, body_plain, body_html, attachments_meta
       FROM drafts WHERE id = $1 AND user_id = $2;`, [draftId, userId], userId);
        if (!draftRes.rows[0]) {
            await this.db.query(`UPDATE outbox_operations SET status = 'failed', error_message = 'Draft no longer exists' WHERE id = $1;`, [sendId], userId);
            throw new common_1.NotFoundException(`Draft ${draftId} not found for dispatch`);
        }
        const draft = draftRes.rows[0];
        try {
            const provider = await this.providerFactory.getProviderForAccount(userId, draft.account_id);
            const formatRecipients = (list) => (list || []).map((r) => ({
                name: (typeof r === 'string' ? '' : r.name) || '',
                email: (typeof r === 'string' ? r : r.email || r.address) || '',
            }));
            const sentResult = await provider.send({
                to: formatRecipients(draft.to_recipients),
                cc: formatRecipients(draft.cc_recipients),
                bcc: formatRecipients(draft.bcc_recipients),
                subject: draft.subject || '',
                bodyPlain: draft.body_plain || '',
                bodyHtml: draft.body_html || '',
                replyThreadId: draft.reply_thread_id || undefined,
                attachments: draft.attachments_meta || [],
            });
            const sentAt = new Date();
            await this.db.query(`UPDATE outbox_operations
         SET status = 'completed',
             payload = payload || $2::jsonb,
             updated_at = clock_timestamp()
         WHERE id = $1;`, [
                sendId,
                JSON.stringify({
                    providerMessageId: sentResult.messageId,
                    threadId: sentResult.threadId,
                    sentAt: sentAt.toISOString(),
                }),
            ], userId);
            if (op.payload?.followUpIfNoReplyDays) {
                const reminderId = (0, uuid_1.v7)();
                const dueAt = new Date(Date.now() + op.payload.followUpIfNoReplyDays * 86400 * 1000);
                await this.db.query(`INSERT INTO reminders (id, user_id, thread_id, reminder_at, status)
           VALUES ($1, $2, $3, $4, 'pending');`, [
                    reminderId,
                    userId,
                    sentResult.threadId || draft.reply_thread_id || null,
                    dueAt.toISOString(),
                ], userId);
            }
            await this.db.query(`DELETE FROM drafts WHERE id = $1 AND user_id = $2;`, [draftId, userId], userId);
            return {
                sendId,
                status: 'completed',
                providerMessageId: sentResult.messageId,
                threadId: sentResult.threadId,
                sentAt: sentAt.toISOString(),
            };
        }
        catch (err) {
            const errorMessage = err.message;
            this.logger.error(`Provider send failed for draft ${draftId}: ${errorMessage}`);
            await this.db.query(`UPDATE outbox_operations
         SET status = 'failed',
             retry_count = retry_count + 1,
             error_message = $2,
             updated_at = clock_timestamp()
         WHERE id = $1;`, [sendId, errorMessage], userId);
            throw err;
        }
    }
    async uploadAttachment(userId, dto) {
        const buffer = Buffer.from(dto.base64Data, 'base64');
        if (buffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new common_1.BadRequestException(`Attachment exceeds maximum size of 25MB (${(buffer.length / (1024 * 1024)).toFixed(1)}MB provided)`);
        }
        const extMatch = dto.filename.match(/\.[^.]+$/);
        const extension = extMatch ? extMatch[0].toLowerCase() : '';
        if (BLOCKED_EXTENSIONS.has(extension)) {
            throw new common_1.BadRequestException(`Executable file types (${extension}) are blocked for security purposes.`);
        }
        const scanResult = await this.malwareScanner.scanBuffer(buffer, dto.filename);
        if (scanResult.isInfected) {
            this.logger.warn(`Attachment "${dto.filename}" blocked: infected with ${scanResult.virusName}`);
            throw new common_1.BadRequestException(`Attachment rejected by security scanner: malware signature detected (${scanResult.virusName || 'Malware'})`);
        }
        const attachmentId = (0, uuid_1.v7)();
        const storagePath = `attachments/${userId}/${attachmentId}_${dto.filename}`;
        return {
            id: attachmentId,
            filename: dto.filename,
            contentType: dto.contentType,
            sizeBytes: buffer.length,
            storagePath,
            uploadedAt: new Date().toISOString(),
        };
    }
    async evaluateFollowUpReminders(userId) {
        const pendingReminders = await this.db.query(`SELECT r.id, r.thread_id, r.reminder_at, r.status
       FROM reminders r
       WHERE r.user_id = $1 AND r.status = 'pending' AND r.reminder_at <= clock_timestamp();`, [userId], userId);
        const triggeredReminders = [];
        for (const r of pendingReminders.rows) {
            if (!r.thread_id)
                continue;
            const replies = await this.db.query(`SELECT m.id, m.sent_at FROM messages m
         JOIN connected_accounts a ON m.account_id = a.id
         WHERE m.thread_id = $1 AND m.sender_email != a.external_id
         ORDER BY m.sent_at DESC LIMIT 1;`, [r.thread_id], userId);
            if (replies.rows[0]) {
                await this.db.query(`UPDATE reminders SET status = 'resolved', updated_at = clock_timestamp() WHERE id = $1;`, [r.id], userId);
            }
            else {
                await this.db.query(`UPDATE reminders SET status = 'triggered', updated_at = clock_timestamp() WHERE id = $1;`, [r.id], userId);
                triggeredReminders.push(r.id);
            }
        }
        return { evaluated: pendingReminders.rows.length, triggered: triggeredReminders.length };
    }
};
exports.SendingService = SendingService;
exports.SendingService = SendingService = SendingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        mail_provider_factory_1.MailProviderFactory,
        clamav_scanner_service_1.ClamAvScannerService])
], SendingService);
//# sourceMappingURL=sending.service.js.map