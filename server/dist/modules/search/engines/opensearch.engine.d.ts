import { SearchEngine, SearchOptions, SearchResult } from '../domain/search-engine.interface';
export declare class OpenSearchEngine implements SearchEngine {
    private readonly logger;
    buildOpenSearchQueryDsl(userId: string, rawQuery: string, options?: SearchOptions): {
        size: number;
        query: {
            bool: {
                must: any[];
                filter: any[];
            };
        };
        highlight: {
            fields: {
                subject: {
                    pre_tags: string[];
                    post_tags: string[];
                };
                snippet: {
                    pre_tags: string[];
                    post_tags: string[];
                };
            };
        };
        sort: ({
            _score: {
                order: string;
            };
            last_message_at?: undefined;
        } | {
            last_message_at: {
                order: string;
            };
            _score?: undefined;
        })[];
    };
    search(userId: string, query: string, options?: SearchOptions): Promise<SearchResult>;
    deleteUserIndices(userId: string): Promise<void>;
}
