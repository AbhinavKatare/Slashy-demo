import { DatabaseService } from '../../database/database.service';
import { CreateLabelDto, ListThreadsQueryDto, SendMessageDto, UpdateThreadDto } from './dto/mail.dto';
export declare class MailService {
    private readonly db;
    constructor(db: DatabaseService);
    listThreads(userId: string, query: ListThreadsQueryDto): Promise<{
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
    getThread(userId: string, threadId: string): Promise<{
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
    updateThread(userId: string, threadId: string, dto: UpdateThreadDto): Promise<any>;
    deleteThread(userId: string, threadId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendMessage(userId: string, dto: SendMessageDto): Promise<{
        messageId: string;
        threadId: string;
        sentAt: string;
        status: string;
    }>;
    listLabels(userId: string, accountId?: string): Promise<any[]>;
    createLabel(userId: string, dto: CreateLabelDto): Promise<any>;
}
