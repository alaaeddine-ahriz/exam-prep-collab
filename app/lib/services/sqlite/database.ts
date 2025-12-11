import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "data", "examprep.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function initializeDatabase(): void {
  const database = getDatabase();

  // Create tables
  database.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      streak INTEGER DEFAULT 0,
      last_active TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      exam_date TEXT
    );

    -- Questions table
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('mcq', 'saq')),
      question TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- MCQ Options table
    CREATE TABLE IF NOT EXISTS mcq_options (
      id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      vote_count INTEGER DEFAULT 0,
      PRIMARY KEY (id, question_id),
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    -- SAQ Answers table
    CREATE TABLE IF NOT EXISTS saq_answers (
      id TEXT PRIMARY KEY,
      question_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      vote_count INTEGER DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    -- Votes table (tracks who voted for what)
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

    -- User History table
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

    -- Question Mastery table (spaced repetition)
    CREATE TABLE IF NOT EXISTS question_mastery (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      ease_factor REAL DEFAULT 2.5,
      interval_days REAL DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      next_review_at TEXT,
      last_reviewed_at TEXT,
      quality_sum INTEGER DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      UNIQUE(user_id, question_id)
    );

    -- User Balance table (currency system)
    CREATE TABLE IF NOT EXISTS user_balance (
      user_id TEXT PRIMARY KEY,
      balance INTEGER NOT NULL DEFAULT 0,
      last_daily_bonus_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Currency Transactions table (audit log)
    CREATE TABLE IF NOT EXISTS currency_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('vote', 'answer', 'daily_login', 'practice', 'ai_verify', 'ai_explain', 'initial_balance')),
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Daily Practice Sessions table
    CREATE TABLE IF NOT EXISTS daily_practice_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      session_date TEXT NOT NULL DEFAULT (DATE('now')),
      session_count INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, session_date)
    );

    -- Question Explanations table (AI-generated explanations)
    CREATE TABLE IF NOT EXISTS question_explanations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create indexes for performance
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
    CREATE INDEX IF NOT EXISTS idx_question_explanations_question ON question_explanations(question_id);
    CREATE INDEX IF NOT EXISTS idx_question_explanations_user ON question_explanations(user_id);
    CREATE INDEX IF NOT EXISTS idx_question_explanations_created ON question_explanations(created_at DESC);
  `);
}

