import {
  NormalizedCalendarEvent,
  NormalizedDeltaPage,
  NormalizedDraft,
  NormalizedMessage,
  NormalizedThread,
} from './normalized-mail.model';

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

/**
 * Unified MailProvider interface implemented by GmailAdapter and GraphAdapter.
 */
export interface MailProvider {
  /**
   * List threads with folder/query filtering and cursor pagination
   */
  listThreads(options: ListThreadsOptions): Promise<{
    threads: NormalizedThread[];
    nextCursor?: string;
  }>;

  /**
   * Fetch thread details and constituent messages
   */
  getThread(threadId: string): Promise<NormalizedThread>;

  /**
   * Fetch a single message by ID
   */
  getMessage(messageId: string): Promise<NormalizedMessage>;

  /**
   * Apply or remove labels, toggle read/unread, star/unstar
   */
  modifyLabels(id: string, options: ModifyLabelsOptions): Promise<void>;

  /**
   * Move thread to Archive
   */
  archive(threadId: string): Promise<void>;

  /**
   * Move thread to Trash
   */
  trash(threadId: string): Promise<void>;

  /**
   * Save a draft
   */
  createDraft(draft: NormalizedDraft): Promise<{ id: string }>;

  /**
   * Update an existing draft
   */
  updateDraft(draftId: string, draft: Partial<NormalizedDraft>): Promise<void>;

  /**
   * Send an email message
   */
  send(message: NormalizedDraft): Promise<{ messageId: string; threadId?: string }>;

  /**
   * Retrieve attachment content buffer
   */
  getAttachment(
    messageId: string,
    attachmentId: string,
  ): Promise<{ filename: string; contentType: string; data: Buffer }>;

  /**
   * List calendar events within a date range
   */
  listEvents(startDate: Date, endDate: Date): Promise<NormalizedCalendarEvent[]>;

  /**
   * Create a new calendar event
   */
  createEvent(event: Omit<NormalizedCalendarEvent, 'id'>): Promise<NormalizedCalendarEvent>;

  /**
   * Update a calendar event
   */
  updateEvent(
    eventId: string,
    event: Partial<NormalizedCalendarEvent>,
  ): Promise<NormalizedCalendarEvent>;

  /**
   * Incremental delta history synchronization using historyId (Gmail) or deltaLink (Graph)
   */
  getDeltaHistory(cursor?: string): Promise<NormalizedDeltaPage>;
}
