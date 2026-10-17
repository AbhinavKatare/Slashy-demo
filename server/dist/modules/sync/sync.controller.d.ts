import { Request, Response } from 'express';
import { SyncService } from './sync.service';
import { PullDeltaQueryDto, PushOutboxBatchDto } from './dto/sync.dto';
import { WebhookSyncService } from './webhooks/webhook-sync.service';
import { DatabaseService } from '../../database/database.service';
export declare class SyncController {
    private readonly syncService;
    private readonly webhookService;
    private readonly db;
    constructor(syncService: SyncService, webhookService: WebhookSyncService, db: DatabaseService);
    pull(req: Request, query: PullDeltaQueryDto): Promise<{
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
    push(req: Request, dto: PushOutboxBatchDto): Promise<{
        processed: {
            idempotencyKey: string;
            status: string;
            error?: string;
        }[];
    }>;
    getSyncStatus(req: Request, accountId: string): Promise<{
        accountId: string;
        status: string;
        lastSyncedAt: any;
        cursors: {
            key: any;
            value: any;
            status: any;
        }[];
        stats: {
            threads: number;
            messages: number;
        };
    }>;
    handleGoogleWebhook(body: any): Promise<{
        status: string;
    }>;
    handleMicrosoftHandshake(validationToken: string, res: Response): void;
    handleMicrosoftWebhook(body: any, validationToken?: string): Promise<{
        status: string;
        validationResponse?: string;
    }>;
}
