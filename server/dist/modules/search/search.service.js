"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const postgres_search_engine_1 = require("./engines/postgres-search.engine");
const opensearch_engine_1 = require("./engines/opensearch.engine");
let SearchService = SearchService_1 = class SearchService {
    db;
    pgEngine;
    osEngine;
    logger = new common_1.Logger(SearchService_1.name);
    engine;
    constructor(db, pgEngine, osEngine) {
        this.db = db;
        this.pgEngine = pgEngine;
        this.osEngine = osEngine;
        this.engine = process.env.SEARCH_ENGINE === 'opensearch' ? this.osEngine : this.pgEngine;
    }
    async search(userId, dto) {
        const sanitizedQuery = (dto.q || '').trim();
        if (!sanitizedQuery) {
            return { results: [], total: 0 };
        }
        return this.engine.search(userId, sanitizedQuery, {
            accountId: dto.accountId,
            limit: dto.limit || 20,
        });
    }
    async deleteUserEmbeddings(userId) {
        await this.pgEngine.deleteUserIndices(userId);
        return { success: true, message: 'All user search embeddings deleted' };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        postgres_search_engine_1.PostgresSearchEngine,
        opensearch_engine_1.OpenSearchEngine])
], SearchService);
//# sourceMappingURL=search.service.js.map