import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { env } from '../../../config/env.config';
import { RedisService } from '../../../common/redis/redis.service';

export interface SyncJobData {
  accountId: string;
  userId: string;
  provider: 'google' | 'microsoft';
  jobType: 'backfill' | 'incremental' | 'webhook';
  cursor?: string;
  windowDays?: number;
  maxThreads?: number;
}

@Injectable()
export class SyncQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncQueueService.name);

  public backfillQueue: Queue<SyncJobData> | null = null;
  public incrementalQueue: Queue<SyncJobData> | null = null;
  public dlqQueue: Queue<SyncJobData> | null = null;

  // In-memory fallback job queue for local development / testing without Redis
  private readonly memoryJobs: SyncJobData[] = [];

  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    try {
      const redisUrl = new URL(env.REDIS_URL);
      const connection = {
        host: redisUrl.hostname || 'localhost',
        port: parseInt(redisUrl.port || '6379', 10),
        maxRetriesPerRequest: null,
      };

      this.backfillQueue = new Queue('sync-backfill', { connection });
      this.incrementalQueue = new Queue('sync-incremental', { connection });
      this.dlqQueue = new Queue('sync-dlq', { connection });

      this.logger.log('BullMQ queues initialized successfully');
    } catch (err: any) {
      this.logger.warn(`BullMQ initialization falling back to memory queue: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.backfillQueue) await this.backfillQueue.close();
    if (this.incrementalQueue) await this.incrementalQueue.close();
    if (this.dlqQueue) await this.dlqQueue.close();
  }

  /**
   * Enqueue backfill job with idempotency key
   */
  async enqueueBackfill(data: SyncJobData): Promise<string> {
    const jobId = `backfill:${data.accountId}:${data.cursor || 'start'}`;

    if (this.backfillQueue) {
      try {
        const job = await this.backfillQueue.add('backfill-job', data, {
          jobId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: false, // send to inspect
        });
        return job.id || jobId;
      } catch (err: any) {
        this.logger.warn(`Failed to enqueue BullMQ job: ${err.message}. Using memory queue.`);
      }
    }

    this.memoryJobs.push(data);
    return jobId;
  }

  /**
   * Enqueue incremental delta job with deduplication
   */
  async enqueueIncremental(data: SyncJobData): Promise<string> {
    const jobId = `incremental:${data.accountId}:${data.cursor || Date.now()}`;

    if (this.incrementalQueue) {
      try {
        const job = await this.incrementalQueue.add('incremental-job', data, {
          jobId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1500 },
          removeOnComplete: 100,
        });
        return job.id || jobId;
      } catch (err: any) {
        this.logger.warn(`Failed to enqueue incremental BullMQ job: ${err.message}`);
      }
    }

    this.memoryJobs.push(data);
    return jobId;
  }

  /**
   * Forward permanently failed job to Dead Letter Queue
   */
  async sendToDlq(data: SyncJobData, errorReason: string): Promise<void> {
    this.logger.error(`Sending job for account ${data.accountId} to DLQ: ${errorReason}`);
    if (this.dlqQueue) {
      try {
        await this.dlqQueue.add('dlq-poison-pill', { ...data, error: errorReason } as any);
      } catch (_) {}
    }
  }

  getMemoryJobs(): SyncJobData[] {
    return this.memoryJobs;
  }
}
