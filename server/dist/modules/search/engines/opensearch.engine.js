"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OpenSearchEngine_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenSearchEngine = void 0;
const common_1 = require("@nestjs/common");
const query_parser_1 = require("../parser/query-parser");
let OpenSearchEngine = OpenSearchEngine_1 = class OpenSearchEngine {
    logger = new common_1.Logger(OpenSearchEngine_1.name);
    buildOpenSearchQueryDsl(userId, rawQuery, options = {}) {
        const parsed = query_parser_1.QueryParser.parse(rawQuery);
        const filters = [{ term: { user_id: userId } }];
        if (options.accountId) {
            filters.push({ term: { account_id: options.accountId } });
        }
        if (parsed.folder) {
            filters.push({ term: { folder: parsed.folder } });
        }
        if (parsed.isUnread !== undefined) {
            filters.push({ term: { is_unread: parsed.isUnread } });
        }
        if (parsed.isStarred) {
            filters.push({ term: { is_starred: true } });
        }
        if (parsed.before || parsed.after) {
            const range = {};
            if (parsed.before)
                range.lte = parsed.before.toISOString();
            if (parsed.after)
                range.gte = parsed.after.toISOString();
            filters.push({ range: { last_message_at: range } });
        }
        if (parsed.hasAttachment) {
            filters.push({ term: { has_attachments: true } });
        }
        if (parsed.from) {
            filters.push({
                multi_match: {
                    query: parsed.from,
                    fields: ['sender.name', 'sender.email'],
                },
            });
        }
        const must = [];
        if (parsed.freeText) {
            must.push({
                multi_match: {
                    query: parsed.freeText,
                    fields: ['subject^3', 'snippet^2', 'body^1'],
                    fuzziness: 'AUTO',
                },
            });
        }
        else {
            must.push({ match_all: {} });
        }
        return {
            size: options.limit || 20,
            query: {
                bool: {
                    must,
                    filter: filters,
                },
            },
            highlight: {
                fields: {
                    subject: { pre_tags: ['<b>'], post_tags: ['</b>'] },
                    snippet: { pre_tags: ['<b>'], post_tags: ['</b>'] },
                },
            },
            sort: [{ _score: { order: 'desc' } }, { last_message_at: { order: 'desc' } }],
        };
    }
    async search(userId, query, options = {}) {
        const dsl = this.buildOpenSearchQueryDsl(userId, query, options);
        this.logger.debug(`OpenSearch Query DSL generated: ${JSON.stringify(dsl)}`);
        const mockResults = [];
        return {
            results: mockResults,
            total: mockResults.length,
        };
    }
    async deleteUserIndices(userId) {
        this.logger.log(`OpenSearch delete_by_query triggered for user ${userId}`);
    }
};
exports.OpenSearchEngine = OpenSearchEngine;
exports.OpenSearchEngine = OpenSearchEngine = OpenSearchEngine_1 = __decorate([
    (0, common_1.Injectable)()
], OpenSearchEngine);
//# sourceMappingURL=opensearch.engine.js.map