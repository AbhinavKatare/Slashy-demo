import { SyncProcessorService } from '../../src/modules/sync/processors/sync-processor.service';
import { WebhookSyncService } from '../../src/modules/sync/webhooks/webhook-sync.service';
import { SyncQueueService } from '../../src/modules/sync/queues/sync-queue.service';

describe('Sync Pipeline Chaos Tests (Deduplication, Cursor Invalidation, Backfill Resumption)', () => {
  let processor: SyncProcessorService;
  let webhookService: WebhookSyncService;
  let queueService: SyncQueueService;
  let dbMock: any;
  let providerFactoryMock: any;
  let providerMock: any;
  let redisMock: any;

  beforeEach(() => {
    dbMock = {
      query: jest.fn(),
      transaction: jest.fn((cb) => cb(dbMock)),
    };

    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    queueService = new SyncQueueService(redisMock);
    jest.spyOn(queueService, 'enqueueBackfill').mockResolvedValue('job-backfill-1');
    jest.spyOn(queueService, 'enqueueIncremental').mockResolvedValue('job-incr-1');

    providerMock = {
      listThreads: jest.fn(),
      getDeltaHistory: jest.fn(),
    };

    providerFactoryMock = {
      getProviderForAccount: jest.fn().mockResolvedValue(providerMock),
    };

    processor = new SyncProcessorService(dbMock, providerFactoryMock, queueService);
    webhookService = new WebhookSyncService(dbMock, queueService, redisMock);
  });

  describe('Webhook Event Deduplication & Authenticity', () => {
    it('CHAOS: Duplicate Google Pub/Sub notifications should be deduplicated without duplicate jobs', async () => {
      const email = 'alex.morgan@gmail.com';
      const historyId = '998877';

      const payload = {
        message: {
          data: Buffer.from(JSON.stringify({ emailAddress: email, historyId })).toString('base64'),
        },
      };

      // First call: redis.get returns null (first time seen)
      redisMock.get.mockResolvedValueOnce(null);
      dbMock.query.mockResolvedValueOnce({
        rows: [{ id: 'acc-1', user_id: 'user-1' }],
      });

      const res1 = await webhookService.handleGoogleWebhook(payload);
      expect(res1.status).toBe('queued');
      expect(queueService.enqueueIncremental).toHaveBeenCalledTimes(1);

      // Second call: redis.get returns '1' (duplicate within window)
      redisMock.get.mockResolvedValueOnce('1');
      const res2 = await webhookService.handleGoogleWebhook(payload);
      expect(res2.status).toBe('deduplicated');
      // No duplicate job enqueued!
      expect(queueService.enqueueIncremental).toHaveBeenCalledTimes(1);
    });

    it('should echo validationToken on Microsoft Graph handshake verification', async () => {
      const token = 'sample_validation_token_xyz_987';
      const res = await webhookService.handleMicrosoftWebhook({}, token);

      expect(res.status).toBe('handshake_verified');
      expect(res.validationResponse).toBe(token);
    });
  });

  describe('Cursor Invalidation & Clean Full Resync', () => {
    it('CHAOS: Expired history cursor (HTTP 404/410) triggers clean full resync backfill', async () => {
      dbMock.query.mockResolvedValueOnce({
        rows: [{ cursor_value: 'stale_history_id_100' }],
      });

      // Provider throws 404 History Id expired error
      const err: any = new Error('historyId 100 is too old or expired');
      err.status = 404;
      providerMock.getDeltaHistory.mockRejectedValueOnce(err);

      const result = await processor.processIncremental({
        accountId: 'acc-1',
        userId: 'user-1',
        provider: 'google',
        jobType: 'incremental',
      });

      expect(result.nextCursor).toBe('reset');
      // Verify clean backfill was enqueued
      expect(queueService.enqueueBackfill).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'acc-1',
          userId: 'user-1',
          jobType: 'backfill',
          cursor: undefined,
        }),
      );
    });
  });

  describe('Backfill Resumption', () => {
    it('should resume backfill from stored checkpoint cursor', async () => {
      // Return existing intermediate cursor
      dbMock.query.mockResolvedValueOnce({
        rows: [{ cursor_value: 'intermediate_page_token_abc' }],
      });

      providerMock.listThreads.mockResolvedValueOnce({
        threads: [
          {
            id: 't-1',
            externalThreadId: 't-1',
            subject: 'Roadmap',
            snippet: 'Hello',
            isUnread: false,
            isStarred: false,
            folder: 'inbox',
            labels: [],
            messageCount: 1,
            lastMessageAt: new Date(),
            messages: [],
          },
        ],
        nextCursor: 'next_page_token_def',
      });

      const res = await processor.processBackfill({
        accountId: 'acc-1',
        userId: 'user-1',
        provider: 'google',
        jobType: 'backfill',
      });

      expect(res.syncedCount).toBe(1);
      expect(res.nextCursor).toBe('next_page_token_def');

      // Verify next resumable page enqueued
      expect(queueService.enqueueBackfill).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'acc-1',
          cursor: 'next_page_token_def',
        }),
      );
    });
  });
});
