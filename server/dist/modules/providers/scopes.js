"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MICROSOFT_SCOPES = exports.GOOGLE_SCOPES = void 0;
exports.getScopesForTier = getScopesForTier;
exports.GOOGLE_SCOPES = {
    EMAIL: {
        scope: 'email',
        tier: 'readonly',
        justification: 'Verify account ownership and associate connected account with user profile.',
    },
    PROFILE: {
        scope: 'profile',
        tier: 'readonly',
        justification: 'Display user avatar and sender name in local companion UI.',
    },
    GMAIL_READONLY: {
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        tier: 'readonly',
        justification: 'Required for initial mailbox backfill, delta synchronization, thread listing, and offline SQLite caching without modify permissions.',
    },
    CALENDAR_READONLY: {
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        tier: 'readonly',
        justification: 'Read calendar events to power daily briefing and meeting reminders.',
    },
    GMAIL_MODIFY: {
        scope: 'https://www.googleapis.com/auth/gmail.modify',
        tier: 'modify_send',
        justification: 'Required when user marks threads as read/unread, stars emails, applies labels, archives messages, or moves threads to trash.',
    },
    GMAIL_SEND: {
        scope: 'https://www.googleapis.com/auth/gmail.send',
        tier: 'modify_send',
        justification: 'Required strictly when user explicitly sends an email or schedules a message send.',
    },
    CALENDAR_EVENTS: {
        scope: 'https://www.googleapis.com/auth/calendar.events',
        tier: 'modify_send',
        justification: 'Required when user creates, edits, or deletes calendar events from email thread action items.',
    },
};
exports.MICROSOFT_SCOPES = {
    OPENID: {
        scope: 'openid',
        tier: 'readonly',
        justification: 'Authenticate user identity via OpenID Connect.',
    },
    PROFILE: {
        scope: 'profile',
        tier: 'readonly',
        justification: 'Retrieve account display name and photo.',
    },
    EMAIL: {
        scope: 'email',
        tier: 'readonly',
        justification: 'Verify primary mailbox email address.',
    },
    OFFLINE_ACCESS: {
        scope: 'offline_access',
        tier: 'readonly',
        justification: 'Obtain rotating refresh tokens for offline synchronization when app is backgrounded.',
    },
    MAIL_READ: {
        scope: 'Mail.Read',
        tier: 'readonly',
        justification: 'Read messages and folders for initial sync and search without write/send permissions.',
    },
    CALENDARS_READ: {
        scope: 'Calendars.Read',
        tier: 'readonly',
        justification: 'Read calendar events for schedule reminders and day view.',
    },
    MAIL_READWRITE: {
        scope: 'Mail.ReadWrite',
        tier: 'modify_send',
        justification: 'Modify messages, move to Archive/Trash, toggle read/flag status, and save draft updates.',
    },
    MAIL_SEND: {
        scope: 'Mail.Send',
        tier: 'modify_send',
        justification: 'Deliver outgoing messages on behalf of authenticated user.',
    },
    CALENDARS_READWRITE: {
        scope: 'Calendars.ReadWrite',
        tier: 'modify_send',
        justification: 'Create and update meeting invitations and calendar events.',
    },
};
function getScopesForTier(provider, tier = 'readonly') {
    const scopeMap = provider === 'google' ? exports.GOOGLE_SCOPES : exports.MICROSOFT_SCOPES;
    const scopes = [];
    for (const def of Object.values(scopeMap)) {
        if (tier === 'readonly') {
            if (def.tier === 'readonly')
                scopes.push(def.scope);
        }
        else {
            scopes.push(def.scope);
        }
    }
    return scopes;
}
//# sourceMappingURL=scopes.js.map