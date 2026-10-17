import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PREFIX: z.string().default('v1'),

  // Database
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://postgres:postgres@localhost:5432/inbox_companion_dev'),
  DATABASE_SSL: z.coerce.boolean().default(false),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32)
    .default('dev_jwt_access_secret_fictional_minimum_32_characters_long_12345'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .default('dev_jwt_refresh_secret_fictional_minimum_32_characters_long_67890'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Encryption
  CREDENTIAL_ENCRYPTION_KEY: z
    .string()
    .length(64)
    .default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),

  // CORS & Cookies
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:8080,inboxcompanion://'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z.coerce.boolean().default(false),

  // OIDC
  OIDC_GOOGLE_CLIENT_ID: z.string().default('mock-google-client-id'),
  OIDC_GOOGLE_CLIENT_SECRET: z.string().default('mock-google-client-secret'),
  OIDC_MICROSOFT_CLIENT_ID: z.string().default('mock-ms-client-id'),
  OIDC_MICROSOFT_CLIENT_SECRET: z.string().default('mock-ms-client-secret'),

  // SMTP
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`[ConfigValidationError] Environment validation failed: ${errorDetails}`);
  }
  return result.data;
}

export const env = validateEnv();
