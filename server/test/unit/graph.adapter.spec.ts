import { GraphAdapter } from '../../src/modules/mail/adapters/graph.adapter';

describe('GraphAdapter Contract Tests (Microsoft Graph Fixtures & Delta Queries)', () => {
  let adapter: GraphAdapter;
  const mockBaseUrl = 'https://fake-graph.test/v1.0/me';

  beforeEach(() => {
    adapter = new GraphAdapter({
      accessToken: 'fake_graph_token_456',
      graphBaseUrl: mockBaseUrl,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should list messages and group by conversationId into normalized canonical threads', async () => {
    const fakeMessagesResponse = {
      value: [
        {
          id: 'graph-msg-1',
          conversationId: 'conv-100',
          subject: 'Team Design System Sync',
          bodyPreview: 'Please review the token updates',
          body: { contentType: 'html', content: '<p>Please review the token updates</p>' },
          isRead: false,
          flag: { flagStatus: 'flagged' },
          categories: ['Design', 'Priority'],
          from: { emailAddress: { name: 'Taylor Reed', address: 'taylor@example.test' } },
          toRecipients: [{ emailAddress: { name: 'Alex', address: 'alex@example.test' } }],
          receivedDateTime: '2026-10-13T10:00:00Z',
        },
        {
          id: 'graph-msg-2',
          conversationId: 'conv-100',
          subject: 'Re: Team Design System Sync',
          bodyPreview: 'Looks good to me',
          body: { contentType: 'text', content: 'Looks good to me' },
          isRead: true,
          flag: { flagStatus: 'notFlagged' },
          categories: ['Design'],
          from: { emailAddress: { name: 'Alex', address: 'alex@example.test' } },
          toRecipients: [{ emailAddress: { name: 'Taylor', address: 'taylor@example.test' } }],
          receivedDateTime: '2026-10-13T11:00:00Z',
        },
      ],
    };

    jest.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      if (url.toString().includes('/mailFolders/inbox/messages')) {
        return new Response(JSON.stringify(fakeMessagesResponse), { status: 200 });
      }
      return new Response('Not found', { status: 404 });
    });

    const result = await adapter.listThreads({ folder: 'inbox' });

    expect(result.threads).toHaveLength(1);
    const thread = result.threads[0];
    expect(thread.id).toBe('conv-100');
    expect(thread.subject).toBe('Team Design System Sync');
    expect(thread.messageCount).toBe(2);
    expect(thread.isUnread).toBe(true);
    expect(thread.isStarred).toBe(true);
    expect(thread.labels).toContain('Priority');
    expect(thread.labels).toContain('Design');
  });

  it('should query delta endpoint and track deltaLink and removed messages', async () => {
    const fakeDeltaResponse = {
      value: [
        {
          id: 'graph-msg-3',
          conversationId: 'conv-300',
          subject: 'Delta message',
          isRead: true,
          receivedDateTime: '2026-10-13T12:00:00Z',
        },
        {
          id: 'graph-msg-deleted',
          '@removed': { reason: 'deleted' },
        },
      ],
      '@odata.deltaLink':
        'https://fake-graph.test/v1.0/me/mailFolders/inbox/messages/delta?$deltatoken=tokenXYZ',
    };

    jest.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      if (url.toString().includes('/delta')) {
        return new Response(JSON.stringify(fakeDeltaResponse), { status: 200 });
      }
      return new Response('Not found', { status: 404 });
    });

    const delta = await adapter.getDeltaHistory();

    expect(delta.threads).toHaveLength(1);
    expect(delta.threads[0].id).toBe('conv-300');
    expect(delta.deletedThreadIds).toContain('graph-msg-deleted');
    expect(delta.nextCursor).toContain('tokenXYZ');
    expect(delta.hasMore).toBe(false);
  });
});
