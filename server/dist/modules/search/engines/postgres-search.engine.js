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
var PostgresSearchEngine_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresSearchEngine = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../../database/database.service");
const query_parser_1 = require("../parser/query-parser");
let PostgresSearchEngine = PostgresSearchEngine_1 = class PostgresSearchEngine {
    db;
    logger = new common_1.Logger(PostgresSearchEngine_1.name);
    constructor(db) {
        this.db = db;
    }
    async search(userId, rawQuery, options = {}) {
        const parsed = query_parser_1.QueryParser.parse(rawQuery);
        const limit = options.limit || 20;
        const whereClauses = ['t.user_id = $1', 't.deleted_at IS NULL'];
        const params = [userId];
        if (options.accountId) {
            params.push(options.accountId);
            whereClauses.push(`t.account_id = $${params.length}`);
        }
        if (parsed.folder) {
            params.push(parsed.folder);
            whereClauses.push(`t.folder = $${params.length}`);
        }
        if (parsed.isUnread !== undefined) {
            params.push(parsed.isUnread);
            whereClauses.push(`t.is_unread = $${params.length}`);
        }
        if (parsed.isStarred) {
            whereClauses.push(`t.is_starred = true`);
        }
        if (parsed.before) {
            params.push(parsed.before.toISOString());
            whereClauses.push(`t.last_message_at <= $${params.length}::timestamptz`);
        }
        if (parsed.after) {
            params.push(parsed.after.toISOString());
            whereClauses.push(`t.last_message_at >= $${params.length}::timestamptz`);
        }
        if (parsed.hasAttachment) {
            whereClauses.push(`
        EXISTS (
          SELECT 1 FROM messages m
          JOIN attachments a ON a.message_id = m.id
          WHERE m.thread_id = t.id AND m.user_id = $1
        )
      `);
        }
        if (parsed.from) {
            params.push(`%${parsed.from}%`);
            whereClauses.push(`
        EXISTS (
          SELECT 1 FROM messages m
          WHERE m.thread_id = t.id AND m.user_id = $1
            AND (m.sender_email ILIKE $${params.length} OR m.sender_name ILIKE $${params.length})
        )
      `);
        }
        if (parsed.to) {
            params.push(`%${parsed.to}%`);
            whereClauses.push(`
        EXISTS (
          SELECT 1 FROM messages m
          WHERE m.thread_id = t.id AND m.user_id = $1
            AND m.to_recipients::text ILIKE $${params.length}
        )
      `);
        }
        if (parsed.label) {
            params.push(parsed.label);
            whereClauses.push(`
        EXISTS (
          SELECT 1 FROM thread_labels tl
          JOIN labels l ON tl.label_id = l.id
          WHERE tl.thread_id = t.id AND l.user_id = $1 AND l.name ILIKE $${params.length}
        )
      `);
        }
        let selectRank = '1.0 AS score';
        let selectHighlightSubject = 't.subject AS highlighted_subject';
        let selectHighlightSnippet = 't.snippet AS highlighted_snippet';
        let orderBy = 't.last_message_at DESC';
        if (parsed.freeText) {
            params.push(parsed.freeText);
            const qIndex = params.length;
            selectRank = `
        ts_rank_cd(
          (setweight(to_tsvector('english', COALESCE(t.subject, '')), 'A') ||
           setweight(to_tsvector('english', COALESCE(t.snippet, '')), 'B')),
          plainto_tsquery('english', $${qIndex})
        ) AS score
      `;
            selectHighlightSubject = `
        ts_headline('english', t.subject, plainto_tsquery('english', $${qIndex}), 'StartSel=<b>, StopSel=</b>') AS highlighted_subject
      `;
            selectHighlightSnippet = `
        ts_headline('english', t.snippet, plainto_tsquery('english', $${qIndex}), 'StartSel=<b>, StopSel=</b>') AS highlighted_snippet
      `;
            whereClauses.push(`
        (
          (setweight(to_tsvector('english', COALESCE(t.subject, '')), 'A') ||
           setweight(to_tsvector('english', COALESCE(t.snippet, '')), 'B')) @@ plainto_tsquery('english', $${qIndex})
          OR t.subject ILIKE '%' || $${qIndex} || '%'
          OR t.snippet ILIKE '%' || $${qIndex} || '%'
        )
      `);
            orderBy = 'score DESC, t.last_message_at DESC';
        }
        params.push(limit);
        const limitIndex = params.length;
        const sql = `
      SELECT 
        t.id, t.account_id, t.subject, t.snippet, t.folder, t.is_unread, t.is_starred,
        t.last_message_at,
        ${selectRank},
        ${selectHighlightSubject},
        ${selectHighlightSnippet}
      FROM threads t
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${limitIndex};
    `;
        const res = await this.db.query(sql, params, userId);
        const items = res.rows.map((r) => ({
            id: r.id,
            accountId: r.account_id,
            subject: r.subject,
            snippet: r.snippet,
            folder: r.folder,
            isUnread: r.is_unread,
            isStarred: r.is_starred,
            lastMessageAt: r.last_message_at.toISOString(),
            highlightedSubject: r.highlighted_subject,
            highlightedSnippet: r.highlighted_snippet,
            score: r.score ? parseFloat(r.score) : undefined,
        }));
        return {
            results: items,
            total: items.length,
        };
    }
    async deleteUserIndices(userId) {
        await this.db.query(`DELETE FROM thread_embeddings WHERE user_id = $1;`, [userId], userId);
        this.logger.log(`Deleted all search embeddings for user ${userId}`);
    }
};
exports.PostgresSearchEngine = PostgresSearchEngine;
exports.PostgresSearchEngine = PostgresSearchEngine = PostgresSearchEngine_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PostgresSearchEngine);
//# sourceMappingURL=postgres-search.engine.js.map