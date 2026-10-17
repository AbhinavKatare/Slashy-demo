import { NormalizedCalendarEvent, NormalizedDeltaPage, NormalizedDraft, NormalizedMessage, NormalizedThread } from './normalized-mail.model';
export interface ListThreadsOptions {
    folder?: string;
    query?: string;
    cursor?: string;
    limit?: number;
}
export interface ModifyLabelsOptions {
    addLabels?: string[];
    removeLabels?: string[];
    isRead?: boolean;
    isStarred?: boolean;
}
export interface MailProvider {
    listThreads(options: ListThreadsOptions): Promise<{
        threads: NormalizedThread[];
        nextCursor?: string;
    }>;
    getThread(threadId: string): Promise<NormalizedThread>;
    getMessage(messageId: string): Promise<NormalizedMessage>;
    modifyLabels(id: string, options: ModifyLabelsOptions): Promise<void>;
    archive(threadId: string): Promise<void>;
    trash(threadId: string): Promise<void>;
    createDraft(draft: NormalizedDraft): Promise<{
        id: string;
    }>;
    updateDraft(draftId: string, draft: Partial<NormalizedDraft>): Promise<void>;
    send(message: NormalizedDraft): Promise<{
        messageId: string;
        threadId?: string;
    }>;
    getAttachment(messageId: string, attachmentId: string): Promise<{
        filename: string;
        contentType: string;
        data: Buffer;
    }>;
    listEvents(startDate: Date, endDate: Date): Promise<NormalizedCalendarEvent[]>;
    createEvent(event: Omit<NormalizedCalendarEvent, 'id'>): Promise<NormalizedCalendarEvent>;
    updateEvent(eventId: string, event: Partial<NormalizedCalendarEvent>): Promise<NormalizedCalendarEvent>;
    getDeltaHistory(cursor?: string): Promise<NormalizedDeltaPage>;
}
