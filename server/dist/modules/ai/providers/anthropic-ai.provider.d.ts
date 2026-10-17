import { AiProvider, ReplyGenerationResult, ThreadSummaryResult } from '../domain/ai-provider.interface';
export declare class AnthropicAiProvider implements AiProvider {
    readonly providerName = "anthropic";
    private readonly logger;
    constructor();
    summarize(thread: {
        subject: string;
        messages: Array<{
            sender: string;
            body: string;
        }>;
    }): Promise<ThreadSummaryResult>;
    generateReply(context: {
        subject: string;
        sender: string;
        lastMessage: string;
        tone: string;
        userPrompt?: string;
    }): Promise<ReplyGenerationResult>;
    adjustTone(text: string, targetTone: string): Promise<string>;
    transcribeAssist(rawDictation: string, tone: string): Promise<string>;
}
