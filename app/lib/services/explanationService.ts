/**
 * Explanation Service
 * 
 * Manages AI-generated explanations for questions.
 * Works with both Supabase and SQLite backends.
 */

import { getSupabaseClient } from "./supabase/client";
import { env } from "../config";
import {
  QuestionExplanation,
  DBQuestionExplanation,
  CreateExplanationDTO,
} from "./types";

// ============================================================================
// Supabase Implementation
// ============================================================================

async function getExplanationsSupabase(questionId: number): Promise<QuestionExplanation[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from("question_explanations")
    .select("*")
    .eq("question_id", questionId)
    .order("created_at", { ascending: false });
  
  if (error) {
    throw new Error(`Failed to get explanations: ${error.message}`);
  }
  
  return (data || []).map((row: DBQuestionExplanation) => ({
    id: row.id,
    questionId: row.question_id,
    userId: row.user_id,
    explanation: row.explanation,
    createdAt: new Date(row.created_at),
  }));
}

async function createExplanationSupabase(dto: CreateExplanationDTO): Promise<QuestionExplanation> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from("question_explanations")
    .insert({
      question_id: dto.questionId,
      user_id: dto.userId,
      explanation: dto.explanation,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create explanation: ${error.message}`);
  }
  
  const row = data as DBQuestionExplanation;
  return {
    id: row.id,
    questionId: row.question_id,
    userId: row.user_id,
    explanation: row.explanation,
    createdAt: new Date(row.created_at),
  };
}

async function deleteExplanationSupabase(id: number, userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from("question_explanations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId); // Only allow users to delete their own explanations
  
  if (error) {
    throw new Error(`Failed to delete explanation: ${error.message}`);
  }
  
  return true;
}

// ============================================================================
// SQLite Implementation
// ============================================================================

async function getSQLiteDb() {
  const { getDatabase } = await import("./sqlite/database");
  return getDatabase();
}

async function getExplanationsSQLite(questionId: number): Promise<QuestionExplanation[]> {
  const db = await getSQLiteDb();
  
  const rows = db.prepare(
    "SELECT * FROM question_explanations WHERE question_id = ? ORDER BY created_at DESC"
  ).all(questionId) as DBQuestionExplanation[];
  
  return rows.map(row => ({
    id: row.id,
    questionId: row.question_id,
    userId: row.user_id,
    explanation: row.explanation,
    createdAt: new Date(row.created_at),
  }));
}

async function createExplanationSQLite(dto: CreateExplanationDTO): Promise<QuestionExplanation> {
  const db = await getSQLiteDb();
  
  const result = db.prepare(
    "INSERT INTO question_explanations (question_id, user_id, explanation) VALUES (?, ?, ?)"
  ).run(dto.questionId, dto.userId, dto.explanation);
  
  const row = db.prepare(
    "SELECT * FROM question_explanations WHERE id = ?"
  ).get(result.lastInsertRowid) as DBQuestionExplanation;
  
  return {
    id: row.id,
    questionId: row.question_id,
    userId: row.user_id,
    explanation: row.explanation,
    createdAt: new Date(row.created_at),
  };
}

async function deleteExplanationSQLite(id: number, userId: string): Promise<boolean> {
  const db = await getSQLiteDb();
  
  db.prepare(
    "DELETE FROM question_explanations WHERE id = ? AND user_id = ?"
  ).run(id, userId);
  
  return true;
}

// ============================================================================
// Public API
// ============================================================================

function isSupabase(): boolean {
  return env.dataProvider === "supabase";
}

/**
 * Get all explanations for a question
 */
export async function getExplanations(questionId: number): Promise<QuestionExplanation[]> {
  return isSupabase()
    ? getExplanationsSupabase(questionId)
    : getExplanationsSQLite(questionId);
}

/**
 * Create a new explanation
 */
export async function createExplanation(dto: CreateExplanationDTO): Promise<QuestionExplanation> {
  return isSupabase()
    ? createExplanationSupabase(dto)
    : createExplanationSQLite(dto);
}

/**
 * Delete an explanation (only by the user who created it)
 */
export async function deleteExplanation(id: number, userId: string): Promise<boolean> {
  return isSupabase()
    ? deleteExplanationSupabase(id, userId)
    : deleteExplanationSQLite(id, userId);
}
