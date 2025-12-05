-- Migration: 001_initial_schema
-- Description: Initial database schema for ExamPrep
-- Created: 2025-01-01

-- ============================================
-- Users Table
-- ============================================
-- Stores user account information
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  streak INTEGER DEFAULT 0,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Questions Table
-- ============================================
-- Stores all questions (both MCQ and SAQ)
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('mcq', 'saq')),
  question TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MCQ Options Table
-- ============================================
-- Stores multiple choice options for MCQ questions
CREATE TABLE IF NOT EXISTS mcq_options (
  id TEXT NOT NULL,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  PRIMARY KEY (id, question_id)
);

-- ============================================
-- SAQ Answers Table
-- ============================================
-- Stores community-submitted answers for SAQ questions
CREATE TABLE IF NOT EXISTS saq_answers (
  id TEXT PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Votes Table
-- ============================================
-- Tracks which users voted for which answers
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_id TEXT,
  answer_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);

-- ============================================
-- User History Table
-- ============================================
-- Tracks user's practice session history
CREATE TABLE IF NOT EXISTS user_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK(question_type IN ('mcq', 'saq')),
  user_answer TEXT NOT NULL,
  consensus_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

