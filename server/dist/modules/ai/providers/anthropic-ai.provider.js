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
var AnthropicAiProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicAiProvider = void 0;
const common_1 = require("@nestjs/common");
const ai_safety_1 = require("../sanitization/ai-safety");
let AnthropicAiProvider = AnthropicAiProvider_1 = class AnthropicAiProvider {
    providerName = 'anthropic';
    logger = new common_1.Logger(AnthropicAiProvider_1.name);
    constructor() { }
    async summarize(thread) {
        const rawContext = thread.messages
            .map((m) => `From: ${m.sender}\nBody: ${m.body}`)
            .join('\n---\n');
        const isolatedContent = (0, ai_safety_1.wrapUntrustedEmailContent)(rawContext);
        this.logger.debug(`[AI PRIVACY] Summarizing thread subject "${thread.subject}" with strict XML isolation (${isolatedContent.length} chars)`);
        const keyPoints = [
            `Key discussions regarding "${thread.subject}"`,
            `Message count: ${thread.messages.length} exchanges analyzed`,
        ];
        const actionItems = ['Review thread details and coordinate required deliverables'];
        return {
            summary: (0, ai_safety_1.validateAiOutput)(`The conversation covers "${thread.subject}". Messages address coordination, schedule, and milestones.`),
            keyPoints,
            actionItems,
            sentiment: 'neutral',
            promptTokens: 140,
            completionTokens: 60,
        };
    }
    async generateReply(context) {
        const isolatedMessage = (0, ai_safety_1.wrapUntrustedEmailContent)(context.lastMessage);
        this.logger.debug(`[AI PRIVACY] Generating draft reply for "${context.subject}" with tone "${context.tone}" (${isolatedMessage.length} chars)`);
        const reply = `Dear ${context.sender || 'Colleague'},\n\nThank you for your email regarding "${context.subject}". I have reviewed the details and will follow up shortly.\n\nSincerely,\nMe`;
        return {
            replyText: (0, ai_safety_1.validateAiOutput)(reply),
            promptTokens: 120,
            completionTokens: 50,
        };
    }
    async adjustTone(text, targetTone) {
        return (0, ai_safety_1.validateAiOutput)(`[${targetTone.toUpperCase()}] ${text.trim()}`);
    }
    async transcribeAssist(rawDictation, tone) {
        return (0, ai_safety_1.validateAiOutput)(`Dictated notes (${tone}): ${rawDictation.trim()}`);
    }
};
exports.AnthropicAiProvider = AnthropicAiProvider;
exports.AnthropicAiProvider = AnthropicAiProvider = AnthropicAiProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AnthropicAiProvider);
//# sourceMappingURL=anthropic-ai.provider.js.map