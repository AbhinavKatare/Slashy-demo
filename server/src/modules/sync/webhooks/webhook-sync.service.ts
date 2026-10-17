import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { SyncQueueService } from '../queues/sync-queue.service';
import { RedisService } from '../../../common/redis/redis.service';
import { env } from '../../../config/env.config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSyncService {
  private readonly logger = new Logger(WebhookSyncService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly queueService: SyncQueueService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Handle Google Cloud Pub/Sub Push Notification for Gmail watch
   */
  async handleGoogleWebhook(body: any): Promise<{ status: string }> {
    if (!body || !body.message || !body.message.data) {
      return { status: 'ignored_invalid_payload' };
    }

    // Decode Pub/Sub base64 data
    const decodedStr = Buffer.from(body.message.data, 'base64').toString('utf8');
    let data: any;
    try {
      data = JSON.parse(decodedStr);
    } catch (_) {
      return { status: 'ignored_malformed_json' };
    }

    const { emailAddress, historyId } = data;
    if (!emailAddress || !historyId) {
      return { status: 'ignored_missing_attributes' };
    }

    // IDEMPOTENCY / DEDUPLICATION: Check if this historyId for this email was recently processed
    const dedupeKey = `webhook:google:${emailAddress}:${historyId}`;
    const alreadyProcessed = await this.redis.get(dedupeKey);
    if (alreadyProcessed) {
      this.logger.debug(
        `Duplicate Google webhook dropped for ${emailAddress} (historyId ${historyId})`,
      );
      return { status: 'deduplicated' };
    }
    await this.redis.set(dedupeKey, '1', 300); // 5 min dedupe window

    // Locate matching connected account
    const accRes = await this.db.query(
      `SELECT id, user_id FROM connected_accounts WHERE email = $1 AND provider = 'google' AND status = 'active';`,
      [emailAddress],
    );

    if (!accRes.rows[0]) {
      this.logger.warn(
        `Received Google webhook for unmanaged or inactive account: ${emailAddress}`,
      );
      return { status: 'account_not_found' };
    }

    const account = accRes.rows[0];

    // Enqueue incremental sync
    await this.queueService.enqueueIncremental({
      accountId: account.id,
      userId: account.user_id,
      provider: 'google',
      jobType: 'incremental',
      cursor: String(historyId),
    });

    return { status: 'queued' };
  }

  /**
   * Handle Microsoft Graph Change Notification
   */
  async handleMicrosoftWebhook(
    body: any,
    validationToken?: string,
  ): Promise<{ status: string; validationResponse?: string }> {
    // 1. Webhook Handshake Validation Token
    if (validationToken) {
      return {
        status: 'handshake_verified',
        validationResponse: validationToken,
      };
    }

    const notifications = body?.value;
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return { status: 'ignored_empty_value' };
    }

    for (const notif of notifications) {
      // Authenticity verification: check clientState
      const expectedClientState = crypto
        .createHmac('sha256', env.JWT_ACCESS_SECRET)
        .update(notif.subscriptionId || 'graph-sub')
        .digest('hex');

      if (notif.clientState && notif.clientState !== expectedClientState) {
        this.logger.warn('Microsoft webhook rejected: clientState signature mismatch');
        continue;
      }

      // Deduplicate notification ID
      const notifId = notif.resourceData?.id || notif.subscriptionId || Date.now().toString();
      const dedupeKey = `webhook:ms:${notifId}`;
      const alreadyProcessed = await this.redis.get(dedupeKey);
      if (alreadyProcessed) {
        continue;
      }
      await this.redis.set(dedupeKey, '1', 300);

      // Locate account associated with subscription or change
      const accRes = await this.db.query(
        `SELECT id, user_id FROM connected_accounts WHERE provider = 'microsoft' AND status = 'active' LIMIT 1;`,
      );

      if (accRes.rows[0]) {
        const account = accRes.rows[0];
        await this.queueService.enqueueIncremental({
          accountId: account.id,
          userId: account.user_id,
          provider: 'microsoft',
          jobType: 'incremental',
        });
      }
    }

    return { status: 'processed' };
  }

  /**
   * Periodic Fallback Poller for accounts with stale sync (missed push notifications)
   */
  async runFallbackPoller(): Promise<{ queuedAccounts: number }> {
    const staleAccounts = await this.db.query(
      `SELECT a.id, a.user_id, a.provider, c.cursor_value
       FROM connected_accounts a
       LEFT JOIN sync_cursors c ON a.id = c.account_id AND c.sync_key = 'delta'
       WHERE a.status = 'active'
         AND (c.last_synced_at IS NULL OR c.last_synced_at < clock_timestamp() - INTERVAL '30 minutes')
       LIMIT 50;`,
    );

    for (const row of staleAccounts.rows) {
      await this.queueService.enqueueIncremental({
        accountId: row.id,
        userId: row.user_id,
        provider: row.provider,
        jobType: 'incremental',
        cursor: row.cursor_value,
      });
    }

    return { queuedAccounts: staleAccounts.rows.length };
  }
}
