"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const dotenv = require("dotenv");
dotenv.config();
exports.envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3000),
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    API_PREFIX: zod_1.z.string().default('v1'),
    DATABASE_URL: zod_1.z
        .string()
        .url()
        .default('postgresql://postgres:postgres@localhost:5432/inbox_companion_dev'),
    DATABASE_SSL: zod_1.z.coerce.boolean().default(false),
    DATABASE_POOL_MIN: zod_1.z.coerce.number().default(2),
    DATABASE_POOL_MAX: zod_1.z.coerce.number().default(10),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    JWT_ACCESS_SECRET: zod_1.z
        .string()
        .min(32)
        .default('dev_jwt_access_secret_fictional_minimum_32_characters_long_12345'),
    JWT_REFRESH_SECRET: zod_1.z
        .string()
        .min(32)
        .default('dev_jwt_refresh_secret_fictional_minimum_32_characters_long_67890'),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    CREDENTIAL_ENCRYPTION_KEY: zod_1.z
        .string()
        .length(64)
        .default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
    CORS_ORIGINS: zod_1.z.string().default('http://localhost:3000,http://localhost:8080,inboxcompanion://'),
    COOKIE_DOMAIN: zod_1.z.string().default('localhost'),
    COOKIE_SECURE: zod_1.z.coerce.boolean().default(false),
    OIDC_GOOGLE_CLIENT_ID: zod_1.z.string().default('mock-google-client-id'),
    OIDC_GOOGLE_CLIENT_SECRET: zod_1.z.string().default('mock-google-client-secret'),
    OIDC_MICROSOFT_CLIENT_ID: zod_1.z.string().default('mock-ms-client-id'),
    OIDC_MICROSOFT_CLIENT_SECRET: zod_1.z.string().default('mock-ms-client-secret'),
    SMTP_HOST: zod_1.z.string().default('localhost'),
    SMTP_PORT: zod_1.z.coerce.number().default(1025),
});
function validateEnv() {
    const result = exports.envSchema.safeParse(process.env);
    if (!result.success) {
        const errorDetails = result.error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join(', ');
        throw new Error(`[ConfigValidationError] Environment validation failed: ${errorDetails}`);
    }
    return result.data;
}
exports.env = validateEnv();
//# sourceMappingURL=env.config.js.map