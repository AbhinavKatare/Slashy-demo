import { Controller, Post, Body, Req, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AiService } from './ai.service';
import {
  AdjustToneDto,
  GenerateReplyDto,
  SummarizeThreadDto,
  TranscribeAssistDto,
} from './dto/ai.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimit, RateLimiterGuard } from '../../common/guards/rate-limiter.guard';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RateLimiterGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  @HttpCode(HttpStatus.OK)
  @RateLimit(20, 60)
  @ApiOperation({ summary: 'Summarize thread key points, sentiment, and action items' })
  async summarize(@Req() req: Request, @Body() dto: SummarizeThreadDto) {
    return this.aiService.summarizeThread(req.user!.userId, dto);
  }

  @Post('draft-reply')
  @HttpCode(HttpStatus.OK)
  @RateLimit(20, 60)
  @ApiOperation({ summary: 'Generate a tone-tailored draft response to a thread' })
  async draftReply(@Req() req: Request, @Body() dto: GenerateReplyDto) {
    return this.aiService.generateReply(req.user!.userId, dto);
  }

  @Post('adjust-tone')
  @HttpCode(HttpStatus.OK)
  @RateLimit(20, 60)
  @ApiOperation({ summary: 'Adjust tone of draft text (professional, friendly, concise, casual)' })
  async adjustTone(@Req() req: Request, @Body() dto: AdjustToneDto) {
    return this.aiService.adjustTone(req.user!.userId, dto);
  }

  @Post('transcribe-assist')
  @HttpCode(HttpStatus.OK)
  @RateLimit(20, 60)
  @ApiOperation({ summary: 'Convert raw voice dictation into an organized email draft' })
  async transcribeAssist(@Req() req: Request, @Body() dto: TranscribeAssistDto) {
    return this.aiService.transcribeAssist(req.user!.userId, dto);
  }

  @Post('stream-reply')
  @RateLimit(10, 60)
  @ApiOperation({
    summary: 'Stream reply draft via Server-Sent Events (SSE) with cancellation support',
  })
  async streamReply(@Req() req: Request, @Res() res: Response, @Body() dto: GenerateReplyDto) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Handle client disconnect / cancellation
    let isAborted = false;
    req.on('close', () => {
      isAborted = true;
    });

    try {
      for await (const chunk of this.aiService.streamReplyTokens(req.user!.userId, dto)) {
        if (isAborted) break;
        res.write(chunk);
      }
    } finally {
      res.end();
    }
  }
}
