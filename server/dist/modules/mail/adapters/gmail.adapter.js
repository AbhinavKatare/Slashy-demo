"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailAdapter = void 0;
const resilience_1 = require("./resilience");
const mime_parser_1 = require("./mime-parser");
class GmailAdapter {
    config;
    gmailBase;
    calendarBase;
    constructor(config) {
        this.config = config;
        this.gmailBase = config.gmailBaseUrl || 'https://gmail.googleapis.com/gmail/v1/users/me';
        this.calendarBase =
            config.calendarBaseUrl || 'https://www.googleapis.com/calendar/v3/calendars/primary';
    }
    async request(path, options = {}, isCalendar = false) {
        const baseUrl = isCalendar ? this.calendarBase : this.gmailBase;
        const url = `${baseUrl}${path}`;
        return (0, resilience_1.executeWithRetry)(async () => {
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
                const err = new Error(`Gmail API error ${res.status}: ${errorBody}`);
                err.status = res.status;
                err.retryAfter = res.headers.get('retry-after');
                throw err;
            }
            if (res.status === 204) {
                return {};
            }
            return (await res.json());
        });
    }
    async listThreads(options) {
        const params = new URLSearchParams();
        if (options.limit)
            params.set('maxResults', String(options.limit));
        if (options.cursor)
            params.set('pageToken', options.cursor);
        let q = options.query || '';
        if (options.folder === 'inbox') {
            params.append('labelIds', 'INBOX');
        }
        else if (options.folder === 'starred') {
            params.append('labelIds', 'STARRED');
        }
        else if (options.folder === 'trash') {
            params.append('labelIds', 'TRASH');
        }
        else if (options.folder === 'archive') {
            q = q ? `${q} -in:inbox -in:trash -in:spam` : '-in:inbox -in:trash -in:spam';
        }
        if (q)
            params.set('q', q);
        const queryStr = params.toString() ? `?${params.toString()}` : '';
        const res = await this.request(`/threads${queryStr}`);
        if (!res.threads || !Array.isArray(res.threads)) {
            return { threads: [], nextCursor: undefined };
        }
        const threads = await Promise.all(res.threads.map(async (t) => {
            return this.getThread(t.id);
        }));
        return {
            threads,
            nextCursor: res.nextPageToken || undefined,
        };
    }
    async getThread(threadId) {
        const res = await this.request(`/threads/${threadId}?format=full`);
        const rawMessages = res.messages || [];
        const normalizedMessages = rawMessages.map((m) => this.normalizeGmailMessage(m));
        const firstMsg = normalizedMessages[0];
        const lastMsg = normalizedMessages[normalizedMessages.length - 1];
        const allLabels = new Set();
        rawMessages.forEach((m) => (m.labelIds || []).forEach((l) => allLabels.add(l)));
        const isUnread = allLabels.has('UNREAD');
        const isStarred = allLabels.has('STARRED');
        let folder = 'inbox';
        if (allLabels.has('TRASH'))
            folder = 'trash';
        else if (allLabels.has('SPAM'))
            folder = 'spam';
        else if (!allLabels.has('INBOX'))
            folder = 'archive';
        return {
            id: res.id,
            externalThreadId: res.id,
            subject: firstMsg?.subject || '(No Subject)',
            snippet: res.snippet || lastMsg?.snippet || '',
            isUnread,
            isStarred,
            folder,
            labels: Array.from(allLabels).filter((l) => !['INBOX', 'UNREAD', 'STARRED', 'TRASH', 'SPAM'].includes(l)),
            messageCount: rawMessages.length,
            lastMessageAt: lastMsg?.sentAt || new Date(),
            messages: normalizedMessages,
        };
    }
    async getMessage(messageId) {
        const res = await this.request(`/messages/${messageId}?format=full`);
        return this.normalizeGmailMessage(res);
    }
    async modifyLabels(id, options) {
        const addLabelIds = [...(options.addLabels || [])];
        const removeLabelIds = [...(options.removeLabels || [])];
        if (options.isRead === true)
            removeLabelIds.push('UNREAD');
        if (options.isRead === false)
            addLabelIds.push('UNREAD');
        if (options.isStarred === true)
            addLabelIds.push('STARRED');
        if (options.isStarred === false)
            removeLabelIds.push('STARRED');
        await this.request(`/threads/${id}/modify`, {
            method: 'POST',
            body: JSON.stringify({ addLabelIds, removeLabelIds }),
        });
    }
    async archive(threadId) {
        await this.request(`/threads/${threadId}/modify`, {
            method: 'POST',
            body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
        });
    }
    async trash(threadId) {
        await this.request(`/threads/${threadId}/trash`, {
            method: 'POST',
        });
    }
    async createDraft(draft) {
        const rawRfc2822 = this.buildRfc2822(draft);
        const encoded = Buffer.from(rawRfc2822)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
        const res = await this.request('/drafts', {
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
    async updateDraft(draftId, draft) {
        const rawRfc2822 = this.buildRfc2822(draft);
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
    async send(message) {
        const rawRfc2822 = this.buildRfc2822(message);
        const encoded = Buffer.from(rawRfc2822)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
        const res = await this.request('/messages/send', {
            method: 'POST',
            body: JSON.stringify({
                raw: encoded,
                threadId: message.replyThreadId || undefined,
            }),
        });
        return { messageId: res.id, threadId: res.threadId };
    }
    async getAttachment(messageId, attachmentId) {
        const res = await this.request(`/messages/${messageId}/attachments/${attachmentId}`);
        const normalized = (res.data || '').replace(/-/g, '+').replace(/_/g, '/');
        return {
            filename: 'attachment',
            contentType: 'application/octet-stream',
            data: Buffer.from(normalized, 'base64'),
        };
    }
    async listEvents(startDate, endDate) {
        const params = new URLSearchParams({
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime',
        });
        const res = await this.request(`/events?${params.toString()}`, {}, true);
        return (res.items || []).map((e) => ({
            id: e.id,
            title: e.summary || '(Untitled Event)',
            description: e.description || undefined,
            location: e.location || undefined,
            joinUrl: e.hangoutLink || undefined,
            startTime: new Date(e.start?.dateTime || e.start?.date),
            endTime: new Date(e.end?.dateTime || e.end?.date),
            isAllDay: !e.start?.dateTime,
            attendees: (e.attendees || []).map((a) => a.email),
        }));
    }
    async createEvent(event) {
        const body = {
            summary: event.title,
            description: event.description,
            location: event.location,
            attendees: event.attendees.map((email) => ({ email })),
        };
        if (event.isAllDay) {
            body.start = { date: event.startTime.toISOString().split('T')[0] };
            body.end = { date: event.endTime.toISOString().split('T')[0] };
        }
        else {
            body.start = { dateTime: event.startTime.toISOString() };
            body.end = { dateTime: event.endTime.toISOString() };
        }
        const res = await this.request('/events', {
            method: 'POST',
            body: JSON.stringify(body),
        }, true);
        return {
            id: res.id,
            title: res.summary,
            description: res.description,
            location: res.location,
            joinUrl: res.hangoutLink,
            startTime: new Date(res.start.dateTime || res.start.date),
            endTime: new Date(res.end.dateTime || res.end.date),
            isAllDay: !res.start.dateTime,
            attendees: (res.attendees || []).map((a) => a.email),
        };
    }
    async updateEvent(eventId, event) {
        const body = {};
        if (event.title)
            body.summary = event.title;
        if (event.description)
            body.description = event.description;
        if (event.location)
            body.location = event.location;
        const res = await this.request(`/events/${eventId}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        }, true);
        return {
            id: res.id,
            title: res.summary,
            description: res.description,
            location: res.location,
            joinUrl: res.hangoutLink,
            startTime: new Date(res.start.dateTime || res.start.date),
            endTime: new Date(res.end.dateTime || res.end.date),
            isAllDay: !res.start.dateTime,
            attendees: (res.attendees || []).map((a) => a.email),
        };
    }
    async getDeltaHistory(cursor) {
        if (!cursor) {
            const profile = await this.request('/profile');
            const threadsRes = await this.listThreads({ limit: 50 });
            return {
                threads: threadsRes.threads,
                deletedThreadIds: [],
                nextCursor: profile.historyId || '0',
                hasMore: false,
            };
        }
        const res = await this.request(`/history?startHistoryId=${cursor}`);
        const updatedThreadIds = new Set();
        const deletedThreadIds = [];
        (res.history || []).forEach((h) => {
            (h.messagesAdded || []).forEach((m) => updatedThreadIds.add(m.message.threadId));
            (h.labelsAdded || []).forEach((m) => updatedThreadIds.add(m.message.threadId));
            (h.labelsRemoved || []).forEach((m) => updatedThreadIds.add(m.message.threadId));
            (h.messagesDeleted || []).forEach((m) => {
                if (m.message?.threadId)
                    deletedThreadIds.push(m.message.threadId);
            });
        });
        const threads = await Promise.all(Array.from(updatedThreadIds).map(async (tid) => {
            try {
                return await this.getThread(tid);
            }
            catch (_) {
                return null;
            }
        }));
        return {
            threads: threads.filter((t) => t !== null),
            deletedThreadIds,
            nextCursor: res.historyId || cursor,
            hasMore: !!res.nextPageToken,
        };
    }
    normalizeGmailMessage(m) {
        const headers = {};
        (m.payload?.headers || []).forEach((h) => {
            headers[h.name.toLowerCase()] = h.value;
        });
        const parsedMime = (0, mime_parser_1.parseGmailParts)(m.payload);
        const fromList = (0, mime_parser_1.parseAddressList)(headers['from']);
        const sender = fromList[0] || { name: 'Unknown', email: 'unknown@example.com' };
        const labelIds = m.labelIds || [];
        const internalDate = parseInt(m.internalDate, 10);
        return {
            id: m.id,
            threadId: m.threadId,
            externalMessageId: headers['message-id'],
            sender,
            to: (0, mime_parser_1.parseAddressList)(headers['to']),
            cc: (0, mime_parser_1.parseAddressList)(headers['cc']),
            bcc: (0, mime_parser_1.parseAddressList)(headers['bcc']),
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
    buildRfc2822(draft) {
        const lines = [];
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
exports.GmailAdapter = GmailAdapter;
//# sourceMappingURL=gmail.adapter.js.map