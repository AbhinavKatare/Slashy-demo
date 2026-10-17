import { DatabaseService } from '../../database/database.service';
import { CreateDraftDto, UpdateDraftDto } from './dto/drafts.dto';
export declare class DraftsService {
    private readonly db;
    constructor(db: DatabaseService);
    listDrafts(userId: string, accountId?: string): Promise<{
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
    getDraft(userId: string, draftId: string): Promise<{
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
    createDraft(userId: string, dto: CreateDraftDto): Promise<any>;
    updateDraft(userId: string, draftId: string, dto: UpdateDraftDto): Promise<any>;
    deleteDraft(userId: string, draftId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
