import { RecipientDto } from '../../mail/dto/mail.dto';
export declare class CreateDraftDto {
    accountId: string;
    replyThreadId?: string;
    replyMessageId?: string;
    toRecipients?: RecipientDto[];
    ccRecipients?: RecipientDto[];
    bccRecipients?: RecipientDto[];
    subject?: string;
    bodyPlain?: string;
    bodyHtml?: string;
    attachmentsMeta?: any[];
}
export declare class UpdateDraftDto extends CreateDraftDto {
}
