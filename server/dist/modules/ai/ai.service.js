"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const mock_ai_provider_1 = require("./providers/mock-ai.provider");
const anthropic_ai_provider_1 = require("./providers/anthropic-ai.provider");
const ai_safety_1 = require("./sanitization/ai-safety");
const uuid_1 = require("uuid");
const DAILY_USER_QUOTA = 100;
let AiService = AiService_1 = class AiService {
    db;
    mockProvider;
    anthropicProvider;
    logger = new common_1.Logger(AiService_1.name);
    provider;
    constructor(db, mockProvider, anthropicProvider) {
        this.db = db;
        this.mockProvider = mockProvider;
        this.anthropicProvider = anthropicProvider;
        this.provider =
            process.env.AI_PROVIDER === 'anthropic' ? this.anthropicProvider : this.mockProvider;
    }
    async checkAndIncrementQuota(userId) {
        const todayCount = await this.db.query(`SELECT COUNT(*)::int AS count FROM ai_requests 
       WHERE user_id = $1 AND created_at >= date_trunc('day', clock_timestamp());`, [userId], userId);
        const count = todayCount.rows[0]?.count || 0;
        if (count >= DAILY_USER_QUOTA) {
            this.logger.warn(`User ${userId} exceeded daily AI quota (${count}/${DAILY_USER_QUOTA})`);
            throw new common_1.HttpException(`Daily AI quota of ${DAILY_USER_QUOTA} requests exceeded. Quota resets at 00:00 UTC.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    async summarizeThread(userId, dto) {
        await this.checkAndIncrementQuota(userId);
        const threadRes = await this.db.query(`SELECT t.id, t.subject,
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
       GROUP BY t.id;`, [dto.threadId, userId], userId);
        if (!threadRes.rows[0]) {
            throw new common_1.NotFoundException(`Thread ${dto.threadId} not found`);
        }
        const row = threadRes.rows[0];
        const rawMessages = row.messages;
        const shouldRedact = dto.redactPii !== false;
        const sanitizedMessages = rawMessages.map((m) => ({
            sender: shouldRedact ? (0, ai_safety_1.redactPii)(m.sender) : m.sender,
            body: shouldRedact ? (0, ai_safety_1.redactPii)(m.body) : m.body,
        }));
        const result = await this.provider.summarize({
            subject: row.subject,
            messages: sanitizedMessages,
        });
        await this.db.query(`INSERT INTO ai_requests (id, user_id, request_type, tone, prompt_tokens, completion_tokens, status)
       VALUES ($1, $2, 'summarize', NULL, $3, $4, 'completed');`, [(0, uuid_1.v7)(), userId, result.promptTokens, result.completionTokens], userId);
        return {
            threadId: dto.threadId,
            subject: row.subject,
            summary: result.summary,
            keyPoints: result.keyPoints,
            actionItems: result.actionItems,
            sentiment: result.sentiment,
        };
    }
    async generateReply(userId, dto) {
        await this.checkAndIncrementQuota(userId);
        const threadRes = await this.db.query(`SELECT t.id, t.subject, m.sender_name, b.body_plain
       FROM threads t
       LEFT JOIN messages m ON t.id = m.thread_id
       LEFT JOIN message_bodies b ON m.id = b.message_id
       WHERE t.id = $1 AND t.user_id = $2
       ORDER BY m.sent_at DESC
       LIMIT 1;`, [dto.threadId, userId], userId);
        if (!threadRes.rows[0]) {
            throw new common_1.NotFoundException(`Thread ${dto.threadId} not found`);
        }
        const row = threadRes.rows[0];
        const shouldRedact = dto.redactPii !== false;
        const sender = shouldRedact ? (0, ai_safety_1.redactPii)(row.sender_name || '') : row.sender_name || '';
        const body = shouldRedact ? (0, ai_safety_1.redactPii)(row.body_plain || '') : row.body_plain || '';
        const tone = dto.tone || 'professional';
        const result = await this.provider.generateReply({
            subject: row.subject,
            sender,
            lastMessage: body,
            tone,
            userPrompt: dto.userPrompt,
        });
        await this.db.query(`INSERT INTO ai_requests (id, user_id, request_type, tone, prompt_tokens, completion_tokens, status)
       VALUES ($1, $2, 'draft_reply', $3, $4, $5, 'completed');`, [(0, uuid_1.v7)(), userId, tone, result.promptTokens, result.completionTokens], userId);
        return {
            threadId: dto.threadId,
            tone,
            suggestedSubject: `Re: ${row.subject}`,
            suggestedBody: result.replyText,
        };
    }
    async adjustTone(userId, dto) {
        await this.checkAndIncrementQuota(userId);
        const adjusted = await this.provider.adjustTone(dto.text, dto.targetTone);
        await this.db.query(`INSERT INTO ai_requests (id, user_id, request_type, tone, prompt_tokens, completion_tokens, status)
       VALUES ($1, $2, 'adjust_tone', $3, 80, 50, 'completed');`, [(0, uuid_1.v7)(), userId, dto.targetTone], userId);
        return {
            targetTone: dto.targetTone,
            adjustedText: adjusted,
        };
    }
    async transcribeAssist(userId, dto) {
        await this.checkAndIncrementQuota(userId);
        const tone = dto.tone || 'professional';
        const formattedDraft = await this.provider.transcribeAssist(dto.rawDictation, tone);
        await this.db.query(`INSERT INTO ai_requests (id, user_id, request_type, tone, prompt_tokens, completion_tokens, status)
       VALUES ($1, $2, 'transcribe_assist', $3, 90, 60, 'completed');`, [(0, uuid_1.v7)(), userId, tone], userId);
        return {
            tone,
            draftText: formattedDraft,
        };
    }
    async *streamReplyTokens(userId, dto) {
        const fullReply = await this.generateReply(userId, dto);
        const words = fullReply.suggestedBody.split(' ');
        for (const word of words) {
            yield `data: ${JSON.stringify({ token: word + ' ' })}\n\n`;
        }
        yield `data: [DONE]\n\n`;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        mock_ai_provider_1.MockAiProvider,
        anthropic_ai_provider_1.AnthropicAiProvider])
], AiService);
//# sourceMappingURL=ai.service.js.map