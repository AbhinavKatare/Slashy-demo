import { Request, Response } from 'express';
import { AiService } from './ai.service';
import { AdjustToneDto, GenerateReplyDto, SummarizeThreadDto, TranscribeAssistDto } from './dto/ai.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    summarize(req: Request, dto: SummarizeThreadDto): Promise<{
        threadId: string;
        subject: any;
        summary: string;
        keyPoints: string[];
        actionItems: string[];
        sentiment: "positive" | "neutral" | "urgent";
    }>;
    draftReply(req: Request, dto: GenerateReplyDto): Promise<{
        threadId: string;
        tone: "professional" | "friendly" | "concise" | "casual";
        suggestedSubject: string;
        suggestedBody: string;
    }>;
    adjustTone(req: Request, dto: AdjustToneDto): Promise<{
        targetTone: "professional" | "friendly" | "concise" | "casual";
        adjustedText: string;
    }>;
    transcribeAssist(req: Request, dto: TranscribeAssistDto): Promise<{
        tone: "professional" | "friendly" | "concise" | "casual";
        draftText: string;
    }>;
    streamReply(req: Request, res: Response, dto: GenerateReplyDto): Promise<void>;
}
