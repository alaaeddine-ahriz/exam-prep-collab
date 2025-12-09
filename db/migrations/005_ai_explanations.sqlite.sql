-- Migration: 005_ai_explanations (SQLite version)
-- Description: Add table for storing AI-generated explanations for questions
-- Created: 2025-12-09

-- Table: question_explanations
-- Stores AI-generated explanations for why an answer is correct
CREATE TABLE IF NOT EXISTS question_explanations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  explanation TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_explanations_question ON question_explanations(question_id);
CREATE INDEX IF NOT EXISTS idx_question_explanations_user ON question_explanations(user_id);
CREATE INDEX IF NOT EXISTS idx_question_explanations_created ON question_explanations(created_at DESC);
