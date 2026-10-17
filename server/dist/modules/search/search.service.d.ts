import { DatabaseService } from '../../database/database.service';
import { SearchQueryDto } from './dto/search.dto';
import { PostgresSearchEngine } from './engines/postgres-search.engine';
import { OpenSearchEngine } from './engines/opensearch.engine';
export declare class SearchService {
    private readonly db;
    private readonly pgEngine;
    private readonly osEngine;
    private readonly logger;
    private readonly engine;
    constructor(db: DatabaseService, pgEngine: PostgresSearchEngine, osEngine: OpenSearchEngine);
    search(userId: string, dto: SearchQueryDto): Promise<import("./domain/search-engine.interface").SearchResult>;
    deleteUserEmbeddings(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
