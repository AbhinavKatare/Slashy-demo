export declare class SummarizeThreadDto {
    threadId: string;
    redactPii?: boolean;
}
export declare class GenerateReplyDto {
    threadId: string;
    tone?: 'professional' | 'friendly' | 'concise' | 'casual';
    userPrompt?: string;
    redactPii?: boolean;
}
export declare class AdjustToneDto {
    text: string;
    targetTone: 'professional' | 'friendly' | 'concise' | 'casual';
}
export declare class TranscribeAssistDto {
    rawDictation: string;
    tone?: 'professional' | 'friendly' | 'concise' | 'casual';
}
