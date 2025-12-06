-- Migration: 002_spaced_repetition (SQLite version)
-- Description: Add spaced repetition (SM-2) support for question mastery tracking
-- Created: 2025-12-06

-- ============================================
-- Question Mastery Table
-- ============================================
-- Tracks spaced repetition data for each user-question pair
-- Implements SM-2 algorithm with support for cram mode
CREATE TABLE IF NOT EXISTS question_mastery (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  ease_factor REAL DEFAULT 2.5,
  interval_days REAL DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_at TEXT,
  last_reviewed_at TEXT,
  quality_sum INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  UNIQUE(user_id, question_id)
);

-- ============================================
-- Indexes for Question Mastery
-- ============================================
CREATE INDEX IF NOT EXISTS idx_mastery_user ON question_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_question ON question_mastery(question_id);
CREATE INDEX IF NOT EXISTS idx_mastery_next_review ON question_mastery(next_review_at);
CREATE INDEX IF NOT EXISTS idx_mastery_user_next_review ON question_mastery(user_id, next_review_at);
