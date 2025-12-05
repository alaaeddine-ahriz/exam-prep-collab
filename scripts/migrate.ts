/**
 * Database Migration Script
 * 
 * Applies migrations to the SQLite database.
 * Run with: npm run db:migrate
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "examprep.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

console.log("🗄️  Running migrations...");

// Create migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Get list of migration files
const migrationsDir = path.join(process.cwd(), "db", "migrations");
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith(".sqlite.sql"))
  .sort();

// Get applied migrations
const appliedMigrations = new Set(
  (db.prepare("SELECT name FROM _migrations").all() as { name: string }[])
    .map(m => m.name)
);

// Apply pending migrations
let appliedCount = 0;
for (const file of migrationFiles) {
  const migrationName = file.replace(".sqlite.sql", "");
  
  if (appliedMigrations.has(migrationName)) {
    console.log(`⏭️  Skipping ${migrationName} (already applied)`);
    continue;
  }

  console.log(`📝 Applying ${migrationName}...`);
  
  const migrationPath = path.join(migrationsDir, file);
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
  
  try {
    db.exec(migrationSQL);
    db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(migrationName);
    console.log(`✅ Applied ${migrationName}`);
    appliedCount++;
  } catch (error) {
    console.error(`❌ Failed to apply ${migrationName}:`, error);
    process.exit(1);
  }
}

db.close();

if (appliedCount === 0) {
  console.log("✅ Database is up to date");
} else {
  console.log(`✅ Applied ${appliedCount} migration(s)`);
}

