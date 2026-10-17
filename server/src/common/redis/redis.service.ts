import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from '../../config/env.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly fallbackMemory = new Map<string, { val: string; expiresAt: number }>();

  onModuleInit() {
    try {
      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't block startup if Redis is offline locally
        lazyConnect: true,
      });

      this.client.connect().catch((err) => {
        this.logger.warn(`Redis connection failed (${err.message}). Using in-memory fallback.`);
        this.client = null;
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}. Operating in fallback mode.`);
      });
    } catch (err: any) {
      this.logger.warn(`Redis initialization skipped: ${err.message}`);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  isReady(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch (_) {
        // Fallback
      }
    }
    const entry = this.fallbackMemory.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.fallbackMemory.delete(key);
      return null;
    }
    return entry.val;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (_) {
        // Fallback
      }
    }
    this.fallbackMemory.set(key, {
      val: value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (_) {
        // Fallback
      }
    }
    this.fallbackMemory.delete(key);
  }

  /**
   * Sliding window / Fixed window rate limiter
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; resetSeconds: number }> {
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
      } catch (_) {
        // Fallback to memory
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
}
