-- Magic Link Authentication Tables
-- Run this in Supabase SQL Editor

-- Magic links for email login
CREATE TABLE IF NOT EXISTS magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);

-- Sessions for email-authenticated users
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast session lookup
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Cleanup function for expired magic links (run daily via cron)
-- DELETE FROM magic_links WHERE expires_at < NOW() - INTERVAL '1 day';

-- Cleanup function for expired sessions (run weekly)
-- DELETE FROM sessions WHERE expires_at < NOW();
