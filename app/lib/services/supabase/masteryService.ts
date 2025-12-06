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
import { getSupabaseClient } from "./client";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export class SupabaseMasteryService {
  /**
   * Get all mastery records for a user
   */
  async getMasteryForUser(userId: string): Promise<QuestionMastery[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("question_mastery")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching mastery:", error);
      return [];
    }

    return (data || []).map((row: DBQuestionMastery) =>
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
  async getMasteryForQuestion(
    userId: string,
    questionId: number
  ): Promise<QuestionMastery | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("question_mastery")
      .select("*")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .single();

    if (error || !data) {
      return null;
    }

    return toQuestionMastery(
      data.question_id,
      data.ease_factor,
      data.interval_days,
      data.repetitions,
      data.next_review_at,
      data.last_reviewed_at,
      data.review_count
    );
  }

  /**
   * Update mastery after answering a question
   */
  async updateMastery(dto: UpdateMasteryDTO): Promise<QuestionMastery> {
    const supabase = getSupabaseClient();
    const { userId, questionId, isCorrect, isCramMode = false, cramDays = 7 } = dto;

    // Get existing mastery record
    const { data: existing } = await supabase
      .from("question_mastery")
      .select("*")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .single();

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

      const { error } = await supabase
        .from("question_mastery")
        .update({
          ease_factor: result.easeFactor,
          interval_days: result.intervalDays,
          repetitions: result.repetitions,
          next_review_at: result.nextReviewAt.toISOString(),
          last_reviewed_at: now,
          quality_sum: existing.quality_sum + quality,
          review_count: existing.review_count + 1,
        })
        .eq("id", existing.id);

      if (error) throw error;

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

      const { error } = await supabase.from("question_mastery").insert({
        id: generateId(),
        user_id: userId,
        question_id: questionId,
        ease_factor: result.easeFactor,
        interval_days: result.intervalDays,
        repetitions: result.repetitions,
        next_review_at: result.nextReviewAt.toISOString(),
        last_reviewed_at: now,
        quality_sum: quality,
        review_count: 1,
      });

      if (error) throw error;

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
  async getDueQuestions(userId: string, limit: number = 50): Promise<number[]> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("question_mastery")
      .select("question_id")
      .eq("user_id", userId)
      .lte("next_review_at", now)
      .order("next_review_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching due questions:", error);
      return [];
    }

    return (data || []).map((row: { question_id: number }) => row.question_id);
  }

  /**
   * Get questions for cram mode
   * Prioritizes: unseen > recently failed > low EF > due
   */
  async getCramQuestions(
    userId: string,
    allQuestionIds: number[],
    examDays: number,
    limit: number
  ): Promise<number[]> {
    const masteryList = await this.getMasteryForUser(userId);
    const masteryMap = new Map<number, QuestionMastery>();
    
    for (const m of masteryList) {
      masteryMap.set(m.questionId, m);
    }

    return selectCramQuestions(allQuestionIds, masteryMap, limit, examDays);
  }

  /**
   * Get questions for smart review mode
   * Due questions first, then new, then not due
   */
  async getSmartQuestions(
    userId: string,
    allQuestionIds: number[],
    limit: number
  ): Promise<number[]> {
    const masteryList = await this.getMasteryForUser(userId);
    const masteryMap = new Map<number, QuestionMastery>();
    
    for (const m of masteryList) {
      masteryMap.set(m.questionId, m);
    }

    return selectSmartQuestions(allQuestionIds, masteryMap, limit);
  }

  /**
   * Get overall mastery statistics for a user
   */
  async getOverallMastery(
    userId: string,
    totalQuestions: number
  ): Promise<MasteryStats> {
    const supabase = getSupabaseClient();
    const now = new Date();

    const { data, error } = await supabase
      .from("question_mastery")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching mastery stats:", error);
      return {
        totalQuestions,
        newCount: totalQuestions,
        learningCount: 0,
        reviewingCount: 0,
        masteredCount: 0,
        averageEaseFactor: 2.5,
        dueToday: 0,
        overduCount: 0,
      };
    }

    const records = data || [];
    const reviewedQuestionIds = new Set(records.map((r: DBQuestionMastery) => r.question_id));

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
      dueToday: dueToday + overdueCount, // Include overdue in "due today"
      overduCount: overdueCount,
    };
  }
}

// Export singleton instance
export const masteryService = new SupabaseMasteryService();
