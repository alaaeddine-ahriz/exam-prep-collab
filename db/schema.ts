/**
 * Database Schema Definition
 * 
 * This file contains the declarative schema for the ExamPrep database.
 * It serves as the source of truth for both SQLite and Supabase implementations.
 */

export const SCHEMA_VERSION = "004";

/**
 * Table: users
 * Stores user account information
 */
export const USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  streak INTEGER DEFAULT 0,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exam_date TIMESTAMP
);
`;

/**
 * Table: questions
 * Stores all questions (both MCQ and SAQ)
 */
export const QUESTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('mcq', 'saq')),
  question TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Table: mcq_options
 * Stores multiple choice options for MCQ questions
 */
export const MCQ_OPTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS mcq_options (
  id TEXT NOT NULL,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  PRIMARY KEY (id, question_id)
);
`;

/**
 * Table: saq_answers
 * Stores community-submitted answers for SAQ questions
 */
export const SAQ_ANSWERS_TABLE = `
CREATE TABLE IF NOT EXISTS saq_answers (
  id TEXT PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Table: votes
 * Tracks which users voted for which answers
 */
export const VOTES_TABLE = `
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_id TEXT,
  answer_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);
`;

/**
 * Table: user_history
 * Tracks user's practice session history
 */
export const USER_HISTORY_TABLE = `
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
`;

/**
 * Table: question_mastery
 * Tracks spaced repetition data for each user-question pair
 * Implements SM-2 algorithm with support for cram mode
 */
export const QUESTION_MASTERY_TABLE = `
CREATE TABLE IF NOT EXISTS question_mastery (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  ease_factor REAL DEFAULT 2.5,
  interval_days REAL DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_at TIMESTAMP,
  last_reviewed_at TIMESTAMP,
  quality_sum INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  UNIQUE(user_id, question_id)
);
`;

/**
 * Table: user_balance
 * Tracks each user's current token balance
 */
export const USER_BALANCE_TABLE = `
CREATE TABLE IF NOT EXISTS user_balance (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  last_daily_bonus_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Table: currency_transactions
 * Audit log of all token changes
 */
export const CURRENCY_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS currency_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('vote', 'answer', 'daily_login', 'practice', 'ai_verify', 'initial_balance')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Table: daily_practice_sessions
 * Tracks practice sessions per user per day for free session limits
 */
export const DAILY_PRACTICE_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS daily_practice_sessions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, session_date)
);
`;

/**
 * All tables in creation order (respecting foreign key dependencies)
 */
export const ALL_TABLES = [
  { name: "users", sql: USERS_TABLE },
  { name: "questions", sql: QUESTIONS_TABLE },
  { name: "mcq_options", sql: MCQ_OPTIONS_TABLE },
  { name: "saq_answers", sql: SAQ_ANSWERS_TABLE },
  { name: "votes", sql: VOTES_TABLE },
  { name: "user_history", sql: USER_HISTORY_TABLE },
  { name: "question_mastery", sql: QUESTION_MASTERY_TABLE },
  { name: "user_balance", sql: USER_BALANCE_TABLE },
  { name: "currency_transactions", sql: CURRENCY_TRANSACTIONS_TABLE },
  { name: "daily_practice_sessions", sql: DAILY_PRACTICE_SESSIONS_TABLE },
];

/**
 * Indexes for performance optimization
 */
export const INDEXES = `
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_mcq_options_question ON mcq_options(question_id);
CREATE INDEX IF NOT EXISTS idx_saq_answers_question ON saq_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_question ON votes(question_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_question ON user_history(question_id);
CREATE INDEX IF NOT EXISTS idx_mastery_user ON question_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_question ON question_mastery(question_id);
CREATE INDEX IF NOT EXISTS idx_mastery_next_review ON question_mastery(next_review_at);
CREATE INDEX IF NOT EXISTS idx_mastery_user_next_review ON question_mastery(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_currency_transactions_user ON currency_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_transactions_type ON currency_transactions(type);
CREATE INDEX IF NOT EXISTS idx_currency_transactions_created ON currency_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_practice_sessions_user_date ON daily_practice_sessions(user_id, session_date);
`;

/**
 * Schema interface for type safety
 */
export interface SchemaTypes {
  users: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    streak: number;
    last_active: string;
    created_at: string;
    exam_date: string | null;
  };
  questions: {
    id: number;
    type: "mcq" | "saq";
    question: string;
    created_by: string;
    created_at: string;
  };
  mcq_options: {
    id: string;
    question_id: number;
    text: string;
    vote_count: number;
  };
  saq_answers: {
    id: string;
    question_id: number;
    text: string;
    vote_count: number;
    created_by: string;
    created_at: string;
  };
  votes: {
    id: number;
    user_id: string;
    question_id: number;
    option_id: string | null;
    answer_id: string | null;
    created_at: string;
  };
  user_history: {
    id: string;
    user_id: string;
    question_id: number;
    question_type: "mcq" | "saq";
    user_answer: string;
    consensus_answer: string;
    is_correct: boolean;
    answered_at: string;
  };
  question_mastery: {
    id: string;
    user_id: string;
    question_id: number;
    ease_factor: number;
    interval_days: number;
    repetitions: number;
    next_review_at: string | null;
    last_reviewed_at: string | null;
    quality_sum: number;
    review_count: number;
  };
  user_balance: {
    user_id: string;
    balance: number;
    last_daily_bonus_at: string | null;
    created_at: string;
    updated_at: string;
  };
  currency_transactions: {
    id: number;
    user_id: string;
    amount: number;
    type: "vote" | "answer" | "daily_login" | "practice" | "ai_verify" | "initial_balance";
    description: string | null;
    created_at: string;
  };
  daily_practice_sessions: {
    id: number;
    user_id: string;
    session_date: string;
    session_count: number;
  };
}

