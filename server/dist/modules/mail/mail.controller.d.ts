import { Request } from 'express';
import { MailService } from './mail.service';
import { OutboxWriteService } from './outbox-write.service';
import { CreateLabelDto, ListThreadsQueryDto, SendMessageDto, UpdateThreadDto } from './dto/mail.dto';
import { BulkModifyThreadsDto, ModifyThreadActionDto } from './dto/outbox-write.dto';
export declare class MailController {
    private readonly mailService;
    private readonly outboxWriteService;
    constructor(mailService: MailService, outboxWriteService: OutboxWriteService);
    listThreads(req: Request, query: ListThreadsQueryDto): Promise<{
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
            labels: any;
        }[];
        nextCursor: any;
        totalCount: number;
    }>;
    getThread(req: Request, id: string): Promise<{
        thread: any;
        messages: {
            id: any;
            threadId: any;
            senderName: any;
            senderEmail: any;
            toRecipients: any;
            ccRecipients: any;
            bccRecipients: any;
            isUnread: any;
            sentAt: any;
            bodyPlain: any;
            bodyHtml: any;
        }[];
    }>;
    updateThread(req: Request, id: string, dto: UpdateThreadDto): Promise<any>;
    modifyThread(req: Request, id: string, idempotencyKey: string, dto: ModifyThreadActionDto): Promise<import("./outbox-write.service").OperationResult>;
    bulkModifyThreads(req: Request, idempotencyKey: string, dto: BulkModifyThreadsDto): Promise<{
        idempotencyKey: string;
        action: import("./dto/outbox-write.dto").WriteActionType;
        totalCount: number;
        succeededCount: number;
        failedCount: number;
        items: {
            threadId: string;
            status: "confirmed" | "failed";
            error?: string;
        }[];
    }>;
    getOperationStatus(req: Request, id: string): Promise<{
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
    undoOperation(req: Request, id: string): Promise<{
        undoneOperationId: string;
        inverseResult: import("./outbox-write.service").OperationResult;
        message: string;
    }>;
    deleteThread(req: Request, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendMessage(req: Request, dto: SendMessageDto): Promise<{
        messageId: string;
        threadId: string;
        sentAt: string;
        status: string;
    }>;
    listLabels(req: Request, accountId?: string): Promise<any[]>;
    createLabel(req: Request, dto: CreateLabelDto): Promise<any>;
}
