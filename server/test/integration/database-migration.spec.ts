import * as fs from 'fs';
import * as path from 'path';

describe('Database Schema & Migrations DDL Verification', () => {
  let ddl: string;

  beforeAll(() => {
    const migrationPath = path.resolve(
      __dirname,
      '../../src/database/migrations/001_initial_schema.sql',
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
    ddl = fs.readFileSync(migrationPath, 'utf8');
  });

  const requiredTables = [
    'users',
    'devices',
    'sessions',
    'connected_accounts',
    'oauth_credentials',
    'threads',
    'messages',
    'message_bodies',
    'attachments',
    'labels',
    'thread_labels',
    'drafts',
    'outbox_operations',
    'scheduled_messages',
    'reminders',
    'tasks',
    'calendar_events',
    'sync_cursors',
    'notification_tokens',
    'ai_requests',
    'audit_log',
  ];

  test.each(requiredTables)('should define table %s with primary key', (tableName) => {
    const regex = new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName}\\s*\\(`, 'i');
    expect(regex.test(ddl)).toBe(true);
  });

  it('should implement uuid_generate_v7 function', () => {
    expect(ddl).toContain('CREATE OR REPLACE FUNCTION uuid_generate_v7()');
  });

  it('should enable Row Level Security (RLS) policies on user data tables', () => {
    expect(ddl).toContain('ENABLE ROW LEVEL SECURITY');
    expect(ddl).toContain('CREATE POLICY');
    expect(ddl).toContain('app.current_user_id');
  });

  it('should define performance composite and partial indexes for inbox queries', () => {
    expect(ddl).toContain('CREATE INDEX IF NOT EXISTS idx_threads_inbox');
    expect(ddl).toContain('CREATE INDEX IF NOT EXISTS idx_threads_unread');
    expect(ddl).toContain('CREATE INDEX IF NOT EXISTS idx_threads_starred');
    expect(ddl).toContain('CREATE INDEX IF NOT EXISTS idx_messages_thread');
    expect(ddl).toContain('CREATE INDEX IF NOT EXISTS idx_outbox_pending');
    expect(ddl).toContain('CREATE INDEX IF NOT EXISTS idx_scheduled_pending');
    expect(ddl).toContain('CREATE INDEX IF NOT EXISTS idx_threads_fts');
  });
});
