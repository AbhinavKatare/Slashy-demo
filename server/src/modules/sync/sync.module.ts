import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncQueueService } from './queues/sync-queue.service';
import { SyncProcessorService } from './processors/sync-processor.service';
import { WebhookSyncService } from './webhooks/webhook-sync.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [SyncController],
  providers: [SyncService, SyncQueueService, SyncProcessorService, WebhookSyncService],
  exports: [SyncService, SyncQueueService, SyncProcessorService, WebhookSyncService],
})
export class SyncModule {}
