import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../../../common/redis/redis.service';
export interface SyncJobData {
    accountId: string;
    userId: string;
    provider: 'google' | 'microsoft';
    jobType: 'backfill' | 'incremental' | 'webhook';
    cursor?: string;
    windowDays?: number;
    maxThreads?: number;
}
export declare class SyncQueueService implements OnModuleInit, OnModuleDestroy {
    private readonly redisService;
    private readonly logger;
    backfillQueue: Queue<SyncJobData> | null;
    incrementalQueue: Queue<SyncJobData> | null;
    dlqQueue: Queue<SyncJobData> | null;
    private readonly memoryJobs;
    constructor(redisService: RedisService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    enqueueBackfill(data: SyncJobData): Promise<string>;
    enqueueIncremental(data: SyncJobData): Promise<string>;
    sendToDlq(data: SyncJobData, errorReason: string): Promise<void>;
    getMemoryJobs(): SyncJobData[];
}
