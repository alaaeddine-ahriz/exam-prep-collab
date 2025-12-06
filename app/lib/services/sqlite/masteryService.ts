import {
  QuestionMastery,
  MasteryStats,
  DBQuestionMastery,
  UpdateMasteryDTO,
} from "../types";
import {
  updateSM2,
  toQuestionMastery,
  getMasteryLevel,
  selectCramQuestions,
  selectSmartQuestions,
} from "../spacedRepetition";
import { getDatabase } from "./database";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Ensure user exists before creating mastery records
 */
function ensureUserExists(userId: string): void {
  const db = getDatabase();
  
  const existingUser = db.prepare(
    "SELECT id FROM users WHERE id = ?"
  ).get(userId);
  
  if (!existingUser) {
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

export class SQLiteMasteryService {
  /**
   * Get all mastery records for a user
   */
  getMasteryForUser(userId: string): QuestionMastery[] {
    const db = getDatabase();

    const rows = db
      .prepare("SELECT * FROM question_mastery WHERE user_id = ?")
      .all(userId) as DBQuestionMastery[];

    return rows.map((row) =>
      toQuestionMastery(
        row.question_id,
        row.ease_factor,
        row.interval_days,
        row.repetitions,
        row.next_review_at,
        row.last_reviewed_at,
        row.review_count
      )
    );
  }

  /**
   * Get mastery for a specific question
   */
  getMasteryForQuestion(
    userId: string,
    questionId: number
  ): QuestionMastery | null {
    const db = getDatabase();

    const row = db
      .prepare(
        "SELECT * FROM question_mastery WHERE user_id = ? AND question_id = ?"
      )
      .get(userId, questionId) as DBQuestionMastery | undefined;

    if (!row) {
      return null;
    }

    return toQuestionMastery(
      row.question_id,
      row.ease_factor,
      row.interval_days,
      row.repetitions,
      row.next_review_at,
      row.last_reviewed_at,
      row.review_count
    );
  }

  /**
   * Update mastery after answering a question
   */
  updateMastery(dto: UpdateMasteryDTO): QuestionMastery {
    const db = getDatabase();
    const { userId, questionId, isCorrect, isCramMode = false, cramDays = 7 } = dto;

    // Ensure user exists first
    ensureUserExists(userId);

    // Get existing mastery record
    const existing = db
      .prepare(
        "SELECT * FROM question_mastery WHERE user_id = ? AND question_id = ?"
      )
      .get(userId, questionId) as DBQuestionMastery | undefined;

    const quality = isCorrect ? 4 : 1;
    const now = new Date().toISOString();

    if (existing) {
      // Update existing record
      const result = updateSM2(
        existing.ease_factor,
        existing.interval_days,
        existing.repetitions,
        isCorrect,
        isCramMode,
        cramDays
      );

      db.prepare(`
        UPDATE question_mastery 
        SET ease_factor = ?, interval_days = ?, repetitions = ?,
            next_review_at = ?, last_reviewed_at = ?,
            quality_sum = ?, review_count = ?
        WHERE id = ?
      `).run(
        result.easeFactor,
        result.intervalDays,
        result.repetitions,
        result.nextReviewAt.toISOString(),
        now,
        existing.quality_sum + quality,
        existing.review_count + 1,
        existing.id
      );

      return toQuestionMastery(
        questionId,
        result.easeFactor,
        result.intervalDays,
        result.repetitions,
        result.nextReviewAt.toISOString(),
        now,
        existing.review_count + 1
      );
    } else {
      // Create new record
      const result = updateSM2(2.5, 0, 0, isCorrect, isCramMode, cramDays);
      const id = generateId();

      db.prepare(`
        INSERT INTO question_mastery 
        (id, user_id, question_id, ease_factor, interval_days, repetitions,
         next_review_at, last_reviewed_at, quality_sum, review_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        questionId,
        result.easeFactor,
        result.intervalDays,
        result.repetitions,
        result.nextReviewAt.toISOString(),
        now,
        quality,
        1
      );

      return toQuestionMastery(
        questionId,
        result.easeFactor,
        result.intervalDays,
        result.repetitions,
        result.nextReviewAt.toISOString(),
        now,
        1
      );
    }
  }

  /**
   * Get questions that are due for review
   */
  getDueQuestions(userId: string, limit: number = 50): number[] {
    const db = getDatabase();
    const now = new Date().toISOString();

    const rows = db
      .prepare(`
        SELECT question_id FROM question_mastery
        WHERE user_id = ? AND next_review_at <= ?
        ORDER BY next_review_at ASC
        LIMIT ?
      `)
      .all(userId, now, limit) as { question_id: number }[];

    return rows.map((row) => row.question_id);
  }

  /**
   * Get questions for cram mode
   */
  getCramQuestions(
    userId: string,
    allQuestionIds: number[],
    examDays: number,
    limit: number
  ): number[] {
    const masteryList = this.getMasteryForUser(userId);
    const masteryMap = new Map<number, QuestionMastery>();

    for (const m of masteryList) {
      masteryMap.set(m.questionId, m);
    }

    return selectCramQuestions(allQuestionIds, masteryMap, limit, examDays);
  }

  /**
   * Get questions for smart review mode
   */
  getSmartQuestions(
    userId: string,
    allQuestionIds: number[],
    limit: number
  ): number[] {
    const masteryList = this.getMasteryForUser(userId);
    const masteryMap = new Map<number, QuestionMastery>();

    for (const m of masteryList) {
      masteryMap.set(m.questionId, m);
    }

    return selectSmartQuestions(allQuestionIds, masteryMap, limit);
  }

  /**
   * Get overall mastery statistics for a user
   */
  getOverallMastery(userId: string, totalQuestions: number): MasteryStats {
    const db = getDatabase();
    const now = new Date();

    const records = db
      .prepare("SELECT * FROM question_mastery WHERE user_id = ?")
      .all(userId) as DBQuestionMastery[];

    const reviewedQuestionIds = new Set(records.map((r) => r.question_id));

    let learningCount = 0;
    let reviewingCount = 0;
    let masteredCount = 0;
    let easeFactorSum = 0;
    let dueToday = 0;
    let overdueCount = 0;

    for (const record of records) {
      const level = getMasteryLevel(
        record.repetitions,
        record.ease_factor,
        record.review_count
      );

      switch (level) {
        case "learning":
          learningCount++;
          break;
        case "reviewing":
          reviewingCount++;
          break;
        case "mastered":
          masteredCount++;
          break;
      }

      easeFactorSum += record.ease_factor;

      if (record.next_review_at) {
        const nextReview = new Date(record.next_review_at);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (nextReview < now) {
          overdueCount++;
        }
        if (nextReview >= today && nextReview < tomorrow) {
          dueToday++;
        }
      }
    }

    const newCount = totalQuestions - reviewedQuestionIds.size;

    return {
      totalQuestions,
      newCount,
      learningCount,
      reviewingCount,
      masteredCount,
      averageEaseFactor: records.length > 0 ? easeFactorSum / records.length : 2.5,
      dueToday: dueToday + overdueCount,
      overduCount: overdueCount,
    };
  }
}

// Export singleton instance
export const sqliteMasteryService = new SQLiteMasteryService();
