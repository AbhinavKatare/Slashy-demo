import { PreconditionFailedException } from '@nestjs/common';
import { OutboxWriteService } from '../../src/modules/mail/outbox-write.service';
import { WriteActionType } from '../../src/modules/mail/dto/outbox-write.dto';

describe('OutboxWriteService (Idempotency, Optimistic ETag, Provider Dispatch, Undo & Bulk Failures)', () => {
  let service: OutboxWriteService;
  let dbMock: any;
  let providerFactoryMock: any;
  let providerMock: any;

  const userId = 'user-123';
  const threadId = 'thread-456';
  const now = new Date('2026-10-13T10:00:00Z');

  beforeEach(() => {
    dbMock = {
      query: jest.fn(),
    };

    providerMock = {
      modifyLabels: jest.fn().mockResolvedValue(undefined),
      archive: jest.fn().mockResolvedValue(undefined),
      trash: jest.fn().mockResolvedValue(undefined),
    };

    providerFactoryMock = {
      getProviderForAccount: jest.fn().mockResolvedValue(providerMock),
    };

    service = new OutboxWriteService(dbMock, providerFactoryMock);
  });

  it('IDEMPOTENCY: Duplicate call with identical Idempotency-Key returns cached result without re-executing', async () => {
    // 1st query: find existing outbox operation -> returns previously confirmed op
    dbMock.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'op-1',
          idempotency_key: 'idem-key-1',
          action_type: 'archive',
          target_id: threadId,
          status: 'confirmed',
          error_message: null,
          payload: { inverseAction: 'unarchive' },
          created_at: now,
          updated_at: now,
        },
      ],
    });

    const result = await service.executeWrite(userId, threadId, 'idem-key-1', {
      action: WriteActionType.ARCHIVE,
    });

    expect(result.status).toBe('confirmed');
    expect(result.idempotencyKey).toBe('idem-key-1');
    // Provider factory should NOT be invoked because it was deduplicated
    expect(providerFactoryMock.getProviderForAccount).not.toHaveBeenCalled();
  });

  it('OPTIMISTIC CONCURRENCY: Rejects write with 412 if ETag does not match current thread version', async () => {
    // No previous operation
    dbMock.query.mockResolvedValueOnce({ rows: [] });
    // Thread fetch returns current version at '2026-10-13T12:00:00Z'
    dbMock.query.mockResolvedValueOnce({
      rows: [
        {
          id: threadId,
          account_id: 'acc-1',
          is_unread: false,
          is_starred: false,
          folder: 'inbox',
          updated_at: new Date('2026-10-13T12:00:00Z'),
        },
      ],
    });

    await expect(
      service.executeWrite(userId, threadId, 'idem-key-2', {
        action: WriteActionType.MARK_READ,
        eTag: '2026-10-13T09:00:00.000Z', // stale ETag!
      }),
    ).rejects.toThrow(PreconditionFailedException);
  });

  it('PROVIDER CONFIRMATION: Updates database only after provider confirms write', async () => {
    dbMock.query.mockResolvedValueOnce({ rows: [] }); // No existing op
    dbMock.query.mockResolvedValueOnce({
      rows: [
        {
          id: threadId,
          account_id: 'acc-1',
          external_thread_id: 'ext-thread-1',
          is_unread: true,
          updated_at: now,
        },
      ],
    }); // Thread fetch
    dbMock.query.mockResolvedValueOnce({ rows: [] }); // Insert pending op
    dbMock.query.mockResolvedValueOnce({
      rows: [{ updated_at: new Date('2026-10-13T10:05:00Z') }],
    }); // Thread update in DB
    dbMock.query.mockResolvedValueOnce({ rows: [] }); // Op update to confirmed

    const result = await service.executeWrite(userId, threadId, 'idem-key-3', {
      action: WriteActionType.MARK_READ,
    });

    expect(result.status).toBe('confirmed');
    expect(providerMock.modifyLabels).toHaveBeenCalledWith('ext-thread-1', { isRead: true });

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('is_unread = false'),
      [threadId, userId],
      userId,
    );
  });

  it('PROVIDER ERROR: Records failure reason and does NOT mutate thread in DB on permission error', async () => {
    dbMock.query.mockResolvedValueOnce({ rows: [] }); // No existing op
    dbMock.query.mockResolvedValueOnce({
      rows: [
        {
          id: threadId,
          account_id: 'acc-1',
          external_thread_id: 'ext-thread-1',
          is_unread: true,
          updated_at: now,
        },
      ],
    });
    dbMock.query.mockResolvedValueOnce({ rows: [] }); // Insert pending op

    // Provider throws 403 Forbidden / Permission Denied
    providerMock.modifyLabels.mockRejectedValueOnce(
      new Error('Insufficient permissions: missing gmail.modify scope'),
    );

    // Op update to failed
    dbMock.query.mockResolvedValueOnce({ rows: [] });

    const result = await service.executeWrite(userId, threadId, 'idem-key-4', {
      action: WriteActionType.MARK_READ,
    });

    expect(result.status).toBe('failed');
    expect(result.errorMessage).toContain('missing gmail.modify scope');

    // DB threads table was NOT updated to read
    expect(dbMock.query).not.toHaveBeenCalledWith(
      expect.stringContaining('UPDATE threads SET is_unread = false'),
      expect.anything(),
      expect.anything(),
    );
  });

  it('PARTIAL BULK FAILURES: Itemizes successes and failures across multiple threads', async () => {
    // Thread 1 succeeds, Thread 2 fails
    jest
      .spyOn(service, 'executeWrite')
      .mockResolvedValueOnce({
        operationId: 'op-1',
        idempotencyKey: 'bulk_1_item_0',
        targetId: 'thread-1',
        action: WriteActionType.ARCHIVE,
        status: 'confirmed',
        inverseAction: 'unarchive',
      })
      .mockResolvedValueOnce({
        operationId: 'op-2',
        idempotencyKey: 'bulk_1_item_1',
        targetId: 'thread-2',
        action: WriteActionType.ARCHIVE,
        status: 'failed',
        inverseAction: 'unarchive',
        errorMessage: 'Thread not found at provider',
      });

    const result = await service.executeBulkWrite(userId, 'bulk_1', {
      threadIds: ['thread-1', 'thread-2'],
      action: WriteActionType.ARCHIVE,
    });

    expect(result.totalCount).toBe(2);
    expect(result.succeededCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.items[0].status).toBe('confirmed');
    expect(result.items[1].status).toBe('failed');
    expect(result.items[1].error).toBe('Thread not found at provider');
  });

  it('UNDO: Dispatches inverse operation to provider and database', async () => {
    // 1st query: fetch confirmed operation
    dbMock.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'op-to-undo',
          idempotency_key: 'idem-orig',
          action_type: 'mark_read',
          target_id: threadId,
          status: 'confirmed',
          payload: { inverseAction: WriteActionType.MARK_UNREAD },
          created_at: now,
          updated_at: now,
        },
      ],
    });

    // Mock executeWrite for the inverse action
    const writeSpy = jest.spyOn(service, 'executeWrite').mockResolvedValueOnce({
      operationId: 'op-undo-new',
      idempotencyKey: 'undo_op-to-undo',
      targetId: threadId,
      action: WriteActionType.MARK_UNREAD,
      status: 'confirmed',
      inverseAction: WriteActionType.MARK_READ,
    });

    const undoResult = await service.undoOperation(userId, 'op-to-undo');

    expect(undoResult.undoneOperationId).toBe('op-to-undo');
    expect(writeSpy).toHaveBeenCalledWith(
      userId,
      threadId,
      expect.stringContaining('undo_op-to-undo'),
      { action: WriteActionType.MARK_UNREAD },
    );
  });
});
