import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateDraftDto, UpdateDraftDto } from './dto/drafts.dto';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class DraftsService {
  constructor(private readonly db: DatabaseService) {}

  async listDrafts(userId: string, accountId?: string) {
    const params: any[] = [userId];
    let sql = `
      SELECT id, account_id, reply_thread_id, reply_message_id, to_recipients, cc_recipients,
             bcc_recipients, subject, body_plain, body_html, attachments_meta, created_at, updated_at
      FROM drafts
      WHERE user_id = $1
    `;
    if (accountId) {
      params.push(accountId);
      sql += ` AND account_id = $2`;
    }
    sql += ` ORDER BY updated_at DESC;`;

    const res = await this.db.query(sql, params, userId);
    return res.rows.map((r) => ({
      id: r.id,
      accountId: r.account_id,
      replyThreadId: r.reply_thread_id,
      replyMessageId: r.reply_message_id,
      toRecipients: r.to_recipients,
      ccRecipients: r.cc_recipients,
      bccRecipients: r.bcc_recipients,
      subject: r.subject,
      bodyPlain: r.body_plain,
      bodyHtml: r.body_html,
      attachmentsMeta: r.attachments_meta,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    }));
  }

  async getDraft(userId: string, draftId: string) {
    const res = await this.db.query(
      `SELECT id, account_id, reply_thread_id, reply_message_id, to_recipients, cc_recipients,
              bcc_recipients, subject, body_plain, body_html, attachments_meta, created_at, updated_at
       FROM drafts
       WHERE id = $1 AND user_id = $2;`,
      [draftId, userId],
      userId,
    );
    if (!res.rows[0]) {
      throw new NotFoundException(`Draft ${draftId} not found`);
    }
    const r = res.rows[0];
    return {
      id: r.id,
      accountId: r.account_id,
      replyThreadId: r.reply_thread_id,
      replyMessageId: r.reply_message_id,
      toRecipients: r.to_recipients,
      ccRecipients: r.cc_recipients,
      bccRecipients: r.bcc_recipients,
      subject: r.subject,
      bodyPlain: r.body_plain,
      bodyHtml: r.body_html,
      attachmentsMeta: r.attachments_meta,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };
  }

  async createDraft(userId: string, dto: CreateDraftDto) {
    const id = uuidv7();
    const res = await this.db.query(
      `INSERT INTO drafts (id, user_id, account_id, reply_thread_id, reply_message_id, to_recipients, cc_recipients, bcc_recipients, subject, body_plain, body_html, attachments_meta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, created_at, updated_at;`,
      [
        id,
        userId,
        dto.accountId,
        dto.replyThreadId || null,
        dto.replyMessageId || null,
        JSON.stringify(dto.toRecipients || []),
        JSON.stringify(dto.ccRecipients || []),
        JSON.stringify(dto.bccRecipients || []),
        dto.subject || '',
        dto.bodyPlain || '',
        dto.bodyHtml || '',
        JSON.stringify(dto.attachmentsMeta || []),
      ],
      userId,
    );
    return { id, ...res.rows[0] };
  }

  async updateDraft(userId: string, draftId: string, dto: UpdateDraftDto) {
    const res = await this.db.query(
      `UPDATE drafts
       SET account_id = COALESCE($3, account_id),
           reply_thread_id = $4,
           reply_message_id = $5,
           to_recipients = COALESCE($6, to_recipients),
           cc_recipients = COALESCE($7, cc_recipients),
           bcc_recipients = COALESCE($8, bcc_recipients),
           subject = COALESCE($9, subject),
           body_plain = COALESCE($10, body_plain),
           body_html = COALESCE($11, body_html),
           attachments_meta = COALESCE($12, attachments_meta),
           updated_at = clock_timestamp()
       WHERE id = $1 AND user_id = $2
       RETURNING id, updated_at;`,
      [
        draftId,
        userId,
        dto.accountId,
        dto.replyThreadId || null,
        dto.replyMessageId || null,
        dto.toRecipients ? JSON.stringify(dto.toRecipients) : null,
        dto.ccRecipients ? JSON.stringify(dto.ccRecipients) : null,
        dto.bccRecipients ? JSON.stringify(dto.bccRecipients) : null,
        dto.subject ?? null,
        dto.bodyPlain ?? null,
        dto.bodyHtml ?? null,
        dto.attachmentsMeta ? JSON.stringify(dto.attachmentsMeta) : null,
      ],
      userId,
    );

    if (!res.rows[0]) {
      throw new NotFoundException(`Draft ${draftId} not found`);
    }
    return res.rows[0];
  }

  async deleteDraft(userId: string, draftId: string) {
    const res = await this.db.query(
      `DELETE FROM drafts WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [draftId, userId],
      userId,
    );
    if (!res.rows[0]) {
      throw new NotFoundException(`Draft ${draftId} not found`);
    }
    return { success: true, message: 'Draft deleted' };
  }
}
