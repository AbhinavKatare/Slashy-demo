import {
  ListThreadsOptions,
  MailProvider,
  ModifyLabelsOptions,
} from '../domain/mail-provider.interface';
import {
  NormalizedCalendarEvent,
  NormalizedDeltaPage,
  NormalizedDraft,
  NormalizedMessage,
  NormalizedThread,
} from '../domain/normalized-mail.model';
import { executeWithRetry } from './resilience';
import { parseAddressList, parseGmailParts } from './mime-parser';

export interface GmailAdapterConfig {
  accessToken: string;
  gmailBaseUrl?: string;
  calendarBaseUrl?: string;
}

export class GmailAdapter implements MailProvider {
  private readonly gmailBase: string;
  private readonly calendarBase: string;

  constructor(private readonly config: GmailAdapterConfig) {
    this.gmailBase = config.gmailBaseUrl || 'https://gmail.googleapis.com/gmail/v1/users/me';
    this.calendarBase =
      config.calendarBaseUrl || 'https://www.googleapis.com/calendar/v3/calendars/primary';
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    isCalendar = false,
  ): Promise<T> {
    const baseUrl = isCalendar ? this.calendarBase : this.gmailBase;
    const url = `${baseUrl}${path}`;

    return executeWithRetry(async () => {
      const res = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });

      if (!res.ok) {
        const errorBody = await res.text();
        const err: any = new Error(`Gmail API error ${res.status}: ${errorBody}`);
        err.status = res.status;
        err.retryAfter = res.headers.get('retry-after');
        throw err;
      }

      if (res.status === 204) {
        return {} as T;
      }

      return (await res.json()) as T;
    });
  }

  async listThreads(
    options: ListThreadsOptions,
  ): Promise<{ threads: NormalizedThread[]; nextCursor?: string }> {
    const params = new URLSearchParams();
    if (options.limit) params.set('maxResults', String(options.limit));
    if (options.cursor) params.set('pageToken', options.cursor);

    let q = options.query || '';
    if (options.folder === 'inbox') {
      params.append('labelIds', 'INBOX');
    } else if (options.folder === 'starred') {
      params.append('labelIds', 'STARRED');
    } else if (options.folder === 'trash') {
      params.append('labelIds', 'TRASH');
    } else if (options.folder === 'archive') {
      q = q ? `${q} -in:inbox -in:trash -in:spam` : '-in:inbox -in:trash -in:spam';
    }

    if (q) params.set('q', q);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request<any>(`/threads${queryStr}`);

    if (!res.threads || !Array.isArray(res.threads)) {
      return { threads: [], nextCursor: undefined };
    }

    // Detail fetch for thread metadata
    const threads = await Promise.all(
      res.threads.map(async (t: any) => {
        return this.getThread(t.id);
      }),
    );

    return {
      threads,
      nextCursor: res.nextPageToken || undefined,
    };
  }

  async getThread(threadId: string): Promise<NormalizedThread> {
    const res = await this.request<any>(`/threads/${threadId}?format=full`);

    const rawMessages = res.messages || [];
    const normalizedMessages: NormalizedMessage[] = rawMessages.map((m: any) =>
      this.normalizeGmailMessage(m),
    );

    const firstMsg = normalizedMessages[0];
    const lastMsg = normalizedMessages[normalizedMessages.length - 1];

    // Inspect labels across messages
    const allLabels = new Set<string>();
    rawMessages.forEach((m: any) => (m.labelIds || []).forEach((l: string) => allLabels.add(l)));

    const isUnread = allLabels.has('UNREAD');
    const isStarred = allLabels.has('STARRED');
    let folder = 'inbox';
    if (allLabels.has('TRASH')) folder = 'trash';
    else if (allLabels.has('SPAM')) folder = 'spam';
    else if (!allLabels.has('INBOX')) folder = 'archive';

    return {
      id: res.id,
      externalThreadId: res.id,
      subject: firstMsg?.subject || '(No Subject)',
      snippet: res.snippet || lastMsg?.snippet || '',
      isUnread,
      isStarred,
      folder,
      labels: Array.from(allLabels).filter(
        (l) => !['INBOX', 'UNREAD', 'STARRED', 'TRASH', 'SPAM'].includes(l),
      ),
      messageCount: rawMessages.length,
      lastMessageAt: lastMsg?.sentAt || new Date(),
      messages: normalizedMessages,
    };
  }

  async getMessage(messageId: string): Promise<NormalizedMessage> {
    const res = await this.request<any>(`/messages/${messageId}?format=full`);
    return this.normalizeGmailMessage(res);
  }

  async modifyLabels(id: string, options: ModifyLabelsOptions): Promise<void> {
    const addLabelIds: string[] = [...(options.addLabels || [])];
    const removeLabelIds: string[] = [...(options.removeLabels || [])];

    if (options.isRead === true) removeLabelIds.push('UNREAD');
    if (options.isRead === false) addLabelIds.push('UNREAD');

    if (options.isStarred === true) addLabelIds.push('STARRED');
    if (options.isStarred === false) removeLabelIds.push('STARRED');

    await this.request(`/threads/${id}/modify`, {
      method: 'POST',
      body: JSON.stringify({ addLabelIds, removeLabelIds }),
    });
  }

  async archive(threadId: string): Promise<void> {
    await this.request(`/threads/${threadId}/modify`, {
      method: 'POST',
      body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
    });
  }

  async trash(threadId: string): Promise<void> {
    await this.request(`/threads/${threadId}/trash`, {
      method: 'POST',
    });
  }

  async createDraft(draft: NormalizedDraft): Promise<{ id: string }> {
    const rawRfc2822 = this.buildRfc2822(draft);
    const encoded = Buffer.from(rawRfc2822)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const res = await this.request<any>('/drafts', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          raw: encoded,
          threadId: draft.replyThreadId || undefined,
        },
      }),
    });

    return { id: res.id };
  }

  async updateDraft(draftId: string, draft: Partial<NormalizedDraft>): Promise<void> {
    const rawRfc2822 = this.buildRfc2822(draft as NormalizedDraft);
    const encoded = Buffer.from(rawRfc2822)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    await this.request(`/drafts/${draftId}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: { raw: encoded },
      }),
    });
  }

  async send(message: NormalizedDraft): Promise<{ messageId: string; threadId?: string }> {
    const rawRfc2822 = this.buildRfc2822(message);
    const encoded = Buffer.from(rawRfc2822)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const res = await this.request<any>('/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        raw: encoded,
        threadId: message.replyThreadId || undefined,
      }),
    });

    return { messageId: res.id, threadId: res.threadId };
  }

  async getAttachment(
    messageId: string,
    attachmentId: string,
  ): Promise<{ filename: string; contentType: string; data: Buffer }> {
    const res = await this.request<any>(`/messages/${messageId}/attachments/${attachmentId}`);
    const normalized = (res.data || '').replace(/-/g, '+').replace(/_/g, '/');
    return {
      filename: 'attachment',
      contentType: 'application/octet-stream',
      data: Buffer.from(normalized, 'base64'),
    };
  }

  async listEvents(startDate: Date, endDate: Date): Promise<NormalizedCalendarEvent[]> {
    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const res = await this.request<any>(`/events?${params.toString()}`, {}, true);

    return (res.items || []).map((e: any) => ({
      id: e.id,
      title: e.summary || '(Untitled Event)',
      description: e.description || undefined,
      location: e.location || undefined,
      joinUrl: e.hangoutLink || undefined,
      startTime: new Date(e.start?.dateTime || e.start?.date),
      endTime: new Date(e.end?.dateTime || e.end?.date),
      isAllDay: !e.start?.dateTime,
      attendees: (e.attendees || []).map((a: any) => a.email),
    }));
  }

  async createEvent(event: Omit<NormalizedCalendarEvent, 'id'>): Promise<NormalizedCalendarEvent> {
    const body: any = {
      summary: event.title,
      description: event.description,
      location: event.location,
      attendees: event.attendees.map((email) => ({ email })),
    };

    if (event.isAllDay) {
      body.start = { date: event.startTime.toISOString().split('T')[0] };
      body.end = { date: event.endTime.toISOString().split('T')[0] };
    } else {
      body.start = { dateTime: event.startTime.toISOString() };
      body.end = { dateTime: event.endTime.toISOString() };
    }

    const res = await this.request<any>(
      '/events',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      true,
    );

    return {
      id: res.id,
      title: res.summary,
      description: res.description,
      location: res.location,
      joinUrl: res.hangoutLink,
      startTime: new Date(res.start.dateTime || res.start.date),
      endTime: new Date(res.end.dateTime || res.end.date),
      isAllDay: !res.start.dateTime,
      attendees: (res.attendees || []).map((a: any) => a.email),
    };
  }

  async updateEvent(
    eventId: string,
    event: Partial<NormalizedCalendarEvent>,
  ): Promise<NormalizedCalendarEvent> {
    const body: any = {};
    if (event.title) body.summary = event.title;
    if (event.description) body.description = event.description;
    if (event.location) body.location = event.location;

    const res = await this.request<any>(
      `/events/${eventId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
      true,
    );

    return {
      id: res.id,
      title: res.summary,
      description: res.description,
      location: res.location,
      joinUrl: res.hangoutLink,
      startTime: new Date(res.start.dateTime || res.start.date),
      endTime: new Date(res.end.dateTime || res.end.date),
      isAllDay: !res.start.dateTime,
      attendees: (res.attendees || []).map((a: any) => a.email),
    };
  }

  async getDeltaHistory(cursor?: string): Promise<NormalizedDeltaPage> {
    if (!cursor) {
      // If no cursor provided, fetch current mailbox profile historyId
      const profile = await this.request<any>('/profile');
      const threadsRes = await this.listThreads({ limit: 50 });
      return {
        threads: threadsRes.threads,
        deletedThreadIds: [],
        nextCursor: profile.historyId || '0',
        hasMore: false,
      };
    }

    const res = await this.request<any>(`/history?startHistoryId=${cursor}`);
    const updatedThreadIds = new Set<string>();
    const deletedThreadIds: string[] = [];

    (res.history || []).forEach((h: any) => {
      (h.messagesAdded || []).forEach((m: any) => updatedThreadIds.add(m.message.threadId));
      (h.labelsAdded || []).forEach((m: any) => updatedThreadIds.add(m.message.threadId));
      (h.labelsRemoved || []).forEach((m: any) => updatedThreadIds.add(m.message.threadId));
      (h.messagesDeleted || []).forEach((m: any) => {
        if (m.message?.threadId) deletedThreadIds.push(m.message.threadId);
      });
    });

    const threads = await Promise.all(
      Array.from(updatedThreadIds).map(async (tid) => {
        try {
          return await this.getThread(tid);
        } catch (_) {
          return null;
        }
      }),
    );

    return {
      threads: threads.filter((t): t is NormalizedThread => t !== null),
      deletedThreadIds,
      nextCursor: res.historyId || cursor,
      hasMore: !!res.nextPageToken,
    };
  }

  private normalizeGmailMessage(m: any): NormalizedMessage {
    const headers: Record<string, string> = {};
    (m.payload?.headers || []).forEach((h: any) => {
      headers[h.name.toLowerCase()] = h.value;
    });

    const parsedMime = parseGmailParts(m.payload);
    const fromList = parseAddressList(headers['from']);
    const sender = fromList[0] || { name: 'Unknown', email: 'unknown@example.com' };

    const labelIds = m.labelIds || [];
    const internalDate = parseInt(m.internalDate, 10);

    return {
      id: m.id,
      threadId: m.threadId,
      externalMessageId: headers['message-id'],
      sender,
      to: parseAddressList(headers['to']),
      cc: parseAddressList(headers['cc']),
      bcc: parseAddressList(headers['bcc']),
      subject: headers['subject'] || '(No Subject)',
      snippet: m.snippet || '',
      bodyPlain: parsedMime.bodyPlain,
      bodyHtml: parsedMime.bodyHtml,
      isUnread: labelIds.includes('UNREAD'),
      sentAt: isNaN(internalDate) ? new Date() : new Date(internalDate),
      attachments: parsedMime.attachments,
      rawHeaders: headers,
    };
  }

  private buildRfc2822(draft: NormalizedDraft): string {
    const lines: string[] = [];
    if (draft.to && draft.to.length > 0) {
      lines.push(`To: ${draft.to.map((r) => `"${r.name}" <${r.email}>`).join(', ')}`);
    }
    if (draft.cc && draft.cc.length > 0) {
      lines.push(`Cc: ${draft.cc.map((r) => `"${r.name}" <${r.email}>`).join(', ')}`);
    }
    lines.push(`Subject: ${draft.subject || ''}`);
    lines.push('MIME-Version: 1.0');
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('');
    lines.push(draft.bodyPlain || '');

    return lines.join('\r\n');
  }
}
