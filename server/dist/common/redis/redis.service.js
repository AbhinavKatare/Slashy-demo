"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const env_config_1 = require("../../config/env.config");
let RedisService = RedisService_1 = class RedisService {
    logger = new common_1.Logger(RedisService_1.name);
    client = null;
    fallbackMemory = new Map();
    onModuleInit() {
        try {
            this.client = new ioredis_1.default(env_config_1.env.REDIS_URL, {
                maxRetriesPerRequest: 1,
                retryStrategy: () => null,
                lazyConnect: true,
            });
            this.client.connect().catch((err) => {
                this.logger.warn(`Redis connection failed (${err.message}). Using in-memory fallback.`);
                this.client = null;
            });
            this.client.on('error', (err) => {
                this.logger.warn(`Redis error: ${err.message}. Operating in fallback mode.`);
            });
        }
        catch (err) {
            this.logger.warn(`Redis initialization skipped: ${err.message}`);
            this.client = null;
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
        }
    }
    isReady() {
        return this.client !== null && this.client.status === 'ready';
    }
    async get(key) {
        if (this.client) {
            try {
                return await this.client.get(key);
            }
            catch (_) {
            }
        }
        const entry = this.fallbackMemory.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.fallbackMemory.delete(key);
            return null;
        }
        return entry.val;
    }
    async set(key, value, ttlSeconds) {
        if (this.client) {
            try {
                if (ttlSeconds) {
                    await this.client.set(key, value, 'EX', ttlSeconds);
                }
                else {
                    await this.client.set(key, value);
                }
                return;
            }
            catch (_) {
            }
        }
        this.fallbackMemory.set(key, {
            val: value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity,
        });
    }
    async del(key) {
        if (this.client) {
            try {
                await this.client.del(key);
                return;
            }
            catch (_) {
            }
        }
        this.fallbackMemory.delete(key);
    }
    async checkRateLimit(key, limit, windowSeconds) {
        const redisKey = `ratelimit:${key}`;
        if (this.client) {
            try {
                const current = await this.client.incr(redisKey);
                if (current === 1) {
                    await this.client.expire(redisKey, windowSeconds);
                }
                const ttl = await this.client.ttl(redisKey);
                const remaining = Math.max(0, limit - current);
                return {
                    allowed: current <= limit,
                    remaining,
                    resetSeconds: Math.max(0, ttl),
                };
            }
            catch (_) {
            }
        }
        const now = Date.now();
        const entry = this.fallbackMemory.get(redisKey);
        let count = 1;
        let expiresAt = now + windowSeconds * 1000;
        if (entry && now < entry.expiresAt) {
            count = parseInt(entry.val, 10) + 1;
            expiresAt = entry.expiresAt;
        }
        this.fallbackMemory.set(redisKey, { val: count.toString(), expiresAt });
        const remaining = Math.max(0, limit - count);
        const resetSeconds = Math.ceil((expiresAt - now) / 1000);
        return {
            allowed: count <= limit,
            remaining,
            resetSeconds,
        };
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)()
], RedisService);
//# sourceMappingURL=redis.service.js.map