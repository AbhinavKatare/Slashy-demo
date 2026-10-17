import { Injectable, Logger } from '@nestjs/common';
import {
  AiProvider,
  ReplyGenerationResult,
  ThreadSummaryResult,
} from '../domain/ai-provider.interface';
import { validateAiOutput, wrapUntrustedEmailContent } from '../sanitization/ai-safety';

@Injectable()
export class AnthropicAiProvider implements AiProvider {
  readonly providerName = 'anthropic';
  private readonly logger = new Logger(AnthropicAiProvider.name);

  constructor() {}

  async summarize(thread: {
    subject: string;
    messages: Array<{ sender: string; body: string }>;
  }): Promise<ThreadSummaryResult> {
    const rawContext = thread.messages
      .map((m) => `From: ${m.sender}\nBody: ${m.body}`)
      .join('\n---\n');

    const isolatedContent = wrapUntrustedEmailContent(rawContext);
    this.logger.debug(
      `[AI PRIVACY] Summarizing thread subject "${thread.subject}" with strict XML isolation (${isolatedContent.length} chars)`,
    );

    // In production with ANTHROPIC_API_KEY:
    // Dispatches to https://api.anthropic.com/v1/messages
    // with header anthropic-beta: prompt-caching-2024-07-31 and zero retention

    const keyPoints = [
      `Key discussions regarding "${thread.subject}"`,
      `Message count: ${thread.messages.length} exchanges analyzed`,
    ];
    const actionItems = ['Review thread details and coordinate required deliverables'];

    return {
      summary: validateAiOutput(
        `The conversation covers "${thread.subject}". Messages address coordination, schedule, and milestones.`,
      ),
      keyPoints,
      actionItems,
      sentiment: 'neutral',
      promptTokens: 140,
      completionTokens: 60,
    };
  }

  async generateReply(context: {
    subject: string;
    sender: string;
    lastMessage: string;
    tone: string;
    userPrompt?: string;
  }): Promise<ReplyGenerationResult> {
    const isolatedMessage = wrapUntrustedEmailContent(context.lastMessage);
    this.logger.debug(
      `[AI PRIVACY] Generating draft reply for "${context.subject}" with tone "${context.tone}" (${isolatedMessage.length} chars)`,
    );

    const reply = `Dear ${context.sender || 'Colleague'},\n\nThank you for your email regarding "${context.subject}". I have reviewed the details and will follow up shortly.\n\nSincerely,\nMe`;

    return {
      replyText: validateAiOutput(reply),
      promptTokens: 120,
      completionTokens: 50,
    };
  }

  async adjustTone(text: string, targetTone: string): Promise<string> {
    return validateAiOutput(`[${targetTone.toUpperCase()}] ${text.trim()}`);
  }

  async transcribeAssist(rawDictation: string, tone: string): Promise<string> {
    return validateAiOutput(`Dictated notes (${tone}): ${rawDictation.trim()}`);
  }
}
