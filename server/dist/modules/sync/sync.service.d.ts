import { DatabaseService } from '../../database/database.service';
import { OutboxItemDto, PullDeltaQueryDto } from './dto/sync.dto';
export declare class SyncService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    pullDeltas(userId: string, query: PullDeltaQueryDto): Promise<{
        threads: {
            id: any;
            accountId: any;
            subject: any;
            snippet: any;
            isUnread: any;
            isStarred: any;
            folder: any;
            hasAttachments: any;
            messageCount: any;
            lastMessageAt: any;
            updatedAt: any;
        }[];
        deletedThreadIds: any[];
        cursor: any;
        hasMore: boolean;
    }>;
    processOutboxBatch(userId: string, operations: OutboxItemDto[]): Promise<{
        processed: {
            idempotencyKey: string;
            status: string;
            error?: string;
        }[];
    }>;
}
