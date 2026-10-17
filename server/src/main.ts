import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as YAML from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

import { AppModule } from './app.module';
import { env } from './config/env.config';
import { JsonLoggerService } from './common/logger/json-logger.service';
import { Rfc7807ExceptionFilter } from './common/filters/rfc7807-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new JsonLoggerService();
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI assets
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Cookie Parsing for refresh token rotation & auth
  app.use(cookieParser());

  // CORS Lockdown
  app.enableCors({
    origin: env.CORS_ORIGINS.includes('*') ? true : env.CORS_ORIGINS,
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

  // Global API Version Prefix
  app.setGlobalPrefix('v1', {
    exclude: ['health', 'ready', 'api/docs', 'api/openapi.yaml'],
  });

  // Global RFC 7807 Exception Filter
  app.useGlobalFilters(new Rfc7807ExceptionFilter());

  // Global Validation Pipe with strict whitelisting
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Structured Logging Interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // OpenAPI Swagger Specification Generation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Inbox Companion API')
    .setDescription(
      'Secure, offline-first personal AI email assistant API. Full support for OIDC, rotating refresh tokens, RLS data isolation, outbox queue replay, and local search.',
    )
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

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Publish /api/openapi.yaml endpoint and write to api/ directory
  const yamlString = YAML.stringify(document);
  const httpAdapter = app.getHttpAdapter();

  httpAdapter.get('/api/openapi.yaml', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    res.send(yamlString);
  });

  // Write openapi.yaml to disk if folder exists
  try {
    const apiDir = path.resolve(__dirname, '../../api');
    if (fs.existsSync(apiDir)) {
      fs.writeFileSync(path.join(apiDir, 'openapi.yaml'), yamlString, 'utf8');
    }
  } catch (err) {
    logger.warn(`Could not write openapi.yaml to disk: ${err}`);
  }

  // Graceful shutdown hooks
  app.enableShutdownHooks();

  await app.listen(env.PORT, '0.0.0.0');
  logger.log(`Inbox Companion backend listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
}

bootstrap();
