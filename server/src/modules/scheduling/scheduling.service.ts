import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ScheduleDraftDto } from './dto/scheduling.dto';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class SchedulingService {
  constructor(private readonly db: DatabaseService) {}

  async scheduleDraft(userId: string, dto: ScheduleDraftDto) {
    const scheduledDate = new Date(dto.scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt must be a valid timestamp in the future');
    }

    // Verify draft exists and belongs to user
    const draftRes = await this.db.query(
      `SELECT id FROM drafts WHERE id = $1 AND user_id = $2;`,
      [dto.draftId, userId],
      userId,
    );
    if (!draftRes.rows[0]) {
      throw new NotFoundException(`Draft ${dto.draftId} not found`);
    }

    const id = uuidv7();
    const res = await this.db.query(
      `INSERT INTO scheduled_messages (id, user_id, account_id, draft_id, scheduled_at, timezone, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, scheduled_at, timezone, status, created_at;`,
      [id, userId, dto.accountId, dto.draftId, scheduledDate.toISOString(), dto.timezone || 'UTC'],
      userId,
    );

    return res.rows[0];
  }

  async listScheduled(userId: string) {
    const res = await this.db.query(
      `SELECT sm.id, sm.account_id, sm.draft_id, sm.scheduled_at, sm.timezone, sm.status,
              d.subject, d.to_recipients
       FROM scheduled_messages sm
       LEFT JOIN drafts d ON sm.draft_id = d.id
       WHERE sm.user_id = $1 AND sm.status = 'pending'
       ORDER BY sm.scheduled_at ASC;`,
      [userId],
      userId,
    );
    return res.rows.map((r) => ({
      id: r.id,
      accountId: r.account_id,
      draftId: r.draft_id,
      subject: r.subject || '',
      toRecipients: r.to_recipients || [],
      scheduledAt: r.scheduled_at.toISOString(),
      timezone: r.timezone,
      status: r.status,
    }));
  }

  async cancelScheduled(userId: string, id: string) {
    const res = await this.db.query(
      `UPDATE scheduled_messages
       SET status = 'cancelled', updated_at = clock_timestamp()
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING id;`,
      [id, userId],
      userId,
    );

    if (!res.rows[0]) {
      throw new NotFoundException(`Scheduled message ${id} not found or already dispatched`);
    }
    return { success: true, message: 'Scheduled send cancelled' };
  }
}
