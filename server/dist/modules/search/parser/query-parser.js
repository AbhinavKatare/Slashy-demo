"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryParser = void 0;
class QueryParser {
    static parse(query) {
        const result = {
            freeText: '',
        };
        if (!query || !query.trim()) {
            return result;
        }
        const freeTextParts = [];
        const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        for (const rawToken of tokens) {
            const token = rawToken.trim();
            const lower = token.toLowerCase();
            if (lower.startsWith('from:')) {
                result.from = token.substring(5).replace(/^"|"$/g, '').trim();
            }
            else if (lower.startsWith('to:')) {
                result.to = token.substring(3).replace(/^"|"$/g, '').trim();
            }
            else if (lower === 'has:attachment') {
                result.hasAttachment = true;
            }
            else if (lower === 'is:unread') {
                result.isUnread = true;
            }
            else if (lower === 'is:read') {
                result.isUnread = false;
            }
            else if (lower === 'is:starred') {
                result.isStarred = true;
            }
            else if (lower.startsWith('before:')) {
                const dateStr = token.substring(7).trim();
                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) {
                    result.before = parsed;
                }
            }
            else if (lower.startsWith('after:')) {
                const dateStr = token.substring(6).trim();
                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) {
                    result.after = parsed;
                }
            }
            else if (lower.startsWith('label:')) {
                result.label = token.substring(6).replace(/^"|"$/g, '').trim();
            }
            else if (lower.startsWith('in:')) {
                result.folder = token.substring(3).replace(/^"|"$/g, '').toLowerCase().trim();
            }
            else {
                freeTextParts.push(token.replace(/^"|"$/g, ''));
            }
        }
        result.freeText = freeTextParts.join(' ').trim();
        return result;
    }
}
exports.QueryParser = QueryParser;
//# sourceMappingURL=query-parser.js.map