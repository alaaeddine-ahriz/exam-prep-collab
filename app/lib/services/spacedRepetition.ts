/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * 
 * Based on the SuperMemo 2 algorithm with modifications for:
 * - Binary correct/incorrect input (mapped to quality scores)
 * - Cram mode with compressed intervals for short-term exam prep
 * 
 * SM-2 Algorithm:
 * - Quality (q): 0-5 scale where 0-2 is failure, 3-5 is success
 * - Ease Factor (EF): Starts at 2.5, minimum 1.3
 * - EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * - If q < 3: repetitions = 0, interval = 1
 * - If q >= 3: interval follows progression (1, 6, then EF * previous)
 */

import { MasteryLevel, QuestionMastery } from "./types";

// Constants
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const MAX_EASE_FACTOR = 2.5;

// Cram mode intervals in days (compressed schedule)
const CRAM_INTERVALS = [
  0.042,  // 1 hour
  0.167,  // 4 hours
  0.333,  // 8 hours
  1,      // 1 day
  2,      // 2 days
];

/**
 * Maps binary correct/incorrect to SM-2 quality score (0-5)
 * We use a simplified mapping:
 * - Correct: quality = 4 (correct with some hesitation)
 * - Incorrect: quality = 1 (complete blackout)
 */
export function mapToQuality(isCorrect: boolean): number {
  return isCorrect ? 4 : 1;
}

/**
 * Calculates the new ease factor using SM-2 formula
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
export function calculateNewEaseFactor(
  currentEF: number,
  quality: number
): number {
  const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, newEF));
}

/**
 * Calculates the next review interval in days
 * Standard SM-2 progression:
 * - First correct: 1 day
 * - Second correct: 6 days
 * - Subsequent: previous * EF
 */
export function calculateNextInterval(
  repetitions: number,
  easeFactor: number,
  previousInterval: number
): number {
  if (repetitions === 0) {
    return 1; // First successful review
  } else if (repetitions === 1) {
    return 6; // Second successful review
  } else {
    return Math.round(previousInterval * easeFactor);
  }
}

/**
 * Calculates cram mode interval
 * Uses compressed intervals designed to cover material in 1-7 days
 */
export function calculateCramInterval(
  repetitions: number,
  examDays: number
): number {
  // Scale intervals based on days until exam
  const scaleFactor = Math.max(0.5, examDays / 7);
  
  if (repetitions < CRAM_INTERVALS.length) {
    return CRAM_INTERVALS[repetitions] * scaleFactor;
  }
  
  // For questions reviewed many times, space them out more
  return CRAM_INTERVALS[CRAM_INTERVALS.length - 1] * scaleFactor * (repetitions - CRAM_INTERVALS.length + 2);
}

/**
 * Main SM-2 update function
 * Returns updated mastery parameters after a review
 */
export interface SM2UpdateResult {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date;
}

export function updateSM2(
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number,
  isCorrect: boolean,
  isCramMode: boolean = false,
  examDays: number = 7
): SM2UpdateResult {
  const quality = mapToQuality(isCorrect);
  
  let newEaseFactor: number;
  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Failed: reset repetitions, keep ease factor but might reduce it
    newEaseFactor = calculateNewEaseFactor(currentEaseFactor, quality);
    newRepetitions = 0;
    newInterval = isCramMode ? calculateCramInterval(0, examDays) : 1;
  } else {
    // Passed: update ease factor and increase interval
    newEaseFactor = calculateNewEaseFactor(currentEaseFactor, quality);
    newRepetitions = currentRepetitions + 1;
    
    if (isCramMode) {
      newInterval = calculateCramInterval(newRepetitions, examDays);
    } else {
      newInterval = calculateNextInterval(newRepetitions, newEaseFactor, currentInterval);
    }
  }

  // Calculate next review date
  const nextReviewAt = new Date();
  nextReviewAt.setTime(nextReviewAt.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    easeFactor: newEaseFactor,
    intervalDays: newInterval,
    repetitions: newRepetitions,
    nextReviewAt,
  };
}

/**
 * Determines mastery level based on repetitions and ease factor
 */
export function getMasteryLevel(
  repetitions: number,
  easeFactor: number,
  reviewCount: number
): MasteryLevel {
  if (reviewCount === 0) {
    return "new";
  }
  
  if (repetitions < 3) {
    return "learning";
  }
  
  if (repetitions >= 6 && easeFactor >= 2.0) {
    return "mastered";
  }
  
  return "reviewing";
}

/**
 * Converts database mastery record to frontend QuestionMastery
 */
export function toQuestionMastery(
  questionId: number,
  easeFactor: number,
  intervalDays: number,
  repetitions: number,
  nextReviewAt: string | null,
  lastReviewedAt: string | null,
  reviewCount: number
): QuestionMastery {
  return {
    questionId,
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewAt: nextReviewAt ? new Date(nextReviewAt) : null,
    lastReviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : null,
    masteryLevel: getMasteryLevel(repetitions, easeFactor, reviewCount),
    reviewCount,
  };
}

/**
 * Priority scoring for question selection
 * Lower score = higher priority for review
 */
export function calculatePriority(
  mastery: QuestionMastery | null,
  now: Date = new Date()
): number {
  if (!mastery) {
    // New questions have highest priority (lowest score)
    return 0;
  }

  const { masteryLevel, nextReviewAt, repetitions, easeFactor } = mastery;

  // Base scores by mastery level
  const levelScores: Record<MasteryLevel, number> = {
    new: 0,
    learning: 100,
    reviewing: 200,
    mastered: 300,
  };

  let score = levelScores[masteryLevel];

  // Adjust by overdue status
  if (nextReviewAt) {
    const overdueMs = now.getTime() - nextReviewAt.getTime();
    const overdueDays = overdueMs / (24 * 60 * 60 * 1000);
    
    if (overdueDays > 0) {
      // Overdue items get priority boost
      score -= Math.min(50, overdueDays * 10);
    } else {
      // Not yet due - lower priority
      score += Math.min(100, Math.abs(overdueDays) * 5);
    }
  }

  // Lower ease factor = harder question = higher priority
  score -= (easeFactor - MIN_EASE_FACTOR) * 20;

  // More repetitions = more confident = lower priority
  score += repetitions * 5;

  return score;
}

/**
 * Selects questions for cram mode, prioritizing coverage
 */
export function selectCramQuestions(
  allQuestionIds: number[],
  masteryMap: Map<number, QuestionMastery>,
  count: number,
  examDays: number
): number[] {
  const now = new Date();
  
  // Score all questions
  const scored = allQuestionIds.map((id) => ({
    id,
    priority: calculatePriority(masteryMap.get(id) || null, now),
  }));

  // Sort by priority (lower = higher priority)
  scored.sort((a, b) => a.priority - b.priority);

  // Return top N
  return scored.slice(0, count).map((s) => s.id);
}

/**
 * Selects questions for smart review mode (due questions first)
 */
export function selectSmartQuestions(
  allQuestionIds: number[],
  masteryMap: Map<number, QuestionMastery>,
  count: number
): number[] {
  const now = new Date();

  // Separate into categories
  const due: { id: number; priority: number }[] = [];
  const notDue: { id: number; priority: number }[] = [];
  const newQuestions: number[] = [];

  for (const id of allQuestionIds) {
    const mastery = masteryMap.get(id);
    
    if (!mastery || mastery.reviewCount === 0) {
      newQuestions.push(id);
    } else if (mastery.nextReviewAt && mastery.nextReviewAt <= now) {
      due.push({ id, priority: calculatePriority(mastery, now) });
    } else {
      notDue.push({ id, priority: calculatePriority(mastery, now) });
    }
  }

  // Sort each category by priority
  due.sort((a, b) => a.priority - b.priority);
  notDue.sort((a, b) => a.priority - b.priority);

  // Build result: due first, then new, then not due
  const result: number[] = [];
  
  // Add due questions
  for (const item of due) {
    if (result.length >= count) break;
    result.push(item.id);
  }

  // Add some new questions (up to 30% of remaining slots)
  const newSlots = Math.min(
    Math.ceil((count - result.length) * 0.3),
    newQuestions.length
  );
  for (let i = 0; i < newSlots && result.length < count; i++) {
    result.push(newQuestions[i]);
  }

  // Fill remaining with not-due questions
  for (const item of notDue) {
    if (result.length >= count) break;
    result.push(item.id);
  }

  // If still not enough, add remaining new questions
  for (let i = newSlots; i < newQuestions.length && result.length < count; i++) {
    result.push(newQuestions[i]);
  }

  return result;
}
