import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private pool;
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    getPool(): Pool;
    query<T extends QueryResultRow = any>(text: string, params?: any[], userId?: string): Promise<QueryResult<T>>;
    transaction<T>(fn: (client: PoolClient) => Promise<T>, userId?: string): Promise<T>;
    runMigrations(): Promise<void>;
}
