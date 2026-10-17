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
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const uuid_1 = require("uuid");
let MailService = class MailService {
    db;
    constructor(db) {
        this.db = db;
    }
    async listThreads(userId, query) {
        const limit = query.limit || 20;
        const conditions = ['t.user_id = $1', 't.deleted_at IS NULL'];
        const params = [userId];
        if (query.folder) {
            params.push(query.folder);
            conditions.push(`t.folder = $${params.length}`);
        }
        if (query.accountId) {
            params.push(query.accountId);
            conditions.push(`t.account_id = $${params.length}`);
        }
        if (query.isUnread !== undefined) {
            params.push(query.isUnread);
            conditions.push(`t.is_unread = $${params.length}`);
        }
        if (query.cursor) {
            params.push(query.cursor);
            conditions.push(`t.last_message_at < $${params.length}`);
        }
        params.push(limit + 1);
        const limitParam = `$${params.length}`;
        const sql = `
      SELECT 
        t.id, t.account_id, t.subject, t.snippet, t.is_unread, t.is_starred,
        t.folder, t.has_attachments, t.message_count, t.last_message_at,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', l.id, 'name', l.name, 'colorHex', l.color_hex))
          FILTER (WHERE l.id IS NOT NULL), '[]'::json
        ) AS labels
      FROM threads t
      LEFT JOIN thread_labels tl ON t.id = tl.thread_id
      LEFT JOIN labels l ON tl.label_id = l.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY t.id
      ORDER BY t.last_message_at DESC
      LIMIT ${limitParam};
    `;
        const res = await this.db.query(sql, params, userId);
        const hasMore = res.rows.length > limit;
        const rows = hasMore ? res.rows.slice(0, limit) : res.rows;
        const nextCursor = hasMore && rows.length > 0 ? rows[rows.length - 1].last_message_at.toISOString() : null;
        return {
            threads: rows.map((r) => ({
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
                labels: r.labels,
            })),
            nextCursor,
            totalCount: rows.length,
        };
    }
    async getThread(userId, threadId) {
        const threadRes = await this.db.query(`SELECT id, account_id, subject, snippet, is_unread, is_starred, folder, has_attachments, message_count, last_message_at
       FROM threads
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;`, [threadId, userId], userId);
        if (!threadRes.rows[0]) {
            throw new common_1.NotFoundException(`Thread ${threadId} not found`);
        }
        const messagesRes = await this.db.query(`SELECT m.id, m.thread_id, m.sender_name, m.sender_email, m.to_recipients, m.cc_recipients,
              m.bcc_recipients, m.is_unread, m.sent_at,
              b.body_plain, b.body_html
       FROM messages m
       LEFT JOIN message_bodies b ON m.id = b.message_id
       WHERE m.thread_id = $1 AND m.user_id = $2
       ORDER BY m.sent_at ASC;`, [threadId, userId], userId);
        return {
            thread: threadRes.rows[0],
            messages: messagesRes.rows.map((m) => ({
                id: m.id,
                threadId: m.thread_id,
                senderName: m.sender_name,
                senderEmail: m.sender_email,
                toRecipients: m.to_recipients,
                ccRecipients: m.cc_recipients,
                bccRecipients: m.bcc_recipients,
                isUnread: m.is_unread,
                sentAt: m.sent_at.toISOString(),
                bodyPlain: m.body_plain || '',
                bodyHtml: m.body_html || '',
            })),
        };
    }
    async updateThread(userId, threadId, dto) {
        const sets = ['updated_at = clock_timestamp()'];
        const params = [threadId, userId];
        if (dto.isStarred !== undefined) {
            params.push(dto.isStarred);
            sets.push(`is_starred = $${params.length}`);
        }
        if (dto.isUnread !== undefined) {
            params.push(dto.isUnread);
            sets.push(`is_unread = $${params.length}`);
        }
        if (dto.folder !== undefined) {
            params.push(dto.folder);
            sets.push(`folder = $${params.length}`);
        }
        const res = await this.db.query(`UPDATE threads
       SET ${sets.join(', ')}
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id, subject, is_starred, is_unread, folder;`, params, userId);
        if (!res.rows[0]) {
            throw new common_1.NotFoundException(`Thread ${threadId} not found`);
        }
        return res.rows[0];
    }
    async deleteThread(userId, threadId) {
        const res = await this.db.query(`UPDATE threads SET deleted_at = clock_timestamp(), folder = 'trash'
       WHERE id = $1 AND user_id = $2
       RETURNING id;`, [threadId, userId], userId);
        if (!res.rows[0]) {
            throw new common_1.NotFoundException(`Thread ${threadId} not found`);
        }
        return { success: true, message: 'Thread moved to trash' };
    }
    async sendMessage(userId, dto) {
        return this.db.transaction(async (client) => {
            let threadId = dto.replyToThreadId;
            if (!threadId) {
                threadId = (0, uuid_1.v7)();
                await client.query(`INSERT INTO threads (id, user_id, account_id, subject, snippet, is_unread, is_starred, folder, has_attachments, message_count, last_message_at)
           VALUES ($1, $2, $3, $4, $5, false, false, 'sent', false, 1, clock_timestamp());`, [threadId, userId, dto.accountId, dto.subject, dto.bodyPlain.substring(0, 100)]);
            }
            else {
                await client.query(`UPDATE threads 
           SET message_count = message_count + 1,
               last_message_at = clock_timestamp(),
               folder = 'sent',
               updated_at = clock_timestamp()
           WHERE id = $1 AND user_id = $2;`, [threadId, userId]);
            }
            const messageId = (0, uuid_1.v7)();
            await client.query(`INSERT INTO messages (id, user_id, thread_id, account_id, sender_name, sender_email, to_recipients, cc_recipients, bcc_recipients, is_unread, sent_at)
         VALUES ($1, $2, $3, $4, 'Me', 'me@example.com', $5, $6, $7, false, clock_timestamp());`, [
                messageId,
                userId,
                threadId,
                dto.accountId,
                JSON.stringify(dto.to),
                JSON.stringify(dto.cc || []),
                JSON.stringify(dto.bcc || []),
            ]);
            await client.query(`INSERT INTO message_bodies (message_id, user_id, body_plain, body_html, snippet)
         VALUES ($1, $2, $3, $4, $5);`, [
                messageId,
                userId,
                dto.bodyPlain,
                dto.bodyHtml || dto.bodyPlain,
                dto.bodyPlain.substring(0, 100),
            ]);
            return {
                messageId,
                threadId,
                sentAt: new Date().toISOString(),
                status: 'sent',
            };
        }, userId);
    }
    async listLabels(userId, accountId) {
        const params = [userId];
        let sql = `SELECT id, account_id, name, color_hex FROM labels WHERE user_id = $1`;
        if (accountId) {
            params.push(accountId);
            sql += ` AND account_id = $2`;
        }
        sql += ` ORDER BY name ASC;`;
        const res = await this.db.query(sql, params, userId);
        return res.rows;
    }
    async createLabel(userId, dto) {
        const id = (0, uuid_1.v7)();
        const res = await this.db.query(`INSERT INTO labels (id, user_id, account_id, name, color_hex)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, account_id, name) DO UPDATE SET color_hex = EXCLUDED.color_hex
       RETURNING id, account_id, name, color_hex;`, [id, userId, dto.accountId, dto.name, dto.colorHex], userId);
        return res.rows[0];
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], MailService);
//# sourceMappingURL=mail.service.js.map