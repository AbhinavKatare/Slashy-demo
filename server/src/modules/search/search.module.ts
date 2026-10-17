import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PostgresSearchEngine } from './engines/postgres-search.engine';
import { OpenSearchEngine } from './engines/opensearch.engine';

@Module({
  controllers: [SearchController],
  providers: [SearchService, PostgresSearchEngine, OpenSearchEngine],
  exports: [SearchService, PostgresSearchEngine, OpenSearchEngine],
})
export class SearchModule {}
