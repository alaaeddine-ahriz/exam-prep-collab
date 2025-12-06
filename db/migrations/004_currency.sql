-- Migration: 004_currency
-- Description: Add currency system tables for token-based rewards
-- Created: 2025-12-06

-- Table: user_balance
-- Tracks each user's current token balance
CREATE TABLE IF NOT EXISTS user_balance (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  last_daily_bonus_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: currency_transactions
-- Audit log of all token changes
CREATE TABLE IF NOT EXISTS currency_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('vote', 'answer', 'daily_login', 'practice', 'ai_verify', 'initial_balance')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: daily_practice_sessions
-- Tracks practice sessions per user per day for free session limits
CREATE TABLE IF NOT EXISTS daily_practice_sessions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, session_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_currency_transactions_user ON currency_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_transactions_type ON currency_transactions(type);
CREATE INDEX IF NOT EXISTS idx_currency_transactions_created ON currency_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_practice_sessions_user_date ON daily_practice_sessions(user_id, session_date);

