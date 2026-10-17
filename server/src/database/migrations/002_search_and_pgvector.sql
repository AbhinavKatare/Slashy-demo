-- ============================================================================
-- Migration 002: Advanced Search (Weighted FTS, pg_trgm Trigram, pgvector)
-- ============================================================================

-- Enable trigram extension for fuzzy and prefix name search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Trigram Indexes for Contacts and Senders
CREATE INDEX IF NOT EXISTS idx_messages_sender_name_trgm 
  ON messages USING gin (sender_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_messages_sender_email_trgm 
  ON messages USING gin (sender_email gin_trgm_ops);

-- 2. Trigram Index on Thread Subject for Fast Typo-Tolerant Autocomplete
CREATE INDEX IF NOT EXISTS idx_threads_subject_trgm 
  ON threads USING gin (subject gin_trgm_ops);

-- 3. Composite GIN Index with Weights on Threads
-- Weight 'A' for Subject, Weight 'B' for Snippet
CREATE INDEX IF NOT EXISTS idx_threads_weighted_fts ON threads USING gin (
  (setweight(to_tsvector('english', COALESCE(subject, '')), 'A') ||
   setweight(to_tsvector('english', COALESCE(snippet, '')), 'B'))
);

-- 4. Thread Embeddings Table for Optional Semantic Search (pgvector)
-- Stored ONLY for users who explicitly opt-in with AI privacy consent
CREATE TABLE IF NOT EXISTS thread_embeddings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL UNIQUE REFERENCES threads(id) ON DELETE CASCADE,
  embedding jsonb NOT NULL,
  dimensions integer NOT NULL DEFAULT 1536,
  model_name varchar(128) NOT NULL DEFAULT 'text-embedding-3-small',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_thread_embeddings_user ON thread_embeddings (user_id);

-- Enable RLS on thread_embeddings
ALTER TABLE thread_embeddings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS thread_embeddings_user_isolation ON thread_embeddings;
CREATE POLICY thread_embeddings_user_isolation ON thread_embeddings FOR ALL USING (
  user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
);
