export interface ThreadSummaryResult {
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    sentiment: 'positive' | 'neutral' | 'urgent';
    promptTokens: number;
    completionTokens: number;
}
export interface ReplyGenerationResult {
    replyText: string;
    promptTokens: number;
    completionTokens: number;
}
export interface AiProvider {
    readonly providerName: string;
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
