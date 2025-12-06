-- Migration: 003_user_exam_date (SQLite version)
-- Description: Add exam_date to users table for syncing cram mode across devices
-- Created: 2025-12-06

-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- This will fail silently if the column already exists when run through the migration system
ALTER TABLE users ADD COLUMN exam_date TEXT;
