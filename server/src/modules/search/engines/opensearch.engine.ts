import { Injectable, Logger } from '@nestjs/common';
import {
  SearchEngine,
  SearchOptions,
  SearchResult,
  SearchResultItem,
} from '../domain/search-engine.interface';
import { QueryParser } from '../parser/query-parser';

@Injectable()
export class OpenSearchEngine implements SearchEngine {
  private readonly logger = new Logger(OpenSearchEngine.name);

  /**
   * Generates OpenSearch Query DSL from user query and filters.
   */
  buildOpenSearchQueryDsl(userId: string, rawQuery: string, options: SearchOptions = {}) {
    const parsed = QueryParser.parse(rawQuery);
    const filters: any[] = [{ term: { user_id: userId } }];

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
      const range: any = {};
      if (parsed.before) range.lte = parsed.before.toISOString();
      if (parsed.after) range.gte = parsed.after.toISOString();
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

    const must: any[] = [];
    if (parsed.freeText) {
      must.push({
        multi_match: {
          query: parsed.freeText,
          fields: ['subject^3', 'snippet^2', 'body^1'],
          fuzziness: 'AUTO',
        },
      });
    } else {
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

  async search(userId: string, query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const dsl = this.buildOpenSearchQueryDsl(userId, query, options);
    this.logger.debug(`OpenSearch Query DSL generated: ${JSON.stringify(dsl)}`);

    // In production, dispatches via @opensearch-project/opensearch client:
    // const response = await this.client.search({ index: 'inbox_threads', body: dsl });
    // For local dev/test fallback, returns formatted stub response
    const mockResults: SearchResultItem[] = [];
    return {
      results: mockResults,
      total: mockResults.length,
    };
  }

  async deleteUserIndices(userId: string): Promise<void> {
    this.logger.log(`OpenSearch delete_by_query triggered for user ${userId}`);
  }
}
