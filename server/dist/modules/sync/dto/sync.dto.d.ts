export declare class OutboxItemDto {
    idempotencyKey: string;
    accountId: string;
    actionType: string;
    targetId: string;
    payload?: Record<string, any>;
}
export declare class PushOutboxBatchDto {
    operations: OutboxItemDto[];
}
export declare class PullDeltaQueryDto {
    accountId?: string;
    cursor?: string;
}
