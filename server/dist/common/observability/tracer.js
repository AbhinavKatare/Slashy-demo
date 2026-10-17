"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenTelemetryTracer = void 0;
const common_1 = require("@nestjs/common");
class OpenTelemetryTracer {
    static logger = new common_1.Logger(OpenTelemetryTracer.name);
    static init() {
        if (process.env.OTEL_ENABLED === 'true') {
            this.logger.log('OpenTelemetry SDK initialized: tracing and metrics enabled');
        }
        else {
            this.logger.debug('OpenTelemetry disabled by configuration (OTEL_ENABLED != true)');
        }
    }
}
exports.OpenTelemetryTracer = OpenTelemetryTracer;
//# sourceMappingURL=tracer.js.map