import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env.config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: Pool;

  onModuleInit() {
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX,
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

  getPool(): Pool {
    return this.pool;
  }

  /**
   * Run a query with optional user context for Row-Level Security
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params: any[] = [],
    userId?: string,
  ): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      if (userId) {
        await client.query(`SET LOCAL app.current_user_id = $1`, [userId]);
      }
      return await client.query<T>(text, params);
    } finally {
      client.release();
    }
  }

  /**
   * Run operations within a transaction with user RLS context
   */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>, userId?: string): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      if (userId) {
        await client.query(`SET LOCAL app.current_user_id = $1`, [userId]);
      }
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations(): Promise<void> {
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
    } catch (err: any) {
      await client.query('ROLLBACK');
      this.logger.error(`Migration failure: ${err.message}`, err.stack);
      throw err;
    } finally {
      client.release();
    }
  }
}
