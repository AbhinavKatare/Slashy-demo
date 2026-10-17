export declare class RecipientDto {
    name: string;
    email: string;
}
export declare class ListThreadsQueryDto {
    folder?: string;
    accountId?: string;
    labelId?: string;
    isUnread?: boolean;
    cursor?: string;
    limit?: number;
}
export declare class UpdateThreadDto {
    isStarred?: boolean;
    isUnread?: boolean;
    folder?: string;
}
export declare class SendMessageDto {
    accountId: string;
    to: RecipientDto[];
    cc?: RecipientDto[];
    bcc?: RecipientDto[];
    subject: string;
    bodyPlain: string;
    bodyHtml?: string;
    replyToThreadId?: string;
}
export declare class CreateLabelDto {
    accountId: string;
    name: string;
    colorHex: string;
}
