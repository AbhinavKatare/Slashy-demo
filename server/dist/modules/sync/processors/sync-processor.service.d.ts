import { DatabaseService } from '../../../database/database.service';
import { MailProviderFactory } from '../../mail/adapters/mail-provider.factory';
import { SyncJobData, SyncQueueService } from '../queues/sync-queue.service';
import { NormalizedThread } from '../../mail/domain/normalized-mail.model';
export declare class SyncProcessorService {
    private readonly db;
    private readonly providerFactory;
    private readonly queueService;
    private readonly logger;
    constructor(db: DatabaseService, providerFactory: MailProviderFactory, queueService: SyncQueueService);
    processBackfill(data: SyncJobData): Promise<{
        syncedCount: number;
        nextCursor?: string;
    }>;
    processIncremental(data: SyncJobData): Promise<{
        updatedCount: number;
        nextCursor: string;
    }>;
    persistThreads(userId: string, accountId: string, threads: NormalizedThread[]): Promise<void>;
    private updateSyncCursorStatus;
}
