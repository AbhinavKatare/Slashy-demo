import { Injectable, Logger } from '@nestjs/common';
import {
  AiProvider,
  ReplyGenerationResult,
  ThreadSummaryResult,
} from '../domain/ai-provider.interface';
import { validateAiOutput } from '../sanitization/ai-safety';

@Injectable()
export class MockAiProvider implements AiProvider {
  readonly providerName = 'mock';
  private readonly logger = new Logger(MockAiProvider.name);

  async summarize(thread: {
    subject: string;
    messages: Array<{ sender: string; body: string }>;
  }): Promise<ThreadSummaryResult> {
    const keyPoints: string[] = [];
    const actionItems: string[] = [];

    const lowerSubject = thread.subject.toLowerCase();
    if (lowerSubject.includes('launch') || lowerSubject.includes('release')) {
      keyPoints.push('Release checklist reviewed across engineering and QA teams');
      keyPoints.push('Zero critical path blockers identified for upcoming deployment');
      actionItems.push('Review final staging sign-off by 5:00 PM');
    } else if (lowerSubject.includes('budget') || lowerSubject.includes('finance')) {
      keyPoints.push('Preliminary financial allocations discussed for next quarter');
      keyPoints.push('Variance within expected targets');
      actionItems.push('Submit departmental approvals prior to Friday');
    } else {
      keyPoints.push(`Core discussion regarding "${thread.subject}"`);
      if (thread.messages.length > 0) {
        keyPoints.push(`Latest update from ${thread.messages[thread.messages.length - 1].sender}`);
      }
      actionItems.push('Review discussed items and follow up as needed');
    }

    const summaryText = `The conversation focuses on "${thread.subject}". Across ${thread.messages.length} messages, participants aligned on timeline, milestones, and necessary deliverables.`;

    return {
      summary: validateAiOutput(summaryText),
      keyPoints,
      actionItems,
      sentiment: 'positive',
      promptTokens: 120 + thread.messages.length * 35,
      completionTokens: 80,
    };
  }

  async generateReply(context: {
    subject: string;
    sender: string;
    lastMessage: string;
    tone: string;
    userPrompt?: string;
  }): Promise<ReplyGenerationResult> {
    const sender = context.sender || 'there';
    let body = '';

    switch (context.tone) {
      case 'concise':
        body = `Hi ${sender},\n\nSounds good. I have reviewed the details and agree with the proposed approach.\n\nBest,\nMe`;
        break;
      case 'friendly':
        body = `Hi ${sender},\n\nThanks so much for reaching out! Everything looks wonderful. Looking forward to our next steps.\n\nWarmly,\nMe`;
        break;
      case 'casual':
        body = `Hey ${sender},\n\nAll set on my end! Talk soon.\n\nCheers,\nMe`;
        break;
      case 'professional':
      default:
        body = `Dear ${sender},\n\nThank you for reaching out regarding "${context.subject}". I have reviewed the materials and confirm our alignment. Please let me know if you need any additional details.\n\nSincerely,\nMe`;
        break;
    }

    if (context.userPrompt) {
      // Validate userPrompt against injection
      const sanitizedPrompt = validateAiOutput(context.userPrompt);
      body += `\n\nNote: ${sanitizedPrompt}`;
    }

    return {
      replyText: validateAiOutput(body),
      promptTokens: 150,
      completionTokens: 65,
    };
  }

  async adjustTone(text: string, targetTone: string): Promise<string> {
    const cleanText = text.trim();
    switch (targetTone) {
      case 'concise':
        return validateAiOutput(
          `Noted. I have reviewed your request: "${cleanText.substring(0, 100)}". Will follow up.`,
        );
      case 'friendly':
        return validateAiOutput(
          `Hope you are having a wonderful week! Just wanted to share: ${cleanText}. Warmly!`,
        );
      case 'casual':
        return validateAiOutput(`Hey, following up on this real quick: ${cleanText}. Talk soon!`);
      case 'professional':
      default:
        return validateAiOutput(
          `Dear Team, Please be advised regarding the following matter: ${cleanText}. Best regards.`,
        );
    }
  }

  async transcribeAssist(rawDictation: string, _tone: string): Promise<string> {
    const cleanDictation = validateAiOutput(rawDictation.trim());
    return [
      `Hi there,`,
      ``,
      `Following up based on our recent voice notes:`,
      `• ${cleanDictation}`,
      ``,
      `Please let me know if any updates are needed.`,
      ``,
      `Best regards,`,
    ].join('\n');
  }
}
