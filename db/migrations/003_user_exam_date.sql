-- Migration: 003_user_exam_date
-- Description: Add exam_date to users table for syncing cram mode across devices
-- Created: 2025-12-06

ALTER TABLE users ADD COLUMN IF NOT EXISTS exam_date TIMESTAMP;
