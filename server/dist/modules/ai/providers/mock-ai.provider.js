"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MockAiProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAiProvider = void 0;
const common_1 = require("@nestjs/common");
const ai_safety_1 = require("../sanitization/ai-safety");
let MockAiProvider = MockAiProvider_1 = class MockAiProvider {
    providerName = 'mock';
    logger = new common_1.Logger(MockAiProvider_1.name);
    async summarize(thread) {
        const keyPoints = [];
        const actionItems = [];
        const lowerSubject = thread.subject.toLowerCase();
        if (lowerSubject.includes('launch') || lowerSubject.includes('release')) {
            keyPoints.push('Release checklist reviewed across engineering and QA teams');
            keyPoints.push('Zero critical path blockers identified for upcoming deployment');
            actionItems.push('Review final staging sign-off by 5:00 PM');
        }
        else if (lowerSubject.includes('budget') || lowerSubject.includes('finance')) {
            keyPoints.push('Preliminary financial allocations discussed for next quarter');
            keyPoints.push('Variance within expected targets');
            actionItems.push('Submit departmental approvals prior to Friday');
        }
        else {
            keyPoints.push(`Core discussion regarding "${thread.subject}"`);
            if (thread.messages.length > 0) {
                keyPoints.push(`Latest update from ${thread.messages[thread.messages.length - 1].sender}`);
            }
            actionItems.push('Review discussed items and follow up as needed');
        }
        const summaryText = `The conversation focuses on "${thread.subject}". Across ${thread.messages.length} messages, participants aligned on timeline, milestones, and necessary deliverables.`;
        return {
            summary: (0, ai_safety_1.validateAiOutput)(summaryText),
            keyPoints,
            actionItems,
            sentiment: 'positive',
            promptTokens: 120 + thread.messages.length * 35,
            completionTokens: 80,
        };
    }
    async generateReply(context) {
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
            const sanitizedPrompt = (0, ai_safety_1.validateAiOutput)(context.userPrompt);
            body += `\n\nNote: ${sanitizedPrompt}`;
        }
        return {
            replyText: (0, ai_safety_1.validateAiOutput)(body),
            promptTokens: 150,
            completionTokens: 65,
        };
    }
    async adjustTone(text, targetTone) {
        const cleanText = text.trim();
        switch (targetTone) {
            case 'concise':
                return (0, ai_safety_1.validateAiOutput)(`Noted. I have reviewed your request: "${cleanText.substring(0, 100)}". Will follow up.`);
            case 'friendly':
                return (0, ai_safety_1.validateAiOutput)(`Hope you are having a wonderful week! Just wanted to share: ${cleanText}. Warmly!`);
            case 'casual':
                return (0, ai_safety_1.validateAiOutput)(`Hey, following up on this real quick: ${cleanText}. Talk soon!`);
            case 'professional':
            default:
                return (0, ai_safety_1.validateAiOutput)(`Dear Team, Please be advised regarding the following matter: ${cleanText}. Best regards.`);
        }
    }
    async transcribeAssist(rawDictation, _tone) {
        const cleanDictation = (0, ai_safety_1.validateAiOutput)(rawDictation.trim());
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
};
exports.MockAiProvider = MockAiProvider;
exports.MockAiProvider = MockAiProvider = MockAiProvider_1 = __decorate([
    (0, common_1.Injectable)()
], MockAiProvider);
//# sourceMappingURL=mock-ai.provider.js.map