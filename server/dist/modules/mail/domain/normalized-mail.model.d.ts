export interface NormalizedRecipient {
    name: string;
    email: string;
}
export interface NormalizedAttachment {
    id: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
    dataBase64?: string;
}
export interface NormalizedMessage {
    id: string;
    threadId: string;
    externalMessageId?: string;
    sender: NormalizedRecipient;
    to: NormalizedRecipient[];
    cc: NormalizedRecipient[];
    bcc: NormalizedRecipient[];
    subject: string;
    snippet: string;
    bodyPlain: string;
    bodyHtml: string;
    isUnread: boolean;
    sentAt: Date;
    attachments: NormalizedAttachment[];
    rawHeaders?: Record<string, string>;
}
export interface NormalizedThread {
    id: string;
    externalThreadId: string;
    subject: string;
    snippet: string;
    isUnread: boolean;
    isStarred: boolean;
    folder: string;
    labels: string[];
    messageCount: number;
    lastMessageAt: Date;
    messages?: NormalizedMessage[];
}
export interface NormalizedDraft {
    id?: string;
    replyThreadId?: string;
    replyMessageId?: string;
    to: NormalizedRecipient[];
    cc?: NormalizedRecipient[];
    bcc?: NormalizedRecipient[];
    subject: string;
    bodyPlain: string;
    bodyHtml?: string;
    attachments?: NormalizedAttachment[];
}
export interface NormalizedCalendarEvent {
    id: string;
    title: string;
    description?: string;
    location?: string;
    joinUrl?: string;
    startTime: Date;
    endTime: Date;
    isAllDay: boolean;
    attendees: string[];
}
export interface NormalizedDeltaPage {
    threads: NormalizedThread[];
    deletedThreadIds: string[];
    nextCursor: string;
    hasMore: boolean;
}
