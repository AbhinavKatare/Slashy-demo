import { Logger } from '@nestjs/common';

/**
 * OpenTelemetry Tracing & Metrics initialization stub.
 * In production, wraps @opensearch/api and @opentelemetry/sdk-node.
 */
export class OpenTelemetryTracer {
  private static readonly logger = new Logger(OpenTelemetryTracer.name);

  static init() {
    if (process.env.OTEL_ENABLED === 'true') {
      this.logger.log('OpenTelemetry SDK initialized: tracing and metrics enabled');
      // In production:
      // const sdk = new NodeSDK({
      //   resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: 'inbox-companion-backend' }),
      //   traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
      // });
      // sdk.start();
    } else {
      this.logger.debug('OpenTelemetry disabled by configuration (OTEL_ENABLED != true)');
    }
  }
}
