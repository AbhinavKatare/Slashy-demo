import { DatabaseService } from '../../../database/database.service';
import { SearchEngine, SearchOptions, SearchResult } from '../domain/search-engine.interface';
export declare class PostgresSearchEngine implements SearchEngine {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    search(userId: string, rawQuery: string, options?: SearchOptions): Promise<SearchResult>;
    deleteUserIndices(userId: string): Promise<void>;
}
