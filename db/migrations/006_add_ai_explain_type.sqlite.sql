-- Migration: 006_add_ai_explain_type (SQLite version)
-- Description: Update currency_transactions CHECK constraint to include ai_explain type
-- Created: 2025-12-09

-- SQLite doesn't support altering CHECK constraints, so we need to recreate the table

-- Step 1: Create new table with updated constraint
CREATE TABLE IF NOT EXISTS currency_transactions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('vote', 'answer', 'daily_login', 'practice', 'ai_verify', 'ai_explain', 'initial_balance')),
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy data from old table
INSERT INTO currency_transactions_new (id, user_id, amount, type, description, created_at)
SELECT id, user_id, amount, type, description, created_at FROM currency_transactions;

-- Step 3: Drop old table
DROP TABLE currency_transactions;

-- Step 4: Rename new table
ALTER TABLE currency_transactions_new RENAME TO currency_transactions;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_currency_transactions_user ON currency_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_transactions_type ON currency_transactions(type);
CREATE INDEX IF NOT EXISTS idx_currency_transactions_created ON currency_transactions(created_at);
