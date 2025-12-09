/**
 * Currency Service
 * 
 * Manages token balances, rewards, and spending for the gamification system.
 * Works with both Supabase and SQLite backends.
 */

import { currencyConfig, TransactionType } from "@/config";
import { getSupabaseClient } from "./supabase/client";
import { env } from "../config";
import {
  UserBalance,
  CurrencyTransaction,
  PracticeSessionInfo,
  DBUserBalance,
  DBCurrencyTransaction,
  DBDailyPracticeSession,
} from "./types";

/**
 * Check if the daily bonus can be claimed (hasn't been claimed today)
 */
function canClaimDailyBonus(lastBonusAt: string | null): boolean {
  if (!lastBonusAt) return true;
  
  const lastBonus = new Date(lastBonusAt);
  const today = new Date();
  
  // Check if they're on different calendar days
  return (
    lastBonus.getUTCFullYear() !== today.getUTCFullYear() ||
    lastBonus.getUTCMonth() !== today.getUTCMonth() ||
    lastBonus.getUTCDate() !== today.getUTCDate()
  );
}

/**
 * Get today's date as a string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

// ============================================================================
// Supabase Implementation
// ============================================================================

/**
 * Ensure user exists in Supabase before creating related records
 */
async function ensureUserExistsSupabase(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();
  
  if (!existingUser) {
    // Create a default user record
    const displayName = userId.includes("@") 
      ? userId.split("@")[0] 
      : userId === "local-user" 
        ? "Guest" 
        : "User";
    const email = userId.includes("@") ? userId : `${userId}@local`;
    
    const { error } = await supabase
      .from("users")
      .insert({
        id: userId,
        name: displayName,
        email: email,
      });
    
    if (error && !error.message.includes("duplicate")) {
      console.error("Failed to create user:", error);
    }
  }
}

async function getBalanceSupabase(userId: string): Promise<UserBalance> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from("user_balance")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw new Error(`Failed to get balance: ${error.message}`);
  }
  
  // If no balance record exists, create one with initial balance
  if (!data) {
    return await initializeBalanceSupabase(userId);
  }
  
  const balance = data as DBUserBalance;
  return {
    userId: balance.user_id,
    balance: balance.balance,
    lastDailyBonusAt: balance.last_daily_bonus_at ? new Date(balance.last_daily_bonus_at) : null,
    canClaimDailyBonus: canClaimDailyBonus(balance.last_daily_bonus_at),
  };
}

async function initializeBalanceSupabase(userId: string): Promise<UserBalance> {
  // Ensure user exists before creating balance record
  await ensureUserExistsSupabase(userId);
  
  const supabase = getSupabaseClient();
  const initialBalance = currencyConfig.currency.initialBalance;
  
  // Insert new balance record
  const { error: insertError } = await supabase
    .from("user_balance")
    .insert({
      user_id: userId,
      balance: initialBalance,
      last_daily_bonus_at: null,
    });
  
  if (insertError) {
    throw new Error(`Failed to initialize balance: ${insertError.message}`);
  }
  
  // Log the initial balance transaction
  await logTransactionSupabase(userId, initialBalance, "initial_balance", "Welcome bonus");
  
  return {
    userId,
    balance: initialBalance,
    lastDailyBonusAt: null,
    canClaimDailyBonus: true,
  };
}

async function logTransactionSupabase(
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from("currency_transactions")
    .insert({
      user_id: userId,
      amount,
      type,
      description: description || null,
    });
  
  if (error) {
    console.error("Failed to log transaction:", error);
  }
}

async function addTokensSupabase(
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string
): Promise<UserBalance> {
  const supabase = getSupabaseClient();
  
  // Get current balance first (creates if not exists)
  const current = await getBalanceSupabase(userId);
  
  const newBalance = current.balance + amount;
  
  // Update balance
  const { error } = await supabase
    .from("user_balance")
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  
  if (error) {
    throw new Error(`Failed to add tokens: ${error.message}`);
  }
  
  // Log transaction
  await logTransactionSupabase(userId, amount, type, description);
  
  return {
    ...current,
    balance: newBalance,
  };
}

async function spendTokensSupabase(
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string
): Promise<{ success: boolean; balance: UserBalance }> {
  const current = await getBalanceSupabase(userId);
  
  if (current.balance < amount) {
    return { success: false, balance: current };
  }
  
  const supabase = getSupabaseClient();
  const newBalance = current.balance - amount;
  
  const { error } = await supabase
    .from("user_balance")
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  
  if (error) {
    throw new Error(`Failed to spend tokens: ${error.message}`);
  }
  
  // Log transaction (negative amount for spending)
  await logTransactionSupabase(userId, -amount, type, description);
  
  return {
    success: true,
    balance: {
      ...current,
      balance: newBalance,
    },
  };
}

async function claimDailyBonusSupabase(userId: string): Promise<{ success: boolean; balance: UserBalance }> {
  const current = await getBalanceSupabase(userId);
  
  if (!current.canClaimDailyBonus) {
    return { success: false, balance: current };
  }
  
  const supabase = getSupabaseClient();
  const bonusAmount = currencyConfig.rewards.dailyLogin;
  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from("user_balance")
    .update({
      balance: current.balance + bonusAmount,
      last_daily_bonus_at: now,
      updated_at: now,
    })
    .eq("user_id", userId);
  
  if (error) {
    throw new Error(`Failed to claim daily bonus: ${error.message}`);
  }
  
  await logTransactionSupabase(userId, bonusAmount, "daily_login", "Daily login bonus");
  
  return {
    success: true,
    balance: {
      userId,
      balance: current.balance + bonusAmount,
      lastDailyBonusAt: new Date(now),
      canClaimDailyBonus: false,
    },
  };
}

async function getPracticeSessionInfoSupabase(userId: string): Promise<PracticeSessionInfo> {
  const supabase = getSupabaseClient();
  const today = getTodayDateString();
  
  const { data, error } = await supabase
    .from("daily_practice_sessions")
    .select("session_count")
    .eq("user_id", userId)
    .eq("session_date", today)
    .single();
  
  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get practice sessions: ${error.message}`);
  }
  
  const usedToday = data ? (data as DBDailyPracticeSession).session_count : 0;
  const freeLimit = currencyConfig.limits.freePracticeSessionsPerDay;
  
  return {
    usedToday,
    freeRemaining: Math.max(0, freeLimit - usedToday),
    requiresPayment: usedToday >= freeLimit,
  };
}

async function recordPracticeSessionSupabase(userId: string): Promise<PracticeSessionInfo> {
  const supabase = getSupabaseClient();
  const today = getTodayDateString();
  
  // Try to update existing record first
  const { data: existing } = await supabase
    .from("daily_practice_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("session_date", today)
    .single();
  
  if (existing) {
    await supabase
      .from("daily_practice_sessions")
      .update({ session_count: (existing as DBDailyPracticeSession).session_count + 1 })
      .eq("user_id", userId)
      .eq("session_date", today);
  } else {
    await supabase
      .from("daily_practice_sessions")
      .insert({
        user_id: userId,
        session_date: today,
        session_count: 1,
      });
  }
  
  return getPracticeSessionInfoSupabase(userId);
}

// ============================================================================
// SQLite Implementation (for local development)
// ============================================================================

async function getSQLiteDb() {
  const { getDatabase } = await import("./sqlite/database");
  return getDatabase();
}

/**
 * Ensure user exists in SQLite before creating related records
 */
async function ensureUserExistsSQLite(userId: string): Promise<void> {
  const db = await getSQLiteDb();
  
  const existingUser = db.prepare(
    "SELECT id FROM users WHERE id = ?"
  ).get(userId);
  
  if (!existingUser) {
    // Create a default user record
    const displayName = userId.includes("@") 
      ? userId.split("@")[0] 
      : userId === "local-user" 
        ? "Guest" 
        : "User";
    const email = userId.includes("@") ? userId : `${userId}@local`;
    
    db.prepare(
      "INSERT INTO users (id, name, email) VALUES (?, ?, ?)"
    ).run(userId, displayName, email);
  }
}

async function getBalanceSQLite(userId: string): Promise<UserBalance> {
  const db = await getSQLiteDb();
  
  const row = db.prepare(
    "SELECT * FROM user_balance WHERE user_id = ?"
  ).get(userId) as DBUserBalance | undefined;
  
  if (!row) {
    return await initializeBalanceSQLite(userId);
  }
  
  return {
    userId: row.user_id,
    balance: row.balance,
    lastDailyBonusAt: row.last_daily_bonus_at ? new Date(row.last_daily_bonus_at) : null,
    canClaimDailyBonus: canClaimDailyBonus(row.last_daily_bonus_at),
  };
}

async function initializeBalanceSQLite(userId: string): Promise<UserBalance> {
  // Ensure user exists before creating balance record
  await ensureUserExistsSQLite(userId);
  
  const db = await getSQLiteDb();
  const initialBalance = currencyConfig.currency.initialBalance;
  
  db.prepare(
    "INSERT INTO user_balance (user_id, balance, last_daily_bonus_at) VALUES (?, ?, NULL)"
  ).run(userId, initialBalance);
  
  await logTransactionSQLite(userId, initialBalance, "initial_balance", "Welcome bonus");
  
  return {
    userId,
    balance: initialBalance,
    lastDailyBonusAt: null,
    canClaimDailyBonus: true,
  };
}

async function logTransactionSQLite(
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string
): Promise<void> {
  const db = await getSQLiteDb();
  
  db.prepare(
    "INSERT INTO currency_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)"
  ).run(userId, amount, type, description || null);
}

async function addTokensSQLite(
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string
): Promise<UserBalance> {
  const db = await getSQLiteDb();
  const current = await getBalanceSQLite(userId);
  
  const newBalance = current.balance + amount;
  
  db.prepare(
    "UPDATE user_balance SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  ).run(newBalance, userId);
  
  await logTransactionSQLite(userId, amount, type, description);
  
  return {
    ...current,
    balance: newBalance,
  };
}

async function spendTokensSQLite(
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string
): Promise<{ success: boolean; balance: UserBalance }> {
  const current = await getBalanceSQLite(userId);
  
  if (current.balance < amount) {
    return { success: false, balance: current };
  }
  
  const db = await getSQLiteDb();
  const newBalance = current.balance - amount;
  
  db.prepare(
    "UPDATE user_balance SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  ).run(newBalance, userId);
  
  await logTransactionSQLite(userId, -amount, type, description);
  
  return {
    success: true,
    balance: {
      ...current,
      balance: newBalance,
    },
  };
}

async function claimDailyBonusSQLite(userId: string): Promise<{ success: boolean; balance: UserBalance }> {
  const current = await getBalanceSQLite(userId);
  
  if (!current.canClaimDailyBonus) {
    return { success: false, balance: current };
  }
  
  const db = await getSQLiteDb();
  const bonusAmount = currencyConfig.rewards.dailyLogin;
  const now = new Date().toISOString();
  
  db.prepare(
    "UPDATE user_balance SET balance = ?, last_daily_bonus_at = ?, updated_at = ? WHERE user_id = ?"
  ).run(current.balance + bonusAmount, now, now, userId);
  
  await logTransactionSQLite(userId, bonusAmount, "daily_login", "Daily login bonus");
  
  return {
    success: true,
    balance: {
      userId,
      balance: current.balance + bonusAmount,
      lastDailyBonusAt: new Date(now),
      canClaimDailyBonus: false,
    },
  };
}

async function getPracticeSessionInfoSQLite(userId: string): Promise<PracticeSessionInfo> {
  const db = await getSQLiteDb();
  const today = getTodayDateString();
  
  const row = db.prepare(
    "SELECT session_count FROM daily_practice_sessions WHERE user_id = ? AND session_date = ?"
  ).get(userId, today) as { session_count: number } | undefined;
  
  const usedToday = row ? row.session_count : 0;
  const freeLimit = currencyConfig.limits.freePracticeSessionsPerDay;
  
  return {
    usedToday,
    freeRemaining: Math.max(0, freeLimit - usedToday),
    requiresPayment: usedToday >= freeLimit,
  };
}

async function recordPracticeSessionSQLite(userId: string): Promise<PracticeSessionInfo> {
  // Ensure user exists first
  await ensureUserExistsSQLite(userId);
  
  const db = await getSQLiteDb();
  const today = getTodayDateString();
  
  const existing = db.prepare(
    "SELECT * FROM daily_practice_sessions WHERE user_id = ? AND session_date = ?"
  ).get(userId, today) as DBDailyPracticeSession | undefined;
  
  if (existing) {
    db.prepare(
      "UPDATE daily_practice_sessions SET session_count = ? WHERE user_id = ? AND session_date = ?"
    ).run(existing.session_count + 1, userId, today);
  } else {
    db.prepare(
      "INSERT INTO daily_practice_sessions (user_id, session_date, session_count) VALUES (?, ?, 1)"
    ).run(userId, today);
  }
  
  return getPracticeSessionInfoSQLite(userId);
}

// ============================================================================
// Public API - Routes to appropriate implementation
// ============================================================================

function isSupabase(): boolean {
  return env.dataProvider === "supabase";
}

/**
 * Get user's current balance
 */
export async function getBalance(userId: string): Promise<UserBalance> {
  return isSupabase() 
    ? getBalanceSupabase(userId) 
    : getBalanceSQLite(userId);
}

/**
 * Add tokens to user's balance
 */
export async function addTokens(
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string
): Promise<UserBalance> {
  return isSupabase()
    ? addTokensSupabase(userId, amount, type, description)
    : addTokensSQLite(userId, amount, type, description);
}

/**
 * Spend tokens from user's balance
 * Returns success: false if insufficient balance
 */
export async function spendTokens(
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string
): Promise<{ success: boolean; balance: UserBalance }> {
  return isSupabase()
    ? spendTokensSupabase(userId, amount, type, description)
    : spendTokensSQLite(userId, amount, type, description);
}

/**
 * Claim daily login bonus
 * Returns success: false if already claimed today
 */
export async function claimDailyBonus(userId: string): Promise<{ success: boolean; balance: UserBalance }> {
  return isSupabase()
    ? claimDailyBonusSupabase(userId)
    : claimDailyBonusSQLite(userId);
}

/**
 * Get practice session info for today
 */
export async function getPracticeSessionInfo(userId: string): Promise<PracticeSessionInfo> {
  return isSupabase()
    ? getPracticeSessionInfoSupabase(userId)
    : getPracticeSessionInfoSQLite(userId);
}

/**
 * Record a practice session and return updated info
 */
export async function recordPracticeSession(userId: string): Promise<PracticeSessionInfo> {
  return isSupabase()
    ? recordPracticeSessionSupabase(userId)
    : recordPracticeSessionSQLite(userId);
}

/**
 * Award tokens for casting a vote
 */
export async function awardVoteTokens(userId: string): Promise<UserBalance> {
  return addTokens(userId, currencyConfig.rewards.castVote, "vote", "Voted on an answer");
}

/**
 * Award tokens for submitting an answer
 */
export async function awardAnswerTokens(userId: string): Promise<UserBalance> {
  return addTokens(userId, currencyConfig.rewards.submitAnswer, "answer", "Submitted an answer");
}

/**
 * Spend tokens for an extra practice session
 * Returns success: false if insufficient balance
 */
export async function spendPracticeTokens(userId: string): Promise<{ success: boolean; balance: UserBalance }> {
  return spendTokens(
    userId,
    currencyConfig.costs.practiceSession,
    "practice",
    "Extra practice session"
  );
}

/**
 * Spend tokens for AI verification
 * Returns success: false if insufficient balance
 */
export async function spendAIVerificationTokens(userId: string): Promise<{ success: boolean; balance: UserBalance }> {
  return spendTokens(
    userId,
    currencyConfig.costs.aiVerification,
    "ai_verify",
    "AI answer verification"
  );
}

/**
 * Spend tokens for AI explanation
 * Returns success: false if insufficient balance
 */
export async function spendAIExplanationTokens(userId: string): Promise<{ success: boolean; balance: UserBalance }> {
  return spendTokens(
    userId,
    currencyConfig.costs.aiExplanation,
    "ai_explain",
    "AI answer explanation"
  );
}

/**
 * Get the currency configuration
 */
export function getCurrencyConfig() {
  return currencyConfig;
}

