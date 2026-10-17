import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { MailProviderFactory } from '../../mail/adapters/mail-provider.factory';
import { SyncJobData, SyncQueueService } from '../queues/sync-queue.service';
import { NormalizedThread } from '../../mail/domain/normalized-mail.model';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class SyncProcessorService {
  private readonly logger = new Logger(SyncProcessorService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly providerFactory: MailProviderFactory,
    private readonly queueService: SyncQueueService,
  ) {}

  /**
   * Process initial bounded backfill with resume checkpointing
   */
  async processBackfill(data: SyncJobData): Promise<{ syncedCount: number; nextCursor?: string }> {
    const provider = await this.providerFactory.getProviderForAccount(data.userId, data.accountId);
    const limit = data.maxThreads || 50;

    // 1. Fetch current backfill cursor from sync_cursors table if not passed in data
    let currentCursor = data.cursor;
    if (!currentCursor) {
      const cursorRes = await this.db.query(
        `SELECT cursor_value FROM sync_cursors WHERE account_id = $1 AND sync_key = 'backfill' AND user_id = $2;`,
        [data.accountId, data.userId],
        data.userId,
      );
      currentCursor = cursorRes.rows[0]?.cursor_value || undefined;
    }

    // 2. Update status to 'backfilling'
    await this.updateSyncCursorStatus(
      data.userId,
      data.accountId,
      'backfill',
      'backfilling',
      currentCursor,
    );

    // 3. Fetch thread batch from provider
    const page = await provider.listThreads({
      cursor: currentCursor,
      limit,
    });

    // 4. Ingest threads & messages into database
    await this.persistThreads(data.userId, data.accountId, page.threads);

    // 5. Update cursor checkpoint in database
    if (page.nextCursor) {
      await this.updateSyncCursorStatus(
        data.userId,
        data.accountId,
        'backfill',
        'idle',
        page.nextCursor,
      );

      // Enqueue next backfill page (resumable)
      await this.queueService.enqueueBackfill({
        ...data,
        cursor: page.nextCursor,
      });
    } else {
      // Backfill completed! Initialize delta cursor
      const initialDelta = await provider.getDeltaHistory();
      await this.updateSyncCursorStatus(
        data.userId,
        data.accountId,
        'delta',
        'idle',
        initialDelta.nextCursor,
      );
      this.logger.log(
        `Backfill completed for account ${data.accountId}. Initialized delta cursor.`,
      );
    }

    return {
      syncedCount: page.threads.length,
      nextCursor: page.nextCursor,
    };
  }

  /**
   * Process incremental sync via Gmail historyId or Graph delta query
   */
  async processIncremental(
    data: SyncJobData,
  ): Promise<{ updatedCount: number; nextCursor: string }> {
    const provider = await this.providerFactory.getProviderForAccount(data.userId, data.accountId);

    // Fetch existing delta cursor
    const cursorRes = await this.db.query(
      `SELECT cursor_value FROM sync_cursors WHERE account_id = $1 AND sync_key = 'delta' AND user_id = $2;`,
      [data.accountId, data.userId],
      data.userId,
    );
    const cursor = data.cursor || cursorRes.rows[0]?.cursor_value;

    try {
      const delta = await provider.getDeltaHistory(cursor);

      // 1. Ingest updated threads
      if (delta.threads.length > 0) {
        await this.persistThreads(data.userId, data.accountId, delta.threads);
      }

      // 2. Handle deleted threads
      if (delta.deletedThreadIds.length > 0) {
        await this.db.query(
          `UPDATE threads SET deleted_at = clock_timestamp(), folder = 'trash'
           WHERE account_id = $1 AND user_id = $2 AND external_thread_id = ANY($3);`,
          [data.accountId, data.userId, delta.deletedThreadIds],
          data.userId,
        );
      }

      // 3. Update cursor
      await this.updateSyncCursorStatus(
        data.userId,
        data.accountId,
        'delta',
        'idle',
        delta.nextCursor,
      );

      return {
        updatedCount: delta.threads.length,
        nextCursor: delta.nextCursor,
      };
    } catch (err: any) {
      // CHAOS / RESILIENCE: Cursor Invalidation Handling
      // If history expired (e.g. 404 or 410) or invalid cursor, initiate a clean resync
      if (
        err.status === 404 ||
        err.status === 410 ||
        err.message?.includes('historyId') ||
        err.message?.includes('ResyncRequired')
      ) {
        this.logger.warn(
          `Cursor invalidation detected for account ${data.accountId}. Triggering clean full resync.`,
        );

        // Reset cursor and trigger fresh backfill
        await this.updateSyncCursorStatus(data.userId, data.accountId, 'delta', 'error', null);
        await this.queueService.enqueueBackfill({
          ...data,
          cursor: undefined,
          jobType: 'backfill',
        });
        return { updatedCount: 0, nextCursor: 'reset' };
      }

      throw err;
    }
  }

  /**
   * Helper: Persist normalized threads and constituent messages
   */
  async persistThreads(
    userId: string,
    accountId: string,
    threads: NormalizedThread[],
  ): Promise<void> {
    for (const t of threads) {
      await this.db.transaction(async (client) => {
        // Upsert thread
        const threadRes = await client.query(
          `INSERT INTO threads (
             id, user_id, account_id, external_thread_id, subject, snippet,
             is_unread, is_starred, folder, has_attachments, message_count, last_message_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE
             SET subject = EXCLUDED.subject,
                 snippet = EXCLUDED.snippet,
                 is_unread = EXCLUDED.is_unread,
                 is_starred = EXCLUDED.is_starred,
                 folder = EXCLUDED.folder,
                 has_attachments = EXCLUDED.has_attachments,
                 message_count = EXCLUDED.message_count,
                 last_message_at = EXCLUDED.last_message_at,
                 updated_at = clock_timestamp()
           RETURNING id;`,
          [
            t.id,
            userId,
            accountId,
            t.externalThreadId,
            t.subject,
            t.snippet,
            t.isUnread,
            t.isStarred,
            t.folder,
            (t.messages || []).some((m) => m.attachments.length > 0),
            t.messageCount,
            t.lastMessageAt.toISOString(),
          ],
        );

        const threadId = threadRes?.rows?.[0]?.id || t.id;

        // Upsert constituent messages
        for (const m of t.messages || []) {
          await client.query(
            `INSERT INTO messages (
               id, user_id, thread_id, account_id, external_message_id, sender_name,
               sender_email, to_recipients, cc_recipients, bcc_recipients, is_unread, sent_at
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO UPDATE
               SET is_unread = EXCLUDED.is_unread,
                   sent_at = EXCLUDED.sent_at;`,
            [
              m.id,
              userId,
              threadId,
              accountId,
              m.externalMessageId || m.id,
              m.sender.name,
              m.sender.email,
              JSON.stringify(m.to),
              JSON.stringify(m.cc),
              JSON.stringify(m.bcc),
              m.isUnread,
              m.sentAt.toISOString(),
            ],
          );

          // Upsert message body
          await client.query(
            `INSERT INTO message_bodies (message_id, user_id, body_plain, body_html, snippet)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (message_id) DO UPDATE
               SET body_plain = EXCLUDED.body_plain,
                   body_html = EXCLUDED.body_html,
                   snippet = EXCLUDED.snippet;`,
            [m.id, userId, m.bodyPlain, m.bodyHtml, m.snippet],
          );
        }
      }, userId);
    }
  }

  private async updateSyncCursorStatus(
    userId: string,
    accountId: string,
    syncKey: string,
    status: string,
    cursorValue?: string | null,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO sync_cursors (id, user_id, account_id, sync_key, cursor_value, status, last_synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, clock_timestamp())
       ON CONFLICT (account_id, sync_key) DO UPDATE
         SET cursor_value = COALESCE(EXCLUDED.cursor_value, sync_cursors.cursor_value),
             status = EXCLUDED.status,
             last_synced_at = clock_timestamp(),
             updated_at = clock_timestamp();`,
      [uuidv7(), userId, accountId, syncKey, cursorValue || null, status],
      userId,
    );
  }
}
