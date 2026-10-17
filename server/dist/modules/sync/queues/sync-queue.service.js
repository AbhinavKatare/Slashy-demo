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
var SyncQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncQueueService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const env_config_1 = require("../../../config/env.config");
const redis_service_1 = require("../../../common/redis/redis.service");
let SyncQueueService = SyncQueueService_1 = class SyncQueueService {
    redisService;
    logger = new common_1.Logger(SyncQueueService_1.name);
    backfillQueue = null;
    incrementalQueue = null;
    dlqQueue = null;
    memoryJobs = [];
    constructor(redisService) {
        this.redisService = redisService;
    }
    onModuleInit() {
        try {
            const redisUrl = new URL(env_config_1.env.REDIS_URL);
            const connection = {
                host: redisUrl.hostname || 'localhost',
                port: parseInt(redisUrl.port || '6379', 10),
                maxRetriesPerRequest: null,
            };
            this.backfillQueue = new bullmq_1.Queue('sync-backfill', { connection });
            this.incrementalQueue = new bullmq_1.Queue('sync-incremental', { connection });
            this.dlqQueue = new bullmq_1.Queue('sync-dlq', { connection });
            this.logger.log('BullMQ queues initialized successfully');
        }
        catch (err) {
            this.logger.warn(`BullMQ initialization falling back to memory queue: ${err.message}`);
        }
    }
    async onModuleDestroy() {
        if (this.backfillQueue)
            await this.backfillQueue.close();
        if (this.incrementalQueue)
            await this.incrementalQueue.close();
        if (this.dlqQueue)
            await this.dlqQueue.close();
    }
    async enqueueBackfill(data) {
        const jobId = `backfill:${data.accountId}:${data.cursor || 'start'}`;
        if (this.backfillQueue) {
            try {
                const job = await this.backfillQueue.add('backfill-job', data, {
                    jobId,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: 100,
                    removeOnFail: false,
                });
                return job.id || jobId;
            }
            catch (err) {
                this.logger.warn(`Failed to enqueue BullMQ job: ${err.message}. Using memory queue.`);
            }
        }
        this.memoryJobs.push(data);
        return jobId;
    }
    async enqueueIncremental(data) {
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
            }
            catch (err) {
                this.logger.warn(`Failed to enqueue incremental BullMQ job: ${err.message}`);
            }
        }
        this.memoryJobs.push(data);
        return jobId;
    }
    async sendToDlq(data, errorReason) {
        this.logger.error(`Sending job for account ${data.accountId} to DLQ: ${errorReason}`);
        if (this.dlqQueue) {
            try {
                await this.dlqQueue.add('dlq-poison-pill', { ...data, error: errorReason });
            }
            catch (_) { }
        }
    }
    getMemoryJobs() {
        return this.memoryJobs;
    }
};
exports.SyncQueueService = SyncQueueService;
exports.SyncQueueService = SyncQueueService = SyncQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], SyncQueueService);
//# sourceMappingURL=sync-queue.service.js.map