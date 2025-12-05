/**
 * AI Service Types
 */

export interface GrammarFixRequest {
  text: string;
}

export interface GrammarFixResponse {
  originalText: string;
  fixedText: string;
  wasModified: boolean;
}

export interface AnswerVerificationRequest {
  userAnswer: string;
  correctAnswers: string[]; // Top community answers
  questionText: string;
}

export interface AnswerVerificationResponse {
  isCorrect: boolean;
  confidence: number; // 0-1 score
  explanation: string;
  matchedAnswer?: string; // Which correct answer it matched, if any
}
