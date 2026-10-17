import { BadRequestException, ConflictException } from '@nestjs/common';
import { SendingService } from '../../src/modules/drafts/sending.service';
import { ClamAvScannerService } from '../../src/common/security/clamav-scanner.service';

describe('SendingService (Task 8: Draft Send, Undo Window, Hash Verification, ClamAV & Clock Edge Cases)', () => {
  let service: SendingService;
  let dbMock: any;
  let providerFactoryMock: any;
  let providerMock: any;
  let scanner: ClamAvScannerService;

  const userId = 'user-uuid-1';
  const accountId = 'acc-uuid-1';
  const draftId = 'draft-uuid-1';

  const mockDraft = {
    id: draftId,
    account_id: accountId,
    reply_thread_id: 'thread-uuid-1',
    reply_message_id: null,
    to_recipients: ['recipient@example.com'],
    cc_recipients: [],
    bcc_recipients: [],
    subject: 'Project Kickoff Meeting',
    body_plain: 'Hello team, let us meet tomorrow at 10 AM.',
    body_html: '<p>Hello team, let us meet tomorrow at 10 AM.</p>',
    attachments_meta: [],
  };

  beforeEach(() => {
    scanner = new ClamAvScannerService();

    providerMock = {
      send: jest.fn().mockResolvedValue({
        messageId: 'provider-msg-id-123',
        threadId: 'thread-uuid-1',
      }),
    };

    providerFactoryMock = {
      getProviderForAccount: jest.fn().mockResolvedValue(providerMock),
    };

    dbMock = {
      query: jest.fn(),
    };

    service = new SendingService(dbMock, providerFactoryMock, scanner);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('Draft Payload Hash Verification', () => {
    it('computes consistent deterministic SHA-256 hash', () => {
      const hash1 = service.computeDraftHash(mockDraft);
      const hash2 = service.computeDraftHash({ ...mockDraft });
      expect(hash1).toEqual(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('rejects send if payload hash does not match (detects tampering/stale draft)', async () => {
      dbMock.query
        .mockResolvedValueOnce({ rows: [] }) // no existing idempotency
        .mockResolvedValueOnce({ rows: [mockDraft] }); // draft found

      await expect(
        service.sendDraft(
          userId,
          {
            draftId,
            payloadHash: '0000000000000000000000000000000000000000000000000000000000000000',
            undoWindowSeconds: 10,
          },
          'idem-key-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Double-send Prevention (Idempotency)', () => {
    it('replays existing outbox operation if idempotency key matches', async () => {
      dbMock.query.mockResolvedValueOnce({
        rows: [
          { id: 'existing-send-op', status: 'undo_window', payload: {}, created_at: new Date() },
        ],
      });

      const validHash = service.computeDraftHash(mockDraft);
      const result = await service.sendDraft(
        userId,
        { draftId, payloadHash: validHash, undoWindowSeconds: 10 },
        'existing-idem-key',
      );

      expect(result.sendId).toBe('existing-send-op');
      expect(result.status).toBe('undo_window');
      expect(providerMock.send).not.toHaveBeenCalled();
    });
  });

  describe('Undo Window & Cancellation Races', () => {
    it('enqueues send in undo_window status when undoWindowSeconds > 0', async () => {
      const validHash = service.computeDraftHash(mockDraft);
      dbMock.query
        .mockResolvedValueOnce({ rows: [] }) // no existing op
        .mockResolvedValueOnce({ rows: [mockDraft] }) // draft
        .mockResolvedValueOnce({ rows: [] }); // insert outbox_operations

      const res = await service.sendDraft(
        userId,
        { draftId, payloadHash: validHash, undoWindowSeconds: 15 },
        'new-key-1',
      );

      expect(res.status).toBe('undo_window');
      expect((res as any).undoWindowSeconds).toBe(15);
      expect(providerMock.send).not.toHaveBeenCalled();
    });

    it('successfully cancels send while still within the undo window', async () => {
      dbMock.query
        .mockResolvedValueOnce({ rows: [{ id: 'send-op-1', status: 'undo_window', payload: {} }] }) // check op
        .mockResolvedValueOnce({ rows: [] }); // update op

      const res = await service.cancelSend(userId, 'send-op-1');
      expect(res.success).toBe(true);
      expect(res.message).toContain('cancelled');
    });

    it('rejects cancellation with ConflictException if message has already been dispatched', async () => {
      dbMock.query.mockResolvedValueOnce({
        rows: [{ id: 'send-op-2', status: 'completed', payload: {} }],
      });

      await expect(service.cancelSend(userId, 'send-op-2')).rejects.toThrow(ConflictException);
    });
  });

  describe('Clock & Timezone Edge Cases', () => {
    it('rejects scheduled send if timestamp is in the past', async () => {
      const validHash = service.computeDraftHash(mockDraft);
      dbMock.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [mockDraft] });

      await expect(
        service.sendDraft(
          userId,
          {
            draftId,
            payloadHash: validHash,
            scheduledAt: '2020-01-01T00:00:00.000Z',
            timezone: 'America/New_York',
          },
          'sched-past-key',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('schedules message for future timestamp with client timezone', async () => {
      const futureDate = new Date(Date.now() + 86400 * 1000).toISOString();
      const validHash = service.computeDraftHash(mockDraft);

      dbMock.query
        .mockResolvedValueOnce({ rows: [] }) // no existing
        .mockResolvedValueOnce({ rows: [mockDraft] }) // draft
        .mockResolvedValueOnce({ rows: [] }) // insert scheduled_messages
        .mockResolvedValueOnce({ rows: [] }); // insert outbox_operations

      const res = await service.sendDraft(
        userId,
        {
          draftId,
          payloadHash: validHash,
          scheduledAt: futureDate,
          timezone: 'Europe/London',
        },
        'sched-future-key',
      );

      expect(res.status).toBe('scheduled');
      expect((res as any).scheduledAt).toBe(futureDate);
      expect((res as any).timezone).toBe('Europe/London');
    });
  });

  describe('Attachment Limits & ClamAV Malware Scanning', () => {
    it('blocks dangerous executable file extensions', async () => {
      await expect(
        service.uploadAttachment(userId, {
          filename: 'invoice.exe',
          contentType: 'application/octet-stream',
          base64Data: Buffer.from('hello').toString('base64'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks attachments exceeding the 25MB size limit', async () => {
      const bigBuffer = Buffer.alloc(26 * 1024 * 1024); // 26MB
      await expect(
        service.uploadAttachment(userId, {
          filename: 'large_archive.zip',
          contentType: 'application/zip',
          base64Data: bigBuffer.toString('base64'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('detects and blocks EICAR antivirus test signature via ClamAV scanner', async () => {
      const eicarString = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
      await expect(
        service.uploadAttachment(userId, {
          filename: 'eicar_test.txt',
          contentType: 'text/plain',
          base64Data: Buffer.from(eicarString).toString('base64'),
        }),
      ).rejects.toThrow(/malware signature detected/);
    });

    it('accepts clean legitimate PDF document', async () => {
      const cleanPdfBuffer = Buffer.from('%PDF-1.4 sample pdf content');
      const res = await service.uploadAttachment(userId, {
        filename: 'quarterly_results.pdf',
        contentType: 'application/pdf',
        base64Data: cleanPdfBuffer.toString('base64'),
      });

      expect(res.filename).toBe('quarterly_results.pdf');
      expect(res.sizeBytes).toBe(cleanPdfBuffer.length);
      expect(res.storagePath).toContain('quarterly_results.pdf');
    });
  });
});
