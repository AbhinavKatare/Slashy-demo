import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import { DatabaseService } from '../../database/database.service';
import { MailProviderFactory } from '../mail/adapters/mail-provider.factory';
import { ClamAvScannerService } from '../../common/security/clamav-scanner.service';
import { SendDraftDto, UploadAttachmentDto } from './dto/send.dto';

const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const BLOCKED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.vbs',
  '.js',
  '.scr',
  '.pif',
  '.com',
  '.ps1',
]);

@Injectable()
export class SendingService implements OnModuleDestroy {
  private readonly logger = new Logger(SendingService.name);
  private readonly activeUndoTimers = new Map<string, NodeJS.Timeout>();

  onModuleDestroy() {
    for (const timer of this.activeUndoTimers.values()) {
      clearTimeout(timer);
    }
    this.activeUndoTimers.clear();
  }

  constructor(
    private readonly db: DatabaseService,
    private readonly providerFactory: MailProviderFactory,
    private readonly malwareScanner: ClamAvScannerService,
  ) {}

  /**
   * Deterministically computes the SHA-256 hash of a draft's canonical fields.
   * Ensures the user sends exactly what they reviewed in the confirmation sheet.
   */
  computeDraftHash(draft: {
    account_id: string;
    to_recipients: any;
    cc_recipients: any;
    bcc_recipients: any;
    subject: string;
    body_plain: string;
    body_html: string;
    attachments_meta: any;
  }): string {
    const canonical = [
      draft.account_id,
      JSON.stringify(draft.to_recipients ?? []),
      JSON.stringify(draft.cc_recipients ?? []),
      JSON.stringify(draft.bcc_recipients ?? []),
      draft.subject ?? '',
      draft.body_plain ?? '',
      draft.body_html ?? '',
      JSON.stringify(draft.attachments_meta ?? []),
    ].join('|');

    return crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
  }

  /**
   * Initiates sending a draft with explicit user authorization, payload hash verification,
   * undo window scheduling, and exactly-once outbox tracking.
   */
  async sendDraft(userId: string, dto: SendDraftDto, idempotencyKey?: string) {
    const effectiveIdempotencyKey =
      idempotencyKey || `send-${dto.draftId}-${dto.payloadHash.substring(0, 16)}`;

    // 1. Exactly-once idempotency check
    const existingOp = await this.db.query(
      `SELECT id, status, payload, created_at FROM outbox_operations 
       WHERE idempotency_key = $1 AND user_id = $2;`,
      [effectiveIdempotencyKey, userId],
      userId,
    );

    if (existingOp.rows[0]) {
      this.logger.log(`[IDEMPOTENCY] Replaying duplicate send request ${effectiveIdempotencyKey}`);
      return {
        sendId: existingOp.rows[0].id,
        status: existingOp.rows[0].status,
        message: 'Send request already submitted and being processed',
      };
    }

    // 2. Fetch draft and verify existence
    const draftRes = await this.db.query(
      `SELECT id, account_id, reply_thread_id, reply_message_id, to_recipients, cc_recipients,
              bcc_recipients, subject, body_plain, body_html, attachments_meta
       FROM drafts
       WHERE id = $1 AND user_id = $2;`,
      [dto.draftId, userId],
      userId,
    );

    if (!draftRes.rows[0]) {
      throw new NotFoundException(`Draft ${dto.draftId} not found`);
    }

    const draft = draftRes.rows[0];

    // 3. Verify user-reviewed payload hash
    const expectedHash = this.computeDraftHash(draft);
    if (expectedHash.toLowerCase() !== dto.payloadHash.toLowerCase()) {
      this.logger.warn(
        `[INTEGRITY ERROR] Draft hash mismatch for user ${userId}. Expected ${expectedHash}, got ${dto.payloadHash}`,
      );
      throw new BadRequestException(
        'Draft content changed since last review (payload hash mismatch). Please review before sending.',
      );
    }

    const sendId = uuidv7();
    const undoWindowSeconds = dto.undoWindowSeconds ?? 10;

    // 4. Handle scheduled send
    if (dto.scheduledAt) {
      const scheduledDate = new Date(dto.scheduledAt);
      if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        throw new BadRequestException('scheduledAt must be a valid timestamp in the future');
      }

      const scheduledMsgId = uuidv7();
      await this.db.query(
        `INSERT INTO scheduled_messages (id, user_id, account_id, draft_id, scheduled_at, timezone, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending');`,
        [
          scheduledMsgId,
          userId,
          draft.account_id,
          draft.id,
          scheduledDate.toISOString(),
          dto.timezone || 'UTC',
        ],
        userId,
      );

      await this.db.query(
        `INSERT INTO outbox_operations (id, user_id, account_id, idempotency_key, action_type, target_id, payload, status)
         VALUES ($1, $2, $3, $4, 'send_mail', $5, $6, 'scheduled');`,
        [
          sendId,
          userId,
          draft.account_id,
          effectiveIdempotencyKey,
          draft.id,
          JSON.stringify({
            draftId: draft.id,
            scheduledAt: dto.scheduledAt,
            timezone: dto.timezone || 'UTC',
            scheduledMessageId: scheduledMsgId,
            followUpIfNoReplyDays: dto.followUpIfNoReplyDays,
            reminderAt: dto.reminderAt,
          }),
        ],
        userId,
      );

      return {
        sendId,
        status: 'scheduled',
        scheduledAt: scheduledDate.toISOString(),
        timezone: dto.timezone || 'UTC',
      };
    }

    // 5. Handle undo window (delayed send)
    if (undoWindowSeconds > 0) {
      const dispatchAt = new Date(Date.now() + undoWindowSeconds * 1000);

      await this.db.query(
        `INSERT INTO outbox_operations (id, user_id, account_id, idempotency_key, action_type, target_id, payload, status)
         VALUES ($1, $2, $3, $4, 'send_mail', $5, $6, 'undo_window');`,
        [
          sendId,
          userId,
          draft.account_id,
          effectiveIdempotencyKey,
          draft.id,
          JSON.stringify({
            draftId: draft.id,
            dispatchAt: dispatchAt.toISOString(),
            followUpIfNoReplyDays: dto.followUpIfNoReplyDays,
            reminderAt: dto.reminderAt,
          }),
        ],
        userId,
      );

      // Register timer for in-process execution (or worker pull)
      const timer = setTimeout(async () => {
        try {
          await this.dispatchSend(userId, sendId);
        } catch (err) {
          this.logger.error(`Failed to dispatch send for ${sendId}: ${(err as Error).message}`);
        } finally {
          this.activeUndoTimers.delete(sendId);
        }
      }, undoWindowSeconds * 1000);

      if (timer.unref) {
        timer.unref();
      }

      this.activeUndoTimers.set(sendId, timer);

      return {
        sendId,
        status: 'undo_window',
        undoWindowSeconds,
        dispatchAt: dispatchAt.toISOString(),
      };
    }

    // 6. Immediate dispatch (undoWindowSeconds = 0)
    await this.db.query(
      `INSERT INTO outbox_operations (id, user_id, account_id, idempotency_key, action_type, target_id, payload, status)
       VALUES ($1, $2, $3, $4, 'send_mail', $5, $6, 'in_flight');`,
      [
        sendId,
        userId,
        draft.account_id,
        effectiveIdempotencyKey,
        draft.id,
        JSON.stringify({
          draftId: draft.id,
          followUpIfNoReplyDays: dto.followUpIfNoReplyDays,
          reminderAt: dto.reminderAt,
        }),
      ],
      userId,
    );

    return this.dispatchSend(userId, sendId);
  }

  /**
   * Cancels a pending send during the undo window or before scheduled dispatch.
   */
  async cancelSend(userId: string, sendId: string) {
    // Cancel in-memory timer immediately to avoid race condition
    const timer = this.activeUndoTimers.get(sendId);
    if (timer) {
      clearTimeout(timer);
      this.activeUndoTimers.delete(sendId);
    }

    const opRes = await this.db.query(
      `SELECT id, status, payload FROM outbox_operations
       WHERE id = $1 AND user_id = $2;`,
      [sendId, userId],
      userId,
    );

    if (!opRes.rows[0]) {
      throw new NotFoundException(`Send operation ${sendId} not found`);
    }

    const op = opRes.rows[0];
    if (op.status === 'completed' || op.status === 'in_flight') {
      throw new ConflictException('Cannot cancel: message has already been dispatched to provider');
    }

    if (op.status === 'cancelled') {
      return { success: true, message: 'Send operation was already cancelled' };
    }

    // Cancel in DB
    await this.db.query(
      `UPDATE outbox_operations
       SET status = 'cancelled', updated_at = clock_timestamp()
       WHERE id = $1 AND user_id = $2;`,
      [sendId, userId],
      userId,
    );

    // Cancel corresponding scheduled_message if applicable
    if (op.payload?.scheduledMessageId) {
      await this.db.query(
        `UPDATE scheduled_messages
         SET status = 'cancelled', updated_at = clock_timestamp()
         WHERE id = $1 AND user_id = $2;`,
        [op.payload.scheduledMessageId, userId],
        userId,
      );
    }

    this.logger.log(`Send operation ${sendId} successfully cancelled by user ${userId}`);
    return { success: true, message: 'Send successfully cancelled' };
  }

  /**
   * Dispatches the email to the mail provider with exactly-once idempotency,
   * outbox state transitions, and follow-up reminders.
   */
  async dispatchSend(userId: string, sendId: string) {
    const opRes = await this.db.query(
      `SELECT id, account_id, target_id, payload, status FROM outbox_operations
       WHERE id = $1 AND user_id = $2;`,
      [sendId, userId],
      userId,
    );

    if (!opRes.rows[0]) {
      throw new NotFoundException(`Operation ${sendId} not found`);
    }

    const op = opRes.rows[0];
    if (op.status === 'cancelled') {
      this.logger.log(`Operation ${sendId} was cancelled; skipping dispatch.`);
      return { sendId, status: 'cancelled' };
    }

    // Mark in_flight
    await this.db.query(
      `UPDATE outbox_operations SET status = 'in_flight', updated_at = clock_timestamp()
       WHERE id = $1;`,
      [sendId],
      userId,
    );

    const draftId = op.target_id;
    const draftRes = await this.db.query(
      `SELECT id, account_id, reply_thread_id, reply_message_id, to_recipients, cc_recipients,
              bcc_recipients, subject, body_plain, body_html, attachments_meta
       FROM drafts WHERE id = $1 AND user_id = $2;`,
      [draftId, userId],
      userId,
    );

    if (!draftRes.rows[0]) {
      await this.db.query(
        `UPDATE outbox_operations SET status = 'failed', error_message = 'Draft no longer exists' WHERE id = $1;`,
        [sendId],
        userId,
      );
      throw new NotFoundException(`Draft ${draftId} not found for dispatch`);
    }

    const draft = draftRes.rows[0];

    try {
      // 1. Instantiate provider adapter
      const provider = await this.providerFactory.getProviderForAccount(userId, draft.account_id);

      // Helper to ensure NormalizedRecipient array with non-undefined name & email
      const formatRecipients = (list: any[]) =>
        (list || []).map((r) => ({
          name: (typeof r === 'string' ? '' : r.name) || '',
          email: (typeof r === 'string' ? r : r.email || r.address) || '',
        }));

      // 2. Dispatch send to external provider
      const sentResult = await provider.send({
        to: formatRecipients(draft.to_recipients),
        cc: formatRecipients(draft.cc_recipients),
        bcc: formatRecipients(draft.bcc_recipients),
        subject: draft.subject || '',
        bodyPlain: draft.body_plain || '',
        bodyHtml: draft.body_html || '',
        replyThreadId: draft.reply_thread_id || undefined,
        attachments: draft.attachments_meta || [],
      });

      const sentAt = new Date();

      // 3. Mark outbox operation completed
      await this.db.query(
        `UPDATE outbox_operations
         SET status = 'completed',
             payload = payload || $2::jsonb,
             updated_at = clock_timestamp()
         WHERE id = $1;`,
        [
          sendId,
          JSON.stringify({
            providerMessageId: sentResult.messageId,
            threadId: sentResult.threadId,
            sentAt: sentAt.toISOString(),
          }),
        ],
        userId,
      );

      // 4. Evaluate follow-up-if-no-reply and reminders
      if (op.payload?.followUpIfNoReplyDays) {
        const reminderId = uuidv7();
        const dueAt = new Date(Date.now() + op.payload.followUpIfNoReplyDays * 86400 * 1000);
        await this.db.query(
          `INSERT INTO reminders (id, user_id, thread_id, reminder_at, status)
           VALUES ($1, $2, $3, $4, 'pending');`,
          [
            reminderId,
            userId,
            sentResult.threadId || draft.reply_thread_id || null,
            dueAt.toISOString(),
          ],
          userId,
        );
      }

      // 5. Delete sent draft
      await this.db.query(
        `DELETE FROM drafts WHERE id = $1 AND user_id = $2;`,
        [draftId, userId],
        userId,
      );

      return {
        sendId,
        status: 'completed',
        providerMessageId: sentResult.messageId,
        threadId: sentResult.threadId,
        sentAt: sentAt.toISOString(),
      };
    } catch (err) {
      const errorMessage = (err as Error).message;
      this.logger.error(`Provider send failed for draft ${draftId}: ${errorMessage}`);

      await this.db.query(
        `UPDATE outbox_operations
         SET status = 'failed',
             retry_count = retry_count + 1,
             error_message = $2,
             updated_at = clock_timestamp()
         WHERE id = $1;`,
        [sendId, errorMessage],
        userId,
      );

      throw err;
    }
  }

  /**
   * Uploads an attachment with size limits, executable file type blocking,
   * and ClamAV malware scanning.
   */
  async uploadAttachment(userId: string, dto: UploadAttachmentDto) {
    const buffer = Buffer.from(dto.base64Data, 'base64');

    // 1. Size constraint check (max 25MB)
    if (buffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new BadRequestException(
        `Attachment exceeds maximum size of 25MB (${(buffer.length / (1024 * 1024)).toFixed(1)}MB provided)`,
      );
    }

    // 2. Extension constraint check
    const extMatch = dto.filename.match(/\.[^.]+$/);
    const extension = extMatch ? extMatch[0].toLowerCase() : '';
    if (BLOCKED_EXTENSIONS.has(extension)) {
      throw new BadRequestException(
        `Executable file types (${extension}) are blocked for security purposes.`,
      );
    }

    // 3. ClamAV Malware Scanning
    const scanResult = await this.malwareScanner.scanBuffer(buffer, dto.filename);
    if (scanResult.isInfected) {
      this.logger.warn(
        `Attachment "${dto.filename}" blocked: infected with ${scanResult.virusName}`,
      );
      throw new BadRequestException(
        `Attachment rejected by security scanner: malware signature detected (${scanResult.virusName || 'Malware'})`,
      );
    }

    const attachmentId = uuidv7();
    const storagePath = `attachments/${userId}/${attachmentId}_${dto.filename}`;

    return {
      id: attachmentId,
      filename: dto.filename,
      contentType: dto.contentType,
      sizeBytes: buffer.length,
      storagePath,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Background evaluation of follow-up reminders:
   * Inspects threads where a reminder is pending. If an incoming message
   * arrived from an external sender after the user sent the initial email,
   * the reminder is marked auto_resolved (reply was received).
   */
  async evaluateFollowUpReminders(userId: string) {
    const pendingReminders = await this.db.query(
      `SELECT r.id, r.thread_id, r.reminder_at, r.status
       FROM reminders r
       WHERE r.user_id = $1 AND r.status = 'pending' AND r.reminder_at <= clock_timestamp();`,
      [userId],
      userId,
    );

    const triggeredReminders: string[] = [];

    for (const r of pendingReminders.rows) {
      if (!r.thread_id) continue;

      // Check if external reply was received in this thread
      const replies = await this.db.query(
        `SELECT m.id, m.sent_at FROM messages m
         JOIN connected_accounts a ON m.account_id = a.id
         WHERE m.thread_id = $1 AND m.sender_email != a.external_id
         ORDER BY m.sent_at DESC LIMIT 1;`,
        [r.thread_id],
        userId,
      );

      if (replies.rows[0]) {
        // Reply received: auto-resolve reminder
        await this.db.query(
          `UPDATE reminders SET status = 'resolved', updated_at = clock_timestamp() WHERE id = $1;`,
          [r.id],
          userId,
        );
      } else {
        // No reply received: trigger reminder!
        await this.db.query(
          `UPDATE reminders SET status = 'triggered', updated_at = clock_timestamp() WHERE id = $1;`,
          [r.id],
          userId,
        );
        triggeredReminders.push(r.id);
      }
    }

    return { evaluated: pendingReminders.rows.length, triggered: triggeredReminders.length };
  }
}
