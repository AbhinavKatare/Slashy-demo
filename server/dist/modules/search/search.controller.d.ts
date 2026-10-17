import { Request } from 'express';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search.dto';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(req: Request, query: SearchQueryDto): Promise<import("./domain/search-engine.interface").SearchResult>;
}
