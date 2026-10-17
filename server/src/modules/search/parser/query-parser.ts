export interface ParsedSearchQuery {
  from?: string;
  to?: string;
  hasAttachment?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  before?: Date;
  after?: Date;
  label?: string;
  folder?: string;
  freeText: string;
}

export class QueryParser {
  /**
   * Parse user search string with operators into structured search filters.
   * Example: "from:alex@example.com is:unread has:attachment quarterly report before:2026-10-01"
   */
  static parse(query: string): ParsedSearchQuery {
    const result: ParsedSearchQuery = {
      freeText: '',
    };

    if (!query || !query.trim()) {
      return result;
    }

    const freeTextParts: string[] = [];

    // Match operator tokens (e.g. from:foo or is:unread) and quoted strings
    const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

    for (const rawToken of tokens) {
      const token = rawToken.trim();
      const lower = token.toLowerCase();

      if (lower.startsWith('from:')) {
        result.from = token.substring(5).replace(/^"|"$/g, '').trim();
      } else if (lower.startsWith('to:')) {
        result.to = token.substring(3).replace(/^"|"$/g, '').trim();
      } else if (lower === 'has:attachment') {
        result.hasAttachment = true;
      } else if (lower === 'is:unread') {
        result.isUnread = true;
      } else if (lower === 'is:read') {
        result.isUnread = false;
      } else if (lower === 'is:starred') {
        result.isStarred = true;
      } else if (lower.startsWith('before:')) {
        const dateStr = token.substring(7).trim();
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          result.before = parsed;
        }
      } else if (lower.startsWith('after:')) {
        const dateStr = token.substring(6).trim();
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          result.after = parsed;
        }
      } else if (lower.startsWith('label:')) {
        result.label = token.substring(6).replace(/^"|"$/g, '').trim();
      } else if (lower.startsWith('in:')) {
        result.folder = token.substring(3).replace(/^"|"$/g, '').toLowerCase().trim();
      } else {
        freeTextParts.push(token.replace(/^"|"$/g, ''));
      }
    }

    result.freeText = freeTextParts.join(' ').trim();
    return result;
  }
}
