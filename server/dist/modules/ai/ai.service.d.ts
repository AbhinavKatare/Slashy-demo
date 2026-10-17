import { DatabaseService } from '../../database/database.service';
import { AdjustToneDto, GenerateReplyDto, SummarizeThreadDto, TranscribeAssistDto } from './dto/ai.dto';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AnthropicAiProvider } from './providers/anthropic-ai.provider';
export declare class AiService {
    private readonly db;
    private readonly mockProvider;
    private readonly anthropicProvider;
    private readonly logger;
    private readonly provider;
    constructor(db: DatabaseService, mockProvider: MockAiProvider, anthropicProvider: AnthropicAiProvider);
    checkAndIncrementQuota(userId: string): Promise<void>;
    summarizeThread(userId: string, dto: SummarizeThreadDto): Promise<{
        threadId: string;
        subject: any;
        summary: string;
        keyPoints: string[];
        actionItems: string[];
        sentiment: "positive" | "neutral" | "urgent";
    }>;
    generateReply(userId: string, dto: GenerateReplyDto): Promise<{
        threadId: string;
        tone: "professional" | "friendly" | "concise" | "casual";
        suggestedSubject: string;
        suggestedBody: string;
    }>;
    adjustTone(userId: string, dto: AdjustToneDto): Promise<{
        targetTone: "professional" | "friendly" | "concise" | "casual";
        adjustedText: string;
    }>;
    transcribeAssist(userId: string, dto: TranscribeAssistDto): Promise<{
        tone: "professional" | "friendly" | "concise" | "casual";
        draftText: string;
    }>;
    streamReplyTokens(userId: string, dto: GenerateReplyDto): AsyncGenerator<string>;
}
