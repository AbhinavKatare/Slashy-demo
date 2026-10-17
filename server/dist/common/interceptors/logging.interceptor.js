"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const json_logger_service_1 = require("../logger/json-logger.service");
let LoggingInterceptor = class LoggingInterceptor {
    logger = new common_1.Logger('HTTP');
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        const { method, originalUrl, ip } = req;
        const userAgent = req.get('user-agent') || '';
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const duration = Date.now() - startTime;
                const statusCode = res.statusCode;
                this.logger.log(JSON.stringify({
                    type: 'HTTP_ACCESS',
                    method,
                    url: originalUrl,
                    statusCode,
                    durationMs: duration,
                    ip,
                    userAgent,
                    query: (0, json_logger_service_1.redactPII)(req.query),
                }));
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                const statusCode = error?.status || 500;
                this.logger.warn(JSON.stringify({
                    type: 'HTTP_ACCESS_ERROR',
                    method,
                    url: originalUrl,
                    statusCode,
                    durationMs: duration,
                    ip,
                    errorMessage: error?.message,
                }));
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map