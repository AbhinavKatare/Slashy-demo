import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SyncService } from './sync.service';
import { PullDeltaQueryDto, PushOutboxBatchDto } from './dto/sync.dto';
import { WebhookSyncService } from './webhooks/webhook-sync.service';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { DatabaseService } from '../../database/database.service';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly webhookService: WebhookSyncService,
    private readonly db: DatabaseService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('pull')
  @ApiOperation({ summary: 'Pull delta changes since last sync cursor (Cursor-based pagination)' })
  async pull(@Req() req: Request, @Query() query: PullDeltaQueryDto) {
    return this.syncService.pullDeltas(req.user!.userId, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('push')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Replay batched outbox write operations idempotently' })
  async push(@Req() req: Request, @Body() dto: PushOutboxBatchDto) {
    return this.syncService.processOutboxBatch(req.user!.userId, dto.operations);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('status/:accountId')
  @ApiOperation({ summary: 'Get current sync status, cursor state, and counts for an account' })
  async getSyncStatus(@Req() req: Request, @Param('accountId') accountId: string) {
    const res = await this.db.query(
      `SELECT c.sync_key, c.cursor_value, c.status, c.last_synced_at,
              (SELECT COUNT(*) FROM threads WHERE account_id = $1 AND deleted_at IS NULL) AS thread_count,
              (SELECT COUNT(*) FROM messages WHERE account_id = $1) AS message_count
       FROM sync_cursors c
       WHERE c.account_id = $1 AND c.user_id = $2;`,
      [accountId, req.user!.userId],
      req.user!.userId,
    );

    const cursors = res.rows;
    const threadCount = Number(cursors[0]?.thread_count || 0);
    const messageCount = Number(cursors[0]?.message_count || 0);

    return {
      accountId,
      status: cursors.some((c) => c.status === 'backfilling') ? 'backfilling' : 'idle',
      lastSyncedAt: cursors[0]?.last_synced_at || new Date().toISOString(),
      cursors: cursors.map((c) => ({
        key: c.sync_key,
        value: c.cursor_value,
        status: c.status,
      })),
      stats: {
        threads: threadCount,
        messages: messageCount,
      },
    };
  }

  @Public()
  @Post('webhooks/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google Cloud Pub/Sub Push Notification receiver for Gmail watch' })
  async handleGoogleWebhook(@Body() body: any) {
    return this.webhookService.handleGoogleWebhook(body);
  }

  @Public()
  @Get('webhooks/microsoft')
  @ApiOperation({ summary: 'Microsoft Graph webhook handshake validation token echo' })
  handleMicrosoftHandshake(
    @Query('validationToken') validationToken: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(HttpStatus.OK).send(validationToken || 'ok');
  }

  @Public()
  @Post('webhooks/microsoft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Microsoft Graph Change Notification receiver' })
  async handleMicrosoftWebhook(
    @Body() body: any,
    @Query('validationToken') validationToken?: string,
  ) {
    return this.webhookService.handleMicrosoftWebhook(body, validationToken);
  }
}
