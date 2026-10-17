import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { MailService } from './mail.service';
import { OutboxWriteService } from './outbox-write.service';
import {
  CreateLabelDto,
  ListThreadsQueryDto,
  SendMessageDto,
  UpdateThreadDto,
} from './dto/mail.dto';
import { BulkModifyThreadsDto, ModifyThreadActionDto } from './dto/outbox-write.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimit, RateLimiterGuard } from '../../common/guards/rate-limiter.guard';

@ApiTags('Mail')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RateLimiterGuard)
@Controller()
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly outboxWriteService: OutboxWriteService,
  ) {}

  @Get('threads')
  @ApiOperation({ summary: 'List threads with pagination, folder, or account filter' })
  async listThreads(@Req() req: Request, @Query() query: ListThreadsQueryDto) {
    return this.mailService.listThreads(req.user!.userId, query);
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Get thread details and all constituent messages' })
  async getThread(@Req() req: Request, @Param('id') id: string) {
    return this.mailService.getThread(req.user!.userId, id);
  }

  @Patch('threads/:id')
  @ApiOperation({ summary: 'Update thread flags or folder' })
  async updateThread(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateThreadDto) {
    return this.mailService.updateThread(req.user!.userId, id, dto);
  }

  @Patch('threads/:id/modify')
  @ApiHeader({ name: 'idempotency-key', required: true })
  @ApiOperation({
    summary:
      'Modify thread (read/unread, star, archive, trash, label) requiring Idempotency-Key with provider confirmation',
  })
  async modifyThread(
    @Req() req: Request,
    @Param('id') id: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() dto: ModifyThreadActionDto,
  ) {
    return this.outboxWriteService.executeWrite(req.user!.userId, id, idempotencyKey, dto);
  }

  @Post('threads/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({ name: 'idempotency-key', required: true })
  @ApiOperation({
    summary: 'Perform bulk actions across multiple threads requiring Idempotency-Key',
  })
  async bulkModifyThreads(
    @Req() req: Request,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() dto: BulkModifyThreadsDto,
  ) {
    return this.outboxWriteService.executeBulkWrite(req.user!.userId, idempotencyKey, dto);
  }

  @Get('operations/:id')
  @ApiOperation({ summary: 'Poll status and result of an outbox write operation' })
  async getOperationStatus(@Req() req: Request, @Param('id') id: string) {
    return this.outboxWriteService.getOperationStatus(req.user!.userId, id);
  }

  @Post('operations/:id/undo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Undo an operation by executing its inverse action' })
  async undoOperation(@Req() req: Request, @Param('id') id: string) {
    return this.outboxWriteService.undoOperation(req.user!.userId, id);
  }

  @Delete('threads/:id')
  @ApiOperation({ summary: 'Move thread to trash' })
  async deleteThread(@Req() req: Request, @Param('id') id: string) {
    return this.mailService.deleteThread(req.user!.userId, id);
  }

  @Post('mail/send')
  @HttpCode(HttpStatus.OK)
  @RateLimit(30, 60)
  @ApiOperation({ summary: 'Send an email message' })
  async sendMessage(@Req() req: Request, @Body() dto: SendMessageDto) {
    return this.mailService.sendMessage(req.user!.userId, dto);
  }

  @Get('labels')
  @ApiOperation({ summary: 'List mail labels' })
  async listLabels(@Req() req: Request, @Query('accountId') accountId?: string) {
    return this.mailService.listLabels(req.user!.userId, accountId);
  }

  @Post('labels')
  @ApiOperation({ summary: 'Create a new mail label' })
  async createLabel(@Req() req: Request, @Body() dto: CreateLabelDto) {
    return this.mailService.createLabel(req.user!.userId, dto);
  }
}
