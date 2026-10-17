-- ============================================================================
-- Inbox Companion PostgreSQL Initial Schema & Migrations
-- Complete relational model with UUIDv7, Timestamptz, RLS, and Indexes
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- UUIDv7 Generation Function
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid AS $$
DECLARE
  v_time timestamp with time zone := clock_timestamp();
  v_secs bigint := EXTRACT(EPOCH FROM v_time);
  v_msec bigint := EXTRACT(MILLISECONDS FROM v_time);
  v_epoch_msec bigint := (v_secs * 1000) + (v_msec % 1000);
  v_epoch_hex text := lpad(to_hex(v_epoch_msec), 12, '0');
  v_random bytea := gen_random_bytes(10);
  v_random_hex text := encode(v_random, 'hex');
  v_uuid text := v_epoch_hex || '7' || substr(v_random_hex, 1, 3) ||
                 to_hex((8 + (get_byte(v_random, 0) % 4))) || substr(v_random_hex, 4, 3) ||
                 substr(v_random_hex, 7, 12);
BEGIN
  RETURN v_uuid::uuid;
END;
$$ LANGUAGE plpgsql;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  email varchar(255) NOT NULL UNIQUE,
  display_name varchar(255) NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  deleted_at timestamptz
);

-- 2. Devices Table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name varchar(255) NOT NULL,
  platform varchar(64) NOT NULL,
  app_version varchar(64) NOT NULL,
  push_token text,
  last_active_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 3. Sessions Table (Token Rotation & Replay Family Tracking)
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
  refresh_token_family uuid NOT NULL,
  current_token_hash varchar(255) NOT NULL,
  is_revoked boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  ip_address varchar(64),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 4. Connected Accounts Table (Google / Microsoft OAuth)
CREATE TABLE IF NOT EXISTS connected_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider varchar(64) NOT NULL,
  external_id varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  display_name varchar(255),
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  status varchar(32) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_account_user_provider_ext UNIQUE (user_id, provider, external_id)
);

-- 5. OAuth Credentials Table (AES-256-GCM Encrypted)
CREATE TABLE IF NOT EXISTS oauth_credentials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  connected_account_id uuid NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_access_token text NOT NULL,
  encrypted_refresh_token text NOT NULL,
  encrypted_data_key text,
  iv varchar(64) NOT NULL,
  tag varchar(64) NOT NULL,
  token_type varchar(32) NOT NULL DEFAULT 'Bearer',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_oauth_connected_account UNIQUE (connected_account_id)
);

-- 6. Threads Table
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  external_thread_id varchar(255),
  subject text NOT NULL DEFAULT '',
  snippet text NOT NULL DEFAULT '',
  is_unread boolean NOT NULL DEFAULT true,
  is_starred boolean NOT NULL DEFAULT false,
  folder varchar(64) NOT NULL DEFAULT 'inbox',
  has_attachments boolean NOT NULL DEFAULT false,
  message_count integer NOT NULL DEFAULT 1,
  last_message_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  deleted_at timestamptz
);

-- 7. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  external_message_id varchar(255),
  sender_name varchar(255) NOT NULL,
  sender_email varchar(255) NOT NULL,
  to_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  cc_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  bcc_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_unread boolean NOT NULL DEFAULT true,
  sent_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 8. Message Bodies Table (Partitioned storage for heavy text/HTML)
CREATE TABLE IF NOT EXISTS message_bodies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  message_id uuid NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body_plain text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  snippet text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 9. Attachments Table
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename varchar(255) NOT NULL,
  content_type varchar(128) NOT NULL,
  size_bytes bigint NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 10. Labels Table
CREATE TABLE IF NOT EXISTS labels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  name varchar(128) NOT NULL,
  color_hex varchar(16) NOT NULL DEFAULT '#6366F1',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_user_account_label_name UNIQUE (user_id, account_id, name)
);

-- 11. Thread Labels Junction Table
CREATE TABLE IF NOT EXISTS thread_labels (
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id, label_id)
);

-- 12. Drafts Table
CREATE TABLE IF NOT EXISTS drafts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  reply_thread_id uuid REFERENCES threads(id) ON DELETE SET NULL,
  reply_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  to_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  cc_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  bcc_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  subject text NOT NULL DEFAULT '',
  body_plain text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  attachments_meta jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 13. Outbox Operations Table (Idempotent replay queue)
CREATE TABLE IF NOT EXISTS outbox_operations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  idempotency_key varchar(255) NOT NULL UNIQUE,
  action_type varchar(64) NOT NULL,
  target_id varchar(255) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(32) NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 14. Scheduled Messages Table
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  draft_id uuid NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  timezone varchar(64) NOT NULL DEFAULT 'UTC',
  status varchar(32) NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 15. Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  due_at timestamptz NOT NULL,
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 16. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES threads(id) ON DELETE SET NULL,
  title varchar(255) NOT NULL,
  due_date timestamptz,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 17. Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  location text,
  join_url text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_all_day boolean NOT NULL DEFAULT false,
  attendees jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 18. Sync Cursors Table
CREATE TABLE IF NOT EXISTS sync_cursors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  sync_key varchar(128) NOT NULL,
  cursor_value text,
  status varchar(32) NOT NULL DEFAULT 'idle',
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_account_sync_key UNIQUE (account_id, sync_key)
);

-- 19. Notification Tokens Table
CREATE TABLE IF NOT EXISTS notification_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform varchar(32) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_user_device_token UNIQUE (user_id, token)
);

-- 20. AI Requests Metadata Table (Zero message body stored)
CREATE TABLE IF NOT EXISTS ai_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type varchar(32) NOT NULL,
  tone varchar(32),
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  status varchar(32) NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 21. Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(128) NOT NULL,
  resource_type varchar(64) NOT NULL,
  resource_id varchar(255),
  ip_address varchar(64),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- ============================================================================
-- Indexes (Composite & Partial for High Performance Inbox Queries)
-- ============================================================================

-- Fast Folder View: Fetch threads by user, folder, sorted by timestamp
CREATE INDEX IF NOT EXISTS idx_threads_inbox ON threads (user_id, folder, last_message_at DESC)
WHERE deleted_at IS NULL;

-- Fast Unread Count: Count unread threads per user
CREATE INDEX IF NOT EXISTS idx_threads_unread ON threads (user_id, is_unread)
WHERE is_unread = true AND deleted_at IS NULL;

-- Fast Starred View: Starred threads
CREATE INDEX IF NOT EXISTS idx_threads_starred ON threads (user_id, is_starred, last_message_at DESC)
WHERE is_starred = true AND deleted_at IS NULL;

-- Message Ordering in Threads
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages (user_id, thread_id, sent_at ASC);

-- Outbox Processing: Pending actions by creation time
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_operations (status, created_at ASC)
WHERE status = 'pending';

-- Scheduled Message Dispatch: Pending scheduled sends due for dispatch
CREATE INDEX IF NOT EXISTS idx_scheduled_pending ON scheduled_messages (status, scheduled_at ASC)
WHERE status = 'pending';

-- Calendar Date Range Queries
CREATE INDEX IF NOT EXISTS idx_calendar_range ON calendar_events (user_id, start_time, end_time);

-- Full Text Search on Threads (Subject & Snippet)
CREATE INDEX IF NOT EXISTS idx_threads_fts ON threads USING gin (to_tsvector('english', subject || ' ' || snippet));

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- Keyed by user_id so one user can never read another's data
-- ============================================================================

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'devices', 'sessions', 'connected_accounts', 'oauth_credentials',
    'threads', 'messages', 'message_bodies', 'attachments', 'labels',
    'thread_labels', 'drafts', 'outbox_operations', 'scheduled_messages',
    'reminders', 'tasks', 'calendar_events', 'sync_cursors',
    'notification_tokens', 'ai_requests', 'audit_log'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', tbl || '_user_isolation', tbl);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (
        user_id = NULLIF(current_setting(''app.current_user_id'', true), '''')::uuid
      );',
      tbl || '_user_isolation', tbl
    );
  END LOOP;
END;
$$;
