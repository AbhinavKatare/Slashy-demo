"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Rfc7807ExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rfc7807ExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let Rfc7807ExceptionFilter = Rfc7807ExceptionFilter_1 = class Rfc7807ExceptionFilter {
    logger = new common_1.Logger(Rfc7807ExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let title = 'Internal Server Error';
        let detail = 'An unexpected server error occurred.';
        let code = 'INTERNAL_ERROR';
        let errors;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                detail = res;
                title = exception.name;
            }
            else if (typeof res === 'object' && res !== null) {
                const body = res;
                title = body.title || exception.name || title;
                detail = body.detail || body.message || detail;
                code = body.code || this.mapStatusToCode(status);
                if (Array.isArray(body.message)) {
                    errors = this.groupValidationErrors(body.message);
                    detail = 'One or more request fields failed validation.';
                    code = 'VALIDATION_ERROR';
                }
                else if (body.errors) {
                    errors = body.errors;
                }
            }
        }
        else if (exception instanceof Error) {
            detail = exception.message;
            this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
        }
        const problem = {
            type: `https://api.inboxcompanion.app/errors/${code.toLowerCase().replace(/_/g, '-')}`,
            title,
            status,
            detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
            instance: request.originalUrl || request.url,
            code,
            timestamp: new Date().toISOString(),
        };
        if (errors) {
            problem.errors = errors;
        }
        response.status(status).contentType('application/problem+json').json(problem);
    }
    mapStatusToCode(status) {
        switch (status) {
            case common_1.HttpStatus.BAD_REQUEST:
                return 'BAD_REQUEST';
            case common_1.HttpStatus.UNAUTHORIZED:
                return 'UNAUTHORIZED';
            case common_1.HttpStatus.FORBIDDEN:
                return 'FORBIDDEN';
            case common_1.HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';
            case common_1.HttpStatus.CONFLICT:
                return 'CONFLICT';
            case common_1.HttpStatus.UNPROCESSABLE_ENTITY:
                return 'UNPROCESSABLE_ENTITY';
            case common_1.HttpStatus.TOO_MANY_REQUESTS:
                return 'TOO_MANY_REQUESTS';
            default:
                return 'INTERNAL_SERVER_ERROR';
        }
    }
    groupValidationErrors(messages) {
        const grouped = {};
        for (const msg of messages) {
            const parts = msg.split(' ');
            const field = parts[0] || 'general';
            if (!grouped[field]) {
                grouped[field] = [];
            }
            grouped[field].push(msg);
        }
        return grouped;
    }
};
exports.Rfc7807ExceptionFilter = Rfc7807ExceptionFilter;
exports.Rfc7807ExceptionFilter = Rfc7807ExceptionFilter = Rfc7807ExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], Rfc7807ExceptionFilter);
//# sourceMappingURL=rfc7807-exception.filter.js.map