import { SyncService } from '../../src/modules/sync/sync.service';

describe('SyncService (Outbox Replay & Idempotency)', () => {
  let syncService: SyncService;
  let dbMock: any;

  beforeEach(() => {
    dbMock = {
      query: jest.fn(),
      transaction: jest.fn((callback) => {
        const clientMock = {
          query: jest.fn(),
        };
        return callback(clientMock);
      }),
    };

    syncService = new SyncService(dbMock);
  });

  it('should process pending outbox operation successfully', async () => {
    const userId = 'user-1';
    const ops = [
      {
        idempotencyKey: 'key-1',
        accountId: 'acc-1',
        actionType: 'mark_read',
        targetId: 'thread-1',
      },
    ];

    dbMock.transaction = jest.fn(async (cb) => {
      const client = {
        query: jest
          .fn()
          .mockResolvedValueOnce({ rows: [] }) // Check idempotency: none existing
          .mockResolvedValueOnce({ rows: [] }) // UPDATE thread
          .mockResolvedValueOnce({ rows: [] }), // INSERT outbox_operations
      };
      return cb(client);
    });

    const result = await syncService.processOutboxBatch(userId, ops);

    expect(result.processed).toHaveLength(1);
    expect(result.processed[0]).toEqual({
      idempotencyKey: 'key-1',
      status: 'completed',
    });
  });

  it('IDEMPOTENCY: should deduplicate when key already processed without duplicate execution', async () => {
    const userId = 'user-1';
    const ops = [
      {
        idempotencyKey: 'key-1',
        accountId: 'acc-1',
        actionType: 'mark_read',
        targetId: 'thread-1',
      },
    ];

    dbMock.transaction = jest.fn(async (cb) => {
      const client = {
        query: jest.fn().mockResolvedValueOnce({
          rows: [{ id: 'op-1', status: 'completed', error_message: null }], // already processed!
        }),
      };
      return cb(client);
    });

    const result = await syncService.processOutboxBatch(userId, ops);

    expect(result.processed[0]).toEqual({
      idempotencyKey: 'key-1',
      status: 'completed',
    });
  });

  it('should pull delta changes and return updated cursor', async () => {
    const userId = 'user-1';
    const now = new Date();

    dbMock.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'th-1',
          account_id: 'acc-1',
          subject: 'Weekly Catchup',
          snippet: 'Hi there',
          is_unread: false,
          is_starred: true,
          folder: 'inbox',
          has_attachments: false,
          message_count: 2,
          last_message_at: now,
          updated_at: now,
          deleted_at: null,
        },
      ],
    });

    const result = await syncService.pullDeltas(userId, { cursor: '2026-10-13T00:00:00Z' });

    expect(result.threads).toHaveLength(1);
    expect(result.threads[0].subject).toBe('Weekly Catchup');
    expect(result.cursor).toBe(now.toISOString());
    expect(result.deletedThreadIds).toHaveLength(0);
  });
});
