"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphAdapter = void 0;
const resilience_1 = require("./resilience");
class GraphAdapter {
    config;
    graphBase;
    constructor(config) {
        this.config = config;
        this.graphBase = config.graphBaseUrl || 'https://graph.microsoft.com/v1.0/me';
    }
    async request(path, options = {}) {
        const url = path.startsWith('http') ? path : `${this.graphBase}${path}`;
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
                const err = new Error(`Microsoft Graph API error ${res.status}: ${errorBody}`);
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
        const limit = options.limit || 25;
        let folderPath = '/mailFolders/inbox/messages';
        if (options.folder === 'archive') {
            folderPath = '/mailFolders/archive/messages';
        }
        else if (options.folder === 'trash') {
            folderPath = '/mailFolders/deleteditems/messages';
        }
        const params = new URLSearchParams();
        params.set('$top', String(limit));
        params.set('$select', 'id,conversationId,subject,bodyPreview,body,isRead,flag,categories,from,toRecipients,ccRecipients,hasAttachments,receivedDateTime');
        params.set('$orderby', 'receivedDateTime desc');
        if (options.query) {
            params.set('$search', `"${options.query}"`);
        }
        if (options.cursor) {
            params.set('$skiptoken', options.cursor);
        }
        const res = await this.request(`${folderPath}?${params.toString()}`);
        const messages = res.value || [];
        const threadMap = new Map();
        for (const msg of messages) {
            const convId = msg.conversationId || msg.id;
            if (!threadMap.has(convId))
                threadMap.set(convId, []);
            threadMap.get(convId).push(msg);
        }
        const threads = [];
        for (const [convId, msgs] of threadMap.entries()) {
            const latest = msgs[0];
            const isStarred = msgs.some((m) => m.flag?.flagStatus === 'flagged');
            const isUnread = msgs.some((m) => !m.isRead);
            const allCategories = new Set();
            msgs.forEach((m) => (m.categories || []).forEach((c) => allCategories.add(c)));
            threads.push({
                id: convId,
                externalThreadId: convId,
                subject: latest.subject || '(No Subject)',
                snippet: latest.bodyPreview || '',
                isUnread,
                isStarred,
                folder: options.folder || 'inbox',
                labels: Array.from(allCategories),
                messageCount: msgs.length,
                lastMessageAt: new Date(latest.receivedDateTime || Date.now()),
                messages: msgs.map((m) => this.normalizeGraphMessage(m)),
            });
        }
        let nextCursor;
        if (res['@odata.nextLink']) {
            const nextUrl = new URL(res['@odata.nextLink']);
            nextCursor = nextUrl.searchParams.get('$skiptoken') || undefined;
        }
        return { threads, nextCursor };
    }
    async getThread(threadId) {
        const res = await this.request(`/messages?$filter=conversationId eq '${threadId}'&$expand=attachments&$orderby=receivedDateTime asc`);
        const msgs = res.value || [];
        const normalizedMsgs = msgs.map((m) => this.normalizeGraphMessage(m));
        const latest = normalizedMsgs[normalizedMsgs.length - 1];
        const isStarred = msgs.some((m) => m.flag?.flagStatus === 'flagged');
        const isUnread = msgs.some((m) => !m.isRead);
        const allCategories = new Set();
        msgs.forEach((m) => (m.categories || []).forEach((c) => allCategories.add(c)));
        return {
            id: threadId,
            externalThreadId: threadId,
            subject: normalizedMsgs[0]?.subject || '(No Subject)',
            snippet: latest?.snippet || '',
            isUnread,
            isStarred,
            folder: 'inbox',
            labels: Array.from(allCategories),
            messageCount: normalizedMsgs.length,
            lastMessageAt: latest?.sentAt || new Date(),
            messages: normalizedMsgs,
        };
    }
    async getMessage(messageId) {
        const res = await this.request(`/messages/${messageId}?$expand=attachments`);
        return this.normalizeGraphMessage(res);
    }
    async modifyLabels(id, options) {
        const patchBody = {};
        if (options.isRead !== undefined) {
            patchBody.isRead = options.isRead;
        }
        if (options.isStarred !== undefined) {
            patchBody.flag = { flagStatus: options.isStarred ? 'flagged' : 'notFlagged' };
        }
        if (options.addLabels) {
            patchBody.categories = options.addLabels;
        }
        await this.request(`/messages/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(patchBody),
        });
    }
    async archive(threadId) {
        const res = await this.request(`/messages?$filter=conversationId eq '${threadId}'&$select=id`);
        for (const msg of res.value || []) {
            await this.request(`/messages/${msg.id}/move`, {
                method: 'POST',
                body: JSON.stringify({ destinationId: 'archive' }),
            });
        }
    }
    async trash(threadId) {
        const res = await this.request(`/messages?$filter=conversationId eq '${threadId}'&$select=id`);
        for (const msg of res.value || []) {
            await this.request(`/messages/${msg.id}/move`, {
                method: 'POST',
                body: JSON.stringify({ destinationId: 'deleteditems' }),
            });
        }
    }
    async createDraft(draft) {
        const graphMessage = this.buildGraphMessagePayload(draft);
        const res = await this.request('/messages', {
            method: 'POST',
            body: JSON.stringify(graphMessage),
        });
        return { id: res.id };
    }
    async updateDraft(draftId, draft) {
        const graphMessage = this.buildGraphMessagePayload(draft);
        await this.request(`/messages/${draftId}`, {
            method: 'PATCH',
            body: JSON.stringify(graphMessage),
        });
    }
    async send(message) {
        const graphMessage = this.buildGraphMessagePayload(message);
        const res = await this.request('/sendMail', {
            method: 'POST',
            body: JSON.stringify({
                message: graphMessage,
                saveToSentItems: true,
            }),
        });
        return { messageId: res.id || 'sent-ok', threadId: message.replyThreadId };
    }
    async getAttachment(messageId, attachmentId) {
        const res = await this.request(`/messages/${messageId}/attachments/${attachmentId}`);
        return {
            filename: res.name || 'attachment',
            contentType: res.contentType || 'application/octet-stream',
            data: Buffer.from(res.contentBytes || '', 'base64'),
        };
    }
    async listEvents(startDate, endDate) {
        const params = new URLSearchParams({
            startDateTime: startDate.toISOString(),
            endDateTime: endDate.toISOString(),
            $select: 'id,subject,bodyPreview,location,onlineMeeting,start,end,isAllDay,attendees',
        });
        const res = await this.request(`/calendarView?${params.toString()}`);
        return (res.value || []).map((e) => ({
            id: e.id,
            title: e.subject || '(Untitled Event)',
            description: e.bodyPreview || undefined,
            location: e.location?.displayName || undefined,
            joinUrl: e.onlineMeeting?.joinUrl || undefined,
            startTime: new Date(e.start.dateTime + 'Z'),
            endTime: new Date(e.end.dateTime + 'Z'),
            isAllDay: !!e.isAllDay,
            attendees: (e.attendees || []).map((a) => a.emailAddress?.address),
        }));
    }
    async createEvent(event) {
        const body = {
            subject: event.title,
            body: { contentType: 'text', content: event.description || '' },
            location: { displayName: event.location || '' },
            start: { dateTime: event.startTime.toISOString(), timeZone: 'UTC' },
            end: { dateTime: event.endTime.toISOString(), timeZone: 'UTC' },
            isAllDay: event.isAllDay,
            attendees: event.attendees.map((email) => ({
                emailAddress: { address: email, name: email },
                type: 'required',
            })),
        };
        const res = await this.request('/events', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return {
            id: res.id,
            title: res.subject,
            description: res.bodyPreview,
            location: res.location?.displayName,
            joinUrl: res.onlineMeeting?.joinUrl,
            startTime: new Date(res.start.dateTime),
            endTime: new Date(res.end.dateTime),
            isAllDay: !!res.isAllDay,
            attendees: (res.attendees || []).map((a) => a.emailAddress?.address),
        };
    }
    async updateEvent(eventId, event) {
        const body = {};
        if (event.title)
            body.subject = event.title;
        if (event.description)
            body.body = { contentType: 'text', content: event.description };
        if (event.location)
            body.location = { displayName: event.location };
        const res = await this.request(`/events/${eventId}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
        return {
            id: res.id,
            title: res.subject,
            description: res.bodyPreview,
            location: res.location?.displayName,
            joinUrl: res.onlineMeeting?.joinUrl,
            startTime: new Date(res.start.dateTime),
            endTime: new Date(res.end.dateTime),
            isAllDay: !!res.isAllDay,
            attendees: (res.attendees || []).map((a) => a.emailAddress?.address),
        };
    }
    async getDeltaHistory(cursor) {
        const deltaUrl = cursor || `${this.graphBase}/mailFolders/inbox/messages/delta`;
        const res = await this.request(deltaUrl);
        const messages = res.value || [];
        const threadMap = new Map();
        const deletedThreadIds = [];
        for (const msg of messages) {
            if (msg['@removed']) {
                deletedThreadIds.push(msg.id);
            }
            else {
                const convId = msg.conversationId || msg.id;
                if (!threadMap.has(convId))
                    threadMap.set(convId, []);
                threadMap.get(convId).push(msg);
            }
        }
        const threads = [];
        for (const [convId, msgs] of threadMap.entries()) {
            const latest = msgs[0];
            threads.push({
                id: convId,
                externalThreadId: convId,
                subject: latest.subject || '(No Subject)',
                snippet: latest.bodyPreview || '',
                isUnread: msgs.some((m) => !m.isRead),
                isStarred: msgs.some((m) => m.flag?.flagStatus === 'flagged'),
                folder: 'inbox',
                labels: latest.categories || [],
                messageCount: msgs.length,
                lastMessageAt: new Date(latest.receivedDateTime || Date.now()),
                messages: msgs.map((m) => this.normalizeGraphMessage(m)),
            });
        }
        const nextLink = res['@odata.nextLink'];
        const deltaLink = res['@odata.deltaLink'];
        return {
            threads,
            deletedThreadIds,
            nextCursor: deltaLink || nextLink || cursor || '',
            hasMore: !!nextLink,
        };
    }
    normalizeGraphMessage(m) {
        const attachments = (m.attachments || []).map((a) => ({
            id: a.id,
            filename: a.name || 'attachment',
            contentType: a.contentType || 'application/octet-stream',
            sizeBytes: a.size || 0,
        }));
        const senderEmail = m.from?.emailAddress?.address || 'unknown@example.com';
        const senderName = m.from?.emailAddress?.name || senderEmail.split('@')[0];
        const toRecipients = (m.toRecipients || []).map((r) => ({
            name: r.emailAddress?.name || r.emailAddress?.address || '',
            email: r.emailAddress?.address || '',
        }));
        const ccRecipients = (m.ccRecipients || []).map((r) => ({
            name: r.emailAddress?.name || r.emailAddress?.address || '',
            email: r.emailAddress?.address || '',
        }));
        return {
            id: m.id,
            threadId: m.conversationId || m.id,
            externalMessageId: m.internetMessageId || m.id,
            sender: { name: senderName, email: senderEmail },
            to: toRecipients,
            cc: ccRecipients,
            bcc: [],
            subject: m.subject || '(No Subject)',
            snippet: m.bodyPreview || '',
            bodyPlain: m.body?.contentType === 'text' ? m.body.content : m.bodyPreview || '',
            bodyHtml: m.body?.contentType === 'html' ? m.body.content : `<p>${m.bodyPreview || ''}</p>`,
            isUnread: !m.isRead,
            sentAt: new Date(m.receivedDateTime || m.sentDateTime || Date.now()),
            attachments,
        };
    }
    buildGraphMessagePayload(draft) {
        return {
            subject: draft.subject,
            body: {
                contentType: draft.bodyHtml ? 'html' : 'text',
                content: draft.bodyHtml || draft.bodyPlain || '',
            },
            toRecipients: draft.to.map((r) => ({
                emailAddress: { address: r.email, name: r.name },
            })),
            ccRecipients: (draft.cc || []).map((r) => ({
                emailAddress: { address: r.email, name: r.name },
            })),
        };
    }
}
exports.GraphAdapter = GraphAdapter;
//# sourceMappingURL=graph.adapter.js.map