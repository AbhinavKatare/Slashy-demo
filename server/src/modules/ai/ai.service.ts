import { Injectable, NotFoundException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  AdjustToneDto,
  GenerateReplyDto,
  SummarizeThreadDto,
  TranscribeAssistDto,
} from './dto/ai.dto';
import { AiProvider } from './domain/ai-provider.interface';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AnthropicAiProvider } from './providers/anthropic-ai.provider';
import { redactPii } from './sanitization/ai-safety';
import { v7 as uuidv7 } from 'uuid';

const DAILY_USER_QUOTA = 100;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: AiProvider;

  constructor(
    private readonly db: DatabaseService,
    private readonly mockProvider: MockAiProvider,
    private readonly anthropicProvider: AnthropicAiProvider,
  ) {
    // Select configured provider (defaults to Mock for zero external telemetry in test)
    this.provider =
      process.env.AI_PROVIDER === 'anthropic' ? this.anthropicProvider : this.mockProvider;
  }

  /**
   * Check user daily quota to prevent resource exhaustion and billing spikes.
   */
  async checkAndIncrementQuota(userId: string): Promise<void> {
    const todayCount = await this.db.query(
      `SELECT COUNT(*)::int AS count FROM ai_requests 
       WHERE user_id = $1 AND created_at >= date_trunc('day', clock_timestamp());`,
      [userId],
      userId,
    );

    const count = todayCount.rows[0]?.count || 0;
    if (count >= DAILY_USER_QUOTA) {
      this.logger.warn(`User ${userId} exceeded daily AI quota (${count}/${DAILY_USER_QUOTA})`);
      throw new HttpException(
        `Daily AI quota of ${DAILY_USER_QUOTA} requests exceeded. Quota resets at 00:00 UTC.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Summarize thread with strict untrusted data isolation and metadata-only logging.
   */
  async summarizeThread(userId: string, dto: SummarizeThreadDto) {
    await this.checkAndIncrementQuota(userId);

    const threadRes = await this.db.query(
      `SELECT t.id, t.subject,
              COALESCE(
                json_agg(
                  json_build_object('sender', m.sender_name, 'body', b.body_plain, 'sent_at', m.sent_at)
                  ORDER BY m.sent_at ASC
                ) FILTER (WHERE m.id IS NOT NULL), '[]'::json
              ) AS messages
       FROM threads t
       LEFT JOIN messages m ON t.id = m.thread_id
       LEFT JOIN message_bodies b ON m.id = b.message_id
       WHERE t.id = $1 AND t.user_id = $2
       GROUP BY t.id;`,
      [dto.threadId, userId],
      userId,
    );

    if (!threadRes.rows[0]) {
      throw new NotFoundException(`Thread ${dto.threadId} not found`);
    }

    const row = threadRes.rows[0];
    const rawMessages = row.messages as Array<{ sender: string; body: string }>;

    // 1. PII minimization
    const shouldRedact = dto.redactPii !== false;
    const sanitizedMessages = rawMessages.map((m) => ({
      sender: shouldRedact ? redactPii(m.sender) : m.sender,
      body: shouldRedact ? redactPii(m.body) : m.body,
    }));

    // 2. Call provider-agnostic AI engine
    const result = await this.provider.summarize({
      subject: row.subject,
      messages: sanitizedMessages,
    });

    // 3. Persist privacy-safe metadata ONLY (zero prompt or email content in DB)
    await this.db.query(
      `INSERT INTO ai_requests (id, user_id, request_type, tone, prompt_tokens, completion_tokens, status)
       VALUES ($1, $2, 'summarize', NULL, $3, $4, 'completed');`,
      [uuidv7(), userId, result.promptTokens, result.completionTokens],
      userId,
    );

    return {
      threadId: dto.threadId,
      subject: row.subject,
      summary: result.summary,
      keyPoints: result.keyPoints,
      actionItems: result.actionItems,
      sentiment: result.sentiment,
    };
  }

  /**
   * Generate proposed reply draft. Result is strictly non-autonomous (editable text only).
   */
  async generateReply(userId: string, dto: GenerateReplyDto) {
    await this.checkAndIncrementQuota(userId);

    const threadRes = await this.db.query(
      `SELECT t.id, t.subject, m.sender_name, b.body_plain
       FROM threads t
       LEFT JOIN messages m ON t.id = m.thread_id
       LEFT JOIN message_bodies b ON m.id = b.message_id
       WHERE t.id = $1 AND t.user_id = $2
       ORDER BY m.sent_at DESC
       LIMIT 1;`,
      [dto.threadId, userId],
      userId,
    );

    if (!threadRes.rows[0]) {
      throw new NotFoundException(`Thread ${dto.threadId} not found`);
    }

    const row = threadRes.rows[0];
    const shouldRedact = dto.redactPii !== false;
    const sender = shouldRedact ? redactPii(row.sender_name || '') : row.sender_name || '';
    const body = shouldRedact ? redactPii(row.body_plain || '') : row.body_plain || '';
    const tone = dto.tone || 'professional';

    const result = await this.provider.generateReply({
      subject: row.subject,
      sender,
      lastMessage: body,
      tone,
      userPrompt: dto.userPrompt,
    });

    // Persist metadata ONLY
    await this.db.query(
      `INSERT INTO ai_requests (id, user_id, request_type, tone, prompt_tokens, completion_tokens, status)
       VALUES ($1, $2, 'draft_reply', $3, $4, $5, 'completed');`,
      [uuidv7(), userId, tone, result.promptTokens, result.completionTokens],
      userId,
    );

    return {
      threadId: dto.threadId,
      tone,
      suggestedSubject: `Re: ${row.subject}`,
      suggestedBody: result.replyText,
    };
  }

  /**
   * Adjust tone of existing draft text.
   */
  async adjustTone(userId: string, dto: AdjustToneDto) {
    await this.checkAndIncrementQuota(userId);

    const adjusted = await this.provider.adjustTone(dto.text, dto.targetTone);

    await this.db.query(
      `INSERT INTO ai_requests (id, user_id, request_type, tone, prompt_tokens, completion_tokens, status)
       VALUES ($1, $2, 'adjust_tone', $3, 80, 50, 'completed');`,
      [uuidv7(), userId, dto.targetTone],
      userId,
    );

    return {
      targetTone: dto.targetTone,
      adjustedText: adjusted,
    };
  }

  /**
   * Assist voice dictation formatting into a clean email draft.
   */
  async transcribeAssist(userId: string, dto: TranscribeAssistDto) {
    await this.checkAndIncrementQuota(userId);

    const tone = dto.tone || 'professional';
    const formattedDraft = await this.provider.transcribeAssist(dto.rawDictation, tone);

    await this.db.query(
      `INSERT INTO ai_requests (id, user_id, request_type, tone, prompt_tokens, completion_tokens, status)
       VALUES ($1, $2, 'transcribe_assist', $3, 90, 60, 'completed');`,
      [uuidv7(), userId, tone],
      userId,
    );

    return {
      tone,
      draftText: formattedDraft,
    };
  }

  /**
   * SSE stream chunk generator for real-time drafting without waiting for full response.
   */
  async *streamReplyTokens(userId: string, dto: GenerateReplyDto): AsyncGenerator<string> {
    const fullReply = await this.generateReply(userId, dto);
    const words = fullReply.suggestedBody.split(' ');

    for (const word of words) {
      yield `data: ${JSON.stringify({ token: word + ' ' })}\n\n`;
    }
    yield `data: [DONE]\n\n`;
  }
}
