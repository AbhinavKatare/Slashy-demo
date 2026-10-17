import { GmailAdapter } from '../../src/modules/mail/adapters/gmail.adapter';

describe('GmailAdapter Contract Tests (Recorded Fixtures & Rate Limiting)', () => {
  let adapter: GmailAdapter;
  const mockBaseUrl = 'https://fake-gmail.test/api';

  beforeEach(() => {
    adapter = new GmailAdapter({
      accessToken: 'fake_access_token_123',
      gmailBaseUrl: mockBaseUrl,
      calendarBaseUrl: `${mockBaseUrl}/calendar`,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should parse Gmail threads and constituent messages with normalized model', async () => {
    const fakeThreadResponse = {
      id: 'thread-123',
      snippet: 'Hey team, here is the roadmap update...',
      messages: [
        {
          id: 'msg-1',
          threadId: 'thread-123',
          labelIds: ['INBOX', 'UNREAD', 'STARRED'],
          internalDate: '1791907200000',
          payload: {
            headers: [
              { name: 'Subject', value: 'Q4 Roadmap Update' },
              { name: 'From', value: 'Sarah Connor <sarah@cyberdyne.test>' },
              { name: 'To', value: 'Alex Morgan <alex@example.test>' },
            ],
            mimeType: 'multipart/alternative',
            parts: [
              {
                mimeType: 'text/plain',
                body: {
                  data: Buffer.from('Here is the plain text roadmap.').toString('base64url'),
                },
              },
            ],
          },
        },
      ],
    };

    jest.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      if (url.toString().includes('/threads/thread-123')) {
        return new Response(JSON.stringify(fakeThreadResponse), { status: 200 });
      }
      return new Response('Not found', { status: 404 });
    });

    const thread = await adapter.getThread('thread-123');

    expect(thread.id).toBe('thread-123');
    expect(thread.subject).toBe('Q4 Roadmap Update');
    expect(thread.isUnread).toBe(true);
    expect(thread.isStarred).toBe(true);
    expect(thread.folder).toBe('inbox');
    expect(thread.messages).toHaveLength(1);
    expect(thread.messages![0].sender.email).toBe('sarah@cyberdyne.test');
    expect(thread.messages![0].bodyPlain).toBe('Here is the plain text roadmap.');
  });

  it('should back off and retry when encountering HTTP 429 Too Many Requests', async () => {
    let callCount = 0;

    jest.spyOn(global, 'fetch').mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // Return 429 on first try with 10ms Retry-After header
        return new Response('Rate limited', {
          status: 429,
          headers: { 'retry-after': '0.01' },
        });
      }
      return new Response(
        JSON.stringify({ id: 'thread-999', snippet: 'Success after retry', messages: [] }),
        { status: 200 },
      );
    });

    const thread = await adapter.getThread('thread-999');

    expect(callCount).toBe(2);
    expect(thread.id).toBe('thread-999');
  });

  it('should parse delta history events into added and deleted thread IDs', async () => {
    const fakeHistoryResponse = {
      historyId: '1500200',
      history: [
        {
          messagesAdded: [{ message: { threadId: 'thread-new-1' } }],
          messagesDeleted: [{ message: { threadId: 'thread-del-2' } }],
        },
      ],
    };

    jest.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      if (url.toString().includes('/history')) {
        return new Response(JSON.stringify(fakeHistoryResponse), { status: 200 });
      }
      if (url.toString().includes('/threads/thread-new-1')) {
        return new Response(
          JSON.stringify({ id: 'thread-new-1', snippet: 'New message', messages: [] }),
          { status: 200 },
        );
      }
      return new Response('Not found', { status: 404 });
    });

    const delta = await adapter.getDeltaHistory('1500100');

    expect(delta.nextCursor).toBe('1500200');
    expect(delta.threads).toHaveLength(1);
    expect(delta.threads[0].id).toBe('thread-new-1');
    expect(delta.deletedThreadIds).toContain('thread-del-2');
  });
});
