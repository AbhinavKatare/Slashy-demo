import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';
export declare const RATE_LIMIT_KEY = "rate_limit";
export interface RateLimitOptions {
    limit: number;
    windowSeconds: number;
}
export declare const RateLimit: (limit: number, windowSeconds?: number) => import("@nestjs/common").CustomDecorator<string>;
export declare class RateLimiterGuard implements CanActivate {
    private readonly reflector;
    private readonly redisService;
    constructor(reflector: Reflector, redisService: RedisService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
