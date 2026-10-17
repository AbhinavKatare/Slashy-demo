import { DatabaseService } from '../../../database/database.service';
import { SyncQueueService } from '../queues/sync-queue.service';
import { RedisService } from '../../../common/redis/redis.service';
export declare class WebhookSyncService {
    private readonly db;
    private readonly queueService;
    private readonly redis;
    private readonly logger;
    constructor(db: DatabaseService, queueService: SyncQueueService, redis: RedisService);
    handleGoogleWebhook(body: any): Promise<{
        status: string;
    }>;
    handleMicrosoftWebhook(body: any, validationToken?: string): Promise<{
        status: string;
        validationResponse?: string;
    }>;
    runFallbackPoller(): Promise<{
        queuedAccounts: number;
    }>;
}
