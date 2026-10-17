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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterGuard = exports.RateLimit = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const redis_service_1 = require("../redis/redis.service");
exports.RATE_LIMIT_KEY = 'rate_limit';
const RateLimit = (limit, windowSeconds = 60) => (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, { limit, windowSeconds });
exports.RateLimit = RateLimit;
let RateLimiterGuard = class RateLimiterGuard {
    reflector;
    redisService;
    constructor(reflector, redisService) {
        this.reflector = reflector;
        this.redisService = redisService;
    }
    async canActivate(context) {
        const rateLimit = this.reflector.getAllAndOverride(exports.RATE_LIMIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!rateLimit) {
            return true;
        }
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const path = req.route?.path || req.path;
        const key = `${ip}:${path}`;
        const result = await this.redisService.checkRateLimit(key, rateLimit.limit, rateLimit.windowSeconds);
        res.setHeader('X-RateLimit-Limit', rateLimit.limit);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', result.resetSeconds);
        if (!result.allowed) {
            throw new common_1.HttpException({
                title: 'Too Many Requests',
                detail: `Rate limit of ${rateLimit.limit} requests per ${rateLimit.windowSeconds}s exceeded. Try again in ${result.resetSeconds}s.`,
                code: 'TOO_MANY_REQUESTS',
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
};
exports.RateLimiterGuard = RateLimiterGuard;
exports.RateLimiterGuard = RateLimiterGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        redis_service_1.RedisService])
], RateLimiterGuard);
//# sourceMappingURL=rate-limiter.guard.js.map