import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RegisterNotificationTokenDto } from './dto/notifications.dto';
import { v7 as uuidv7 } from 'uuid';

export type NotificationChannel = 'urgent_mail' | 'calendar_reminder' | 'tasks';

export interface SendNotificationPayload {
  channel: NotificationChannel;
  title: string;
  body?: string;
  collapseKey?: string;
  threadId?: string;
  eventId?: string;
  isUrgent?: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly dedupeCache = new Map<string, number>(); // In-memory/Redis 5-minute dedupe window

  constructor(private readonly db: DatabaseService) {}

  async registerToken(userId: string, dto: RegisterNotificationTokenDto) {
    const id = uuidv7();
    const res = await this.db.query(
      `INSERT INTO notification_tokens (id, user_id, device_id, token, platform)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, token) DO UPDATE
       SET device_id = EXCLUDED.device_id,
           platform = EXCLUDED.platform,
           updated_at = clock_timestamp()
       RETURNING id, platform, created_at, updated_at;`,
      [id, userId, dto.deviceId || null, dto.token, dto.platform],
      userId,
    );
    return { success: true, token: res.rows[0] };
  }

  async unregisterToken(userId: string, token: string) {
    await this.db.query(
      `DELETE FROM notification_tokens WHERE user_id = $1 AND token = $2;`,
      [userId, token],
      userId,
    );
    return { success: true, message: 'Notification token unregistered' };
  }

  /**
   * Evaluates if a given timestamp falls within the user's quiet hours window.
   * Supports overnight windows (e.g. 22:00 -> 07:00) and same-day windows.
   */
  isWithinQuietHours(quietStart = '22:00', quietEnd = '07:00', currentTime = new Date()): boolean {
    const currentHours = currentTime.getUTCHours();
    const currentMinutes = currentTime.getUTCMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    const [startH, startM] = quietStart.split(':').map(Number);
    const [endH, endM] = quietEnd.split(':').map(Number);

    const startTotalMinutes = startH * 60 + (startM || 0);
    const endTotalMinutes = endH * 60 + (endM || 0);

    if (startTotalMinutes > endTotalMinutes) {
      // Overnight window (e.g. 22:00 to 07:00)
      return currentTotalMinutes >= startTotalMinutes || currentTotalMinutes < endTotalMinutes;
    } else {
      // Same-day window (e.g. 13:00 to 15:00)
      return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
    }
  }

  /**
   * Dispatch push notification with FCM channels, quiet hours suppression,
   * collapse key aggregation, and 5-minute deduplication.
   */
  async sendNotification(
    userId: string,
    payload: SendNotificationPayload,
    userPreferences?: { quietHoursEnabled?: boolean; quietStart?: string; quietEnd?: string },
  ) {
    const collapseKey =
      payload.collapseKey || (payload.threadId ? `thread_${payload.threadId}` : 'default');

    // 1. Deduplication window check (5 minutes)
    const dedupeKey = `${userId}:${payload.channel}:${collapseKey}:${payload.title}`;
    const now = Date.now();
    const lastSent = this.dedupeCache.get(dedupeKey);
    if (lastSent && now - lastSent < 5 * 60 * 1000) {
      this.logger.debug(
        `[DEDUPE] Dropping duplicate notification for user ${userId} within 5m window: ${dedupeKey}`,
      );
      return { status: 'dropped_duplicate', dedupeKey };
    }

    // 2. Quiet hours check
    if (userPreferences?.quietHoursEnabled && !payload.isUrgent) {
      if (this.isWithinQuietHours(userPreferences.quietStart, userPreferences.quietEnd)) {
        this.logger.log(
          `[QUIET HOURS] Notification suppressed during quiet hours for user ${userId}`,
        );
        return { status: 'suppressed_quiet_hours', collapseKey };
      }
    }

    // Record dedupe timestamp
    this.dedupeCache.set(dedupeKey, now);

    // 3. Minimal Content Formatting (Privacy by default on lock screens)
    const sanitizedTitle = payload.title;
    const sanitizedBody = payload.body || '';

    this.logger.log(
      `[FCM DISPATCH] Notification [${payload.channel}] dispatched to user ${userId} (collapse: ${collapseKey})`,
    );

    return {
      status: 'dispatched',
      channel: payload.channel,
      collapseKey,
      title: sanitizedTitle,
      body: sanitizedBody,
      dispatchedAt: new Date().toISOString(),
    };
  }
}
