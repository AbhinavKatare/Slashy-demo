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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_service_1 = require("./ai.service");
const ai_dto_1 = require("./dto/ai.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const rate_limiter_guard_1 = require("../../common/guards/rate-limiter.guard");
let AiController = class AiController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async summarize(req, dto) {
        return this.aiService.summarizeThread(req.user.userId, dto);
    }
    async draftReply(req, dto) {
        return this.aiService.generateReply(req.user.userId, dto);
    }
    async adjustTone(req, dto) {
        return this.aiService.adjustTone(req.user.userId, dto);
    }
    async transcribeAssist(req, dto) {
        return this.aiService.transcribeAssist(req.user.userId, dto);
    }
    async streamReply(req, res, dto) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        let isAborted = false;
        req.on('close', () => {
            isAborted = true;
        });
        try {
            for await (const chunk of this.aiService.streamReplyTokens(req.user.userId, dto)) {
                if (isAborted)
                    break;
                res.write(chunk);
            }
        }
        finally {
            res.end();
        }
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('summarize'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, rate_limiter_guard_1.RateLimit)(20, 60),
    (0, swagger_1.ApiOperation)({ summary: 'Summarize thread key points, sentiment, and action items' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_dto_1.SummarizeThreadDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "summarize", null);
__decorate([
    (0, common_1.Post)('draft-reply'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, rate_limiter_guard_1.RateLimit)(20, 60),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a tone-tailored draft response to a thread' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_dto_1.GenerateReplyDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "draftReply", null);
__decorate([
    (0, common_1.Post)('adjust-tone'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, rate_limiter_guard_1.RateLimit)(20, 60),
    (0, swagger_1.ApiOperation)({ summary: 'Adjust tone of draft text (professional, friendly, concise, casual)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_dto_1.AdjustToneDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "adjustTone", null);
__decorate([
    (0, common_1.Post)('transcribe-assist'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, rate_limiter_guard_1.RateLimit)(20, 60),
    (0, swagger_1.ApiOperation)({ summary: 'Convert raw voice dictation into an organized email draft' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_dto_1.TranscribeAssistDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "transcribeAssist", null);
__decorate([
    (0, common_1.Post)('stream-reply'),
    (0, rate_limiter_guard_1.RateLimit)(10, 60),
    (0, swagger_1.ApiOperation)({
        summary: 'Stream reply draft via Server-Sent Events (SSE) with cancellation support',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, ai_dto_1.GenerateReplyDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "streamReply", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('AI'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rate_limiter_guard_1.RateLimiterGuard),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map