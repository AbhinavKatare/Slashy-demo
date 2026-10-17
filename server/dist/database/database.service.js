"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const env_config_1 = require("../config/env.config");
const fs = require("fs");
const path = require("path");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    logger = new common_1.Logger(DatabaseService_1.name);
    pool;
    onModuleInit() {
        this.pool = new pg_1.Pool({
            connectionString: env_config_1.env.DATABASE_URL,
            ssl: env_config_1.env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
            min: env_config_1.env.DATABASE_POOL_MIN,
            max: env_config_1.env.DATABASE_POOL_MAX,
        });
        this.pool.on('error', (err) => {
            this.logger.error('Unexpected error on idle PostgreSQL client', err.stack);
        });
    }
    async onModuleDestroy() {
        if (this.pool) {
            await this.pool.end();
        }
    }
    getPool() {
        return this.pool;
    }
    async query(text, params = [], userId) {
        const client = await this.pool.connect();
        try {
            if (userId) {
                await client.query(`SET LOCAL app.current_user_id = $1`, [userId]);
            }
            return await client.query(text, params);
        }
        finally {
            client.release();
        }
    }
    async transaction(fn, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            if (userId) {
                await client.query(`SET LOCAL app.current_user_id = $1`, [userId]);
            }
            const result = await fn(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async runMigrations() {
        const client = await this.pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
          id serial PRIMARY KEY,
          name varchar(255) NOT NULL UNIQUE,
          executed_at timestamptz NOT NULL DEFAULT clock_timestamp()
        );
      `);
            const migrationsDir = path.join(__dirname, 'migrations');
            if (!fs.existsSync(migrationsDir)) {
                this.logger.warn(`Migrations directory not found at: ${migrationsDir}`);
                return;
            }
            const files = fs
                .readdirSync(migrationsDir)
                .filter((f) => f.endsWith('.sql'))
                .sort();
            for (const file of files) {
                const { rows } = await client.query('SELECT name FROM _migrations WHERE name = $1', [file]);
                if (rows.length === 0) {
                    this.logger.log(`Executing migration: ${file}`);
                    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                    await client.query('BEGIN');
                    await client.query(sql);
                    await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                    await client.query('COMMIT');
                    this.logger.log(`Successfully applied migration: ${file}`);
                }
            }
        }
        catch (err) {
            await client.query('ROLLBACK');
            this.logger.error(`Migration failure: ${err.message}`, err.stack);
            throw err;
        }
        finally {
            client.release();
        }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)()
], DatabaseService);
//# sourceMappingURL=database.service.js.map