-- Migration: 002_spaced_repetition
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
  ease_factor REAL DEFAULT 2.5,        -- SM-2 EF (typically 1.3-2.5 range)
  interval_days REAL DEFAULT 0,         -- Days until next review (can be fractional for cram mode)
  repetitions INTEGER DEFAULT 0,        -- Consecutive correct answers
  next_review_at TIMESTAMP,             -- When question is due for review
  last_reviewed_at TIMESTAMP,           -- Last time question was reviewed
  quality_sum INTEGER DEFAULT 0,        -- Sum of quality scores (0-5) for analytics
  review_count INTEGER DEFAULT 0,       -- Total number of reviews
  UNIQUE(user_id, question_id)
);

-- ============================================
-- Indexes for Question Mastery
-- ============================================
CREATE INDEX IF NOT EXISTS idx_mastery_user ON question_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_question ON question_mastery(question_id);
CREATE INDEX IF NOT EXISTS idx_mastery_next_review ON question_mastery(next_review_at);
CREATE INDEX IF NOT EXISTS idx_mastery_user_next_review ON question_mastery(user_id, next_review_at);
