import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { SearchQueryDto } from './dto/search.dto';
import { PostgresSearchEngine } from './engines/postgres-search.engine';
import { OpenSearchEngine } from './engines/opensearch.engine';
import { SearchEngine } from './domain/search-engine.interface';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly engine: SearchEngine;

  constructor(
    private readonly db: DatabaseService,
    private readonly pgEngine: PostgresSearchEngine,
    private readonly osEngine: OpenSearchEngine,
  ) {
    // Defaults to Postgres weighted FTS, configurable to OpenSearch via env
    this.engine = process.env.SEARCH_ENGINE === 'opensearch' ? this.osEngine : this.pgEngine;
  }

  async search(userId: string, dto: SearchQueryDto) {
    const sanitizedQuery = (dto.q || '').trim();
    if (!sanitizedQuery) {
      return { results: [], total: 0 };
    }

    return this.engine.search(userId, sanitizedQuery, {
      accountId: dto.accountId,
      limit: dto.limit || 20,
    });
  }

  /**
   * Delete all vector embeddings for a user (GDPR compliance / AI opt-out path).
   */
  async deleteUserEmbeddings(userId: string): Promise<{ success: boolean; message: string }> {
    await this.pgEngine.deleteUserIndices(userId);
    return { success: true, message: 'All user search embeddings deleted' };
  }
}
