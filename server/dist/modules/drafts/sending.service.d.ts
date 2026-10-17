import { OnModuleDestroy } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { MailProviderFactory } from '../mail/adapters/mail-provider.factory';
import { ClamAvScannerService } from '../../common/security/clamav-scanner.service';
import { SendDraftDto, UploadAttachmentDto } from './dto/send.dto';
export declare class SendingService implements OnModuleDestroy {
    private readonly db;
    private readonly providerFactory;
    private readonly malwareScanner;
    private readonly logger;
    private readonly activeUndoTimers;
    onModuleDestroy(): void;
    constructor(db: DatabaseService, providerFactory: MailProviderFactory, malwareScanner: ClamAvScannerService);
    computeDraftHash(draft: {
        account_id: string;
        to_recipients: any;
        cc_recipients: any;
        bcc_recipients: any;
        subject: string;
        body_plain: string;
        body_html: string;
        attachments_meta: any;
    }): string;
    sendDraft(userId: string, dto: SendDraftDto, idempotencyKey?: string): Promise<{
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
    cancelSend(userId: string, sendId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    dispatchSend(userId: string, sendId: string): Promise<{
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
    }>;
    uploadAttachment(userId: string, dto: UploadAttachmentDto): Promise<{
        id: string;
        filename: string;
        contentType: string;
        sizeBytes: number;
        storagePath: string;
        uploadedAt: string;
    }>;
    evaluateFollowUpReminders(userId: string): Promise<{
        evaluated: number;
        triggered: number;
    }>;
}
