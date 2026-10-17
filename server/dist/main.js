"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const cookieParser = require("cookie-parser");
const YAML = require("yaml");
const fs = require("fs");
const path = require("path");
const app_module_1 = require("./app.module");
const env_config_1 = require("./config/env.config");
const json_logger_service_1 = require("./common/logger/json-logger.service");
const rfc7807_exception_filter_1 = require("./common/filters/rfc7807-exception.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
async function bootstrap() {
    const logger = new json_logger_service_1.JsonLoggerService();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger,
    });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
    app.use(cookieParser());
    app.enableCors({
        origin: env_config_1.env.CORS_ORIGINS.includes('*') ? true : env_config_1.env.CORS_ORIGINS,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Idempotency-Key',
        ],
    });
    app.setGlobalPrefix('v1', {
        exclude: ['health', 'ready', 'api/docs', 'api/openapi.yaml'],
    });
    app.useGlobalFilters(new rfc7807_exception_filter_1.Rfc7807ExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Inbox Companion API')
        .setDescription('Secure, offline-first personal AI email assistant API. Full support for OIDC, rotating refresh tokens, RLS data isolation, outbox queue replay, and local search.')
        .setVersion('1.0.0')
        .addBearerAuth()
        .addTag('Auth', 'OIDC authentication, session management, and token rotation')
        .addTag('Accounts', 'Connected mailbox accounts (Google, Microsoft)')
        .addTag('Mail', 'Threads, messages, message bodies, and sending')
        .addTag('Drafts', 'Autosaved drafts and reply compositions')
        .addTag('Scheduling', 'Scheduled email sends with timezone support')
        .addTag('Sync', 'Cursor-based delta pull and idempotent outbox mutations')
        .addTag('Search', 'Full-text search with ranking and highlighting')
        .addTag('Calendar', 'Calendar events, date ranges, and meeting links')
        .addTag('Tasks', 'Action items linked to email threads')
        .addTag('AI', 'Zero-PII-persistence thread summaries and drafted replies')
        .addTag('Notifications', 'Device push notification tokens')
        .addTag('Admin', 'System metrics, health, and audit logs')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const yamlString = YAML.stringify(document);
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/api/openapi.yaml', (_req, res) => {
        res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
        res.send(yamlString);
    });
    try {
        const apiDir = path.resolve(__dirname, '../../api');
        if (fs.existsSync(apiDir)) {
            fs.writeFileSync(path.join(apiDir, 'openapi.yaml'), yamlString, 'utf8');
        }
    }
    catch (err) {
        logger.warn(`Could not write openapi.yaml to disk: ${err}`);
    }
    app.enableShutdownHooks();
    await app.listen(env_config_1.env.PORT, '0.0.0.0');
    logger.log(`Inbox Companion backend listening on port ${env_config_1.env.PORT} in ${env_config_1.env.NODE_ENV} mode`);
}
bootstrap();
//# sourceMappingURL=main.js.map