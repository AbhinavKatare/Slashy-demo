import { DatabaseService } from '../../database/database.service';
import { MailProviderFactory } from './adapters/mail-provider.factory';
import { BulkModifyThreadsDto, ModifyThreadActionDto, WriteActionType } from './dto/outbox-write.dto';
export interface OperationResult {
    operationId: string;
    idempotencyKey: string;
    targetId: string;
    action: WriteActionType;
    status: 'confirmed' | 'failed' | 'pending';
    inverseAction: string;
    eTag?: string;
    errorMessage?: string;
    confirmedAt?: string;
}
export declare class OutboxWriteService {
    private readonly db;
    private readonly providerFactory;
    private readonly logger;
    constructor(db: DatabaseService, providerFactory: MailProviderFactory);
    getInverseAction(action: WriteActionType): string;
    executeWrite(userId: string, threadId: string, idempotencyKey: string, dto: ModifyThreadActionDto): Promise<OperationResult>;
    executeBulkWrite(userId: string, idempotencyKey: string, dto: BulkModifyThreadsDto): Promise<{
        idempotencyKey: string;
        action: WriteActionType;
        totalCount: number;
        succeededCount: number;
        failedCount: number;
        items: {
            threadId: string;
            status: "confirmed" | "failed";
            error?: string;
        }[];
    }>;
    getOperationStatus(userId: string, operationId: string): Promise<{
        operationId: any;
        idempotencyKey: any;
        targetId: any;
        action: any;
        status: any;
        errorMessage: any;
        inverseAction: any;
        createdAt: any;
        updatedAt: any;
    }>;
    undoOperation(userId: string, operationId: string): Promise<{
        undoneOperationId: string;
        inverseResult: OperationResult;
        message: string;
    }>;
}
