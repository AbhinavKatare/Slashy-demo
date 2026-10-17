import { AiProvider, ReplyGenerationResult, ThreadSummaryResult } from '../domain/ai-provider.interface';
export declare class MockAiProvider implements AiProvider {
    readonly providerName = "mock";
    private readonly logger;
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
    transcribeAssist(rawDictation: string, _tone: string): Promise<string>;
}
