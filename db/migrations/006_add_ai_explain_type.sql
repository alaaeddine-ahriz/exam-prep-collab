-- Migration: 006_add_ai_explain_type (PostgreSQL/Supabase version)
-- Description: Update currency_transactions CHECK constraint to include ai_explain type
-- Created: 2025-12-09

-- PostgreSQL allows altering CHECK constraints
-- First drop the old constraint, then add the new one

ALTER TABLE currency_transactions 
DROP CONSTRAINT IF EXISTS currency_transactions_type_check;

ALTER TABLE currency_transactions 
ADD CONSTRAINT currency_transactions_type_check 
CHECK (type IN ('vote', 'answer', 'daily_login', 'practice', 'ai_verify', 'ai_explain', 'initial_balance'));
