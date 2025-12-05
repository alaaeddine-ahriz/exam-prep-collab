-- Migration: 001_initial_schema (SQLite version)
-- Description: Initial database schema for ExamPrep
-- Created: 2025-01-01

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  streak INTEGER DEFAULT 0,
  last_active TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Questions Table
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('mcq', 'saq')),
  question TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MCQ Options Table
-- ============================================
CREATE TABLE IF NOT EXISTS mcq_options (
  id TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  PRIMARY KEY (id, question_id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- ============================================
-- SAQ Answers Table
-- ============================================
CREATE TABLE IF NOT EXISTS saq_answers (
  id TEXT PRIMARY KEY,
  question_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- ============================================
-- Votes Table
-- ============================================
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  option_id TEXT,
  answer_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE(user_id, question_id)
);

-- ============================================
-- User History Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK(question_type IN ('mcq', 'saq')),
  user_answer TEXT NOT NULL,
  consensus_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  answered_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_mcq_options_question ON mcq_options(question_id);
CREATE INDEX IF NOT EXISTS idx_saq_answers_question ON saq_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_question ON votes(question_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_question ON user_history(question_id);

