import { Request } from 'express';
import { DraftsService } from './drafts.service';
import { SendingService } from './sending.service';
import { CreateDraftDto, UpdateDraftDto } from './dto/drafts.dto';
import { SendDraftDto, UploadAttachmentDto } from './dto/send.dto';
export declare class DraftsController {
    private readonly draftsService;
    private readonly sendingService;
    constructor(draftsService: DraftsService, sendingService: SendingService);
    listDrafts(req: Request, accountId?: string): Promise<{
        id: any;
        accountId: any;
        replyThreadId: any;
        replyMessageId: any;
        toRecipients: any;
        ccRecipients: any;
        bccRecipients: any;
        subject: any;
        bodyPlain: any;
        bodyHtml: any;
        attachmentsMeta: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    getDraft(req: Request, id: string): Promise<{
        id: any;
        accountId: any;
        replyThreadId: any;
        replyMessageId: any;
        toRecipients: any;
        ccRecipients: any;
        bccRecipients: any;
        subject: any;
        bodyPlain: any;
        bodyHtml: any;
        attachmentsMeta: any;
        createdAt: any;
        updatedAt: any;
    }>;
    createDraft(req: Request, dto: CreateDraftDto): Promise<any>;
    updateDraft(req: Request, id: string, dto: UpdateDraftDto): Promise<any>;
    deleteDraft(req: Request, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendDraft(req: Request, id: string, dto: SendDraftDto, idempotencyKey?: string): Promise<{
        sendId: string;
        status: string;
        providerMessageId?: undefined;
        threadId?: undefined;
        sentAt?: undefined;
    } | {
        sendId: string;
        status: string;
        providerMessageId: string;
        threadId: string | undefined;
        sentAt: string;
    } | {
        sendId: any;
        status: any;
        message: string;
        scheduledAt?: undefined;
        timezone?: undefined;
        undoWindowSeconds?: undefined;
        dispatchAt?: undefined;
    } | {
        sendId: string;
        status: string;
        scheduledAt: string;
        timezone: string;
        message?: undefined;
        undoWindowSeconds?: undefined;
        dispatchAt?: undefined;
    } | {
        sendId: string;
        status: string;
        undoWindowSeconds: number;
        dispatchAt: string;
        message?: undefined;
        scheduledAt?: undefined;
        timezone?: undefined;
    }>;
    cancelSend(req: Request, sendId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadAttachment(req: Request, dto: UploadAttachmentDto): Promise<{
        id: string;
        filename: string;
        contentType: string;
        sizeBytes: number;
        storagePath: string;
        uploadedAt: string;
    }>;
}
