/**
 * Database Seed Script
 * 
 * Seeds the SQLite database with sample data for development.
 * Run with: npm run db:seed
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { DEFAULT_USER, SAMPLE_QUESTIONS, SAMPLE_HISTORY } from "../db/seed";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "examprep.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

console.log("🗄️  Initializing SQLite database...");

// Read and execute migration
const migrationPath = path.join(process.cwd(), "db", "migrations", "001_initial_schema.sqlite.sql");
const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
db.exec(migrationSQL);

console.log("✅ Schema applied");

// Check if already seeded
const existingQuestions = db.prepare("SELECT COUNT(*) as count FROM questions").get() as { count: number };
if (existingQuestions.count > 0) {
  console.log("⏭️  Database already seeded, skipping...");
  db.close();
  process.exit(0);
}

console.log("🌱 Seeding database...");

// Insert default user
db.prepare(`
  INSERT INTO users (id, name, email, streak)
  VALUES (?, ?, ?, ?)
`).run(DEFAULT_USER.id, DEFAULT_USER.name, DEFAULT_USER.email, DEFAULT_USER.streak);

console.log("👤 Created default user");

// Insert questions
const insertQuestion = db.prepare(`
  INSERT INTO questions (type, question, created_by) VALUES (?, ?, ?)
`);

const insertOption = db.prepare(`
  INSERT INTO mcq_options (id, question_id, text, vote_count) VALUES (?, ?, ?, ?)
`);

const insertSAQAnswer = db.prepare(`
  INSERT INTO saq_answers (id, question_id, text, vote_count, created_by) VALUES (?, ?, ?, ?, ?)
`);

for (const q of SAMPLE_QUESTIONS) {
  const result = insertQuestion.run(q.type, q.question, q.createdBy);
  const qId = result.lastInsertRowid as number;

  if (q.type === "mcq" && "options" in q) {
    for (const opt of q.options) {
      insertOption.run(opt.id, qId, opt.text, opt.votes);
    }
  } else if (q.type === "saq" && "answers" in q) {
    for (const ans of q.answers) {
      insertSAQAnswer.run(ans.id, qId, ans.text, ans.votes, ans.createdBy);
    }
  }
}

console.log("📝 Created questions");

// Insert sample history
const insertHistory = db.prepare(`
  INSERT INTO user_history (id, user_id, question_id, question_type, user_answer, consensus_answer, is_correct)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const h of SAMPLE_HISTORY) {
  insertHistory.run(
    h.id,
    DEFAULT_USER.id,
    h.questionId,
    h.questionType,
    h.userAnswer,
    h.consensusAnswer,
    h.isCorrect ? 1 : 0
  );
}

console.log("📊 Created user history");

db.close();
console.log("✅ Database seeded successfully!");
console.log(`📁 Database location: ${dbPath}`);
