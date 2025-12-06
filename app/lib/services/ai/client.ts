/**
 * Client-side AI API helpers
 * These functions are safe to use in React components
 */

import { GrammarFixResponse, AnswerVerificationResponse } from "./types";

// Re-export types for convenience
export type { GrammarFixResponse, AnswerVerificationResponse } from "./types";

/**
 * Fix grammar and spelling in text
 * @param text The text to fix
 * @returns The fixed text response
 */
export async function fixGrammarAndSpelling(
  text: string
): Promise<GrammarFixResponse> {
  try {
    const response = await fetch("/api/ai/grammar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      // If AI service unavailable, return original text
      return {
        originalText: text,
        fixedText: text,
        wasModified: false,
      };
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fix grammar:", error);
    return {
      originalText: text,
      fixedText: text,
      wasModified: false,
    };
  }
}

/**
 * Extended verification response that includes currency info
 */
export interface VerifyAnswerResult {
  verification: AnswerVerificationResponse;
  insufficientBalance?: boolean;
  newBalance?: number;
}

/**
 * Verify if a user's answer is correct using AI
 * @param userAnswer The user's answer
 * @param correctAnswers Array of correct/top community answers
 * @param questionText The question text
 * @param userId Optional user ID for token deduction
 * @returns Verification result with optional balance info
 */
export async function verifyAnswer(
  userAnswer: string,
  correctAnswers: string[],
  questionText: string,
  userId?: string
): Promise<VerifyAnswerResult> {
  try {
    const response = await fetch("/api/ai/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userAnswer,
        correctAnswers,
        questionText,
        userId,
      }),
    });

    if (response.status === 402) {
      // Insufficient balance
      const data = await response.json();
      return {
        verification: fallbackVerification(userAnswer, correctAnswers),
        insufficientBalance: true,
        newBalance: data.balance,
      };
    }

    if (!response.ok) {
      // Fallback to simple word matching if AI unavailable
      return { verification: fallbackVerification(userAnswer, correctAnswers) };
    }

    const data = await response.json();
    return {
      verification: data,
      newBalance: data.newBalance,
    };
  } catch (error) {
    console.error("Failed to verify answer:", error);
    return { verification: fallbackVerification(userAnswer, correctAnswers) };
  }
}

/**
 * Simple fallback verification using word overlap
 */
function fallbackVerification(
  userAnswer: string,
  correctAnswers: string[]
): AnswerVerificationResponse {
  const userWords = new Set(
    userAnswer
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  let bestMatch = "";
  let bestScore = 0;

  for (const answer of correctAnswers) {
    const answerWords = answer
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const matchCount = answerWords.filter((w) => userWords.has(w)).length;
    const score = matchCount / Math.max(answerWords.length, 1);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = answer;
    }
  }

  const isCorrect = bestScore >= 0.3;

  return {
    isCorrect,
    confidence: bestScore,
    explanation: isCorrect
      ? "Answer has significant overlap with community consensus."
      : "Answer differs significantly from community consensus.",
    matchedAnswer: isCorrect ? bestMatch : undefined,
  };
}

/**
 * Check if AI features are likely available
 * Note: This checks client-side, actual availability depends on server config
 */
export function isAILikelyEnabled(): boolean {
  // We can't check server env from client, so we assume it might be enabled
  // The actual API will gracefully fail if not configured
  return true;
}
