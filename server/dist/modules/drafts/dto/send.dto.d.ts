export declare class SendDraftDto {
    draftId: string;
    payloadHash: string;
    undoWindowSeconds?: number;
    scheduledAt?: string;
    timezone?: string;
    followUpIfNoReplyDays?: number;
    reminderAt?: string;
}
export declare class CancelSendDto {
    sendId: string;
}
export declare class UploadAttachmentDto {
    filename: string;
    contentType: string;
    base64Data: string;
}
